import { Request, Response } from 'express';
import pool from '../config/database.js';

// Get kitchen orders by status
export const getKitchenOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const user = (req as any).user;

    // For Kitchen/Queue/Kiosk users, MUST have branch_id
    // Admin should not use Kitchen/Queue/Kiosk (they use CMS only)
    let branchId: number | null = null;
    
    if (!user) {
      // No user - return empty (should not happen with authenticateToken)
      console.warn('[Kitchen] ⚠️ No user found in request');
      return res.json({ success: true, data: [] });
    }

    // Admin should not access Kitchen/Queue/Kiosk
    // หากเป็น admin ให้ไม่แสดงข้อมูล (ป้องกัน branch filter หลุด)
    if (user.userType === 'admin') {
      console.warn('[Kitchen] Admin user should not access kitchen endpoint. Returning empty.');
      return res.json({ success: true, data: [] });
    } else {
      // Non-admin users (kitchen, queue, kiosk) MUST have branch_id
      // Query database to get current branch_id (always fresh from DB)
      const userResult = await pool.query(
        'SELECT id, username, branch_id FROM users WHERE id = $1 AND is_active = true',
        [user.id]
      );
      
      if (userResult.rows.length === 0) {
        console.warn(`[Kitchen] User ${user.id} not found in database`);
        return res.json({ success: true, data: [] });
      }
      
      const dbUser = userResult.rows[0];
      branchId = dbUser.branch_id;
      
      // DEBUG: Log only when branch_id changes or is missing
      if (!branchId) {
        console.warn(`[Kitchen] User ${dbUser.username} (ID: ${dbUser.id}) has no branch_id assigned`);
        return res.json({ 
          success: true, 
          data: [],
          message: 'User has no branch assigned. Please contact administrator.' 
        });
      }
      
      // Log branch info (only once per user session or when changed)
      console.log(`[Kitchen] ${dbUser.username} (ID: ${dbUser.id}) → Branch ID: ${branchId}`);
    }

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.queue_number,
        o.dining_location,
        o.table_number,
        o.cooking_style,
        o.note,
        o.branch_id,
        s.name AS soup_name,
        sl.name AS spice_level_name,
        kos.status,
        kos.changed_at AS status_changed_at
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN spice_levels sl ON o.spice_level_id = sl.id
      LEFT JOIN LATERAL (
        SELECT status, changed_at
        FROM kitchen_order_status
        WHERE order_id = o.id
        ORDER BY changed_at DESC
        LIMIT 1
      ) kos ON true
      WHERE o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
        AND o.order_status != 'completed'
        AND (kos.changed_at >= CURRENT_DATE OR (kos.changed_at IS NULL AND o.created_at >= CURRENT_DATE))
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Filter by branch_id if user is not admin
    if (branchId !== null) {
      query += ` AND o.branch_id = $${paramCount}`;
      params.push(branchId);
      paramCount++;
    }

    if (status) {
      query += ` AND kos.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY o.created_at ASC`;

    const result = await pool.query(query, params);
    
    // DEBUG: Log results only if there are orders or if branch mismatch detected
    if (result.rows.length > 0) {
      const branchIds = [...new Set(result.rows.map(o => o.branch_id))];
      if (branchId !== null && (branchIds.length > 1 || branchIds[0] !== branchId)) {
        console.warn(`[Kitchen] ⚠️ Branch mismatch! Expected: ${branchId}, Found: ${branchIds.join(', ')}`);
        console.warn(`[Kitchen] Orders:`, result.rows.map(o => ({ queue: o.queue_number, branch_id: o.branch_id })));
      } else if (branchId !== null) {
        console.log(`[Kitchen] Found ${result.rows.length} orders for branch ${branchId}`);
      }
    }

    // Get addons for each order
    const ordersWithAddons = await Promise.all(
      result.rows.map(async (order) => {
        const addonsResult = await pool.query(
          `SELECT 
            oa.quantity,
            a.name AS addon_name
          FROM order_addons oa
          JOIN addons a ON oa.addon_id = a.id
          WHERE oa.order_id = $1`,
          [order.id]
        );

        return {
          ...order,
          items: [
            ...(order.soup_name ? [{ name: order.soup_name, quantity: 1 }] : []),
            ...(order.spice_level_name ? [{ name: order.spice_level_name, quantity: 1 }] : []),
            ...addonsResult.rows.map((row) => ({
              name: row.addon_name,
              quantity: row.quantity,
            })),
          ],
        };
      })
    );

    console.log('=== End Kitchen Orders Debug ===\n');
    res.json({ success: true, data: ordersWithAddons });
  } catch (error: any) {
    console.error('Kitchen Orders Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update kitchen order status
export const updateKitchenOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['queued', 'in-progress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert kitchen order status
      await client.query(
        `INSERT INTO kitchen_order_status (order_id, status, changed_by)
         VALUES ($1, $2, $3)`,
        [id, status, (req as any).user?.id || null]
      );

      // Update order status based on kitchen status
      let orderStatus = 'preparing';
      if (status === 'done') {
        orderStatus = 'ready';
      } else if (status === 'in-progress') {
        orderStatus = 'preparing';
      }

      // Build dynamic UPDATE query with timestamp columns
      let updateQuery = `UPDATE orders 
         SET order_status = $1, updated_at = CURRENT_TIMESTAMP`;
      
      if (status === 'done') {
        updateQuery += `, completed_at = CURRENT_TIMESTAMP`;
      } else if (status === 'in-progress') {
        // Set confirmed_at if not already set
        updateQuery += `, confirmed_at = COALESCE(confirmed_at, CURRENT_TIMESTAMP)`;
      }

      updateQuery += ` WHERE id = $2`;

      await client.query(updateQuery, [orderStatus, id]);

      await client.query('COMMIT');

      // Send LINE notification when status changes
        try {
          const { notifyOrderStatusChange } = await import('./lineController.js');
        let notificationStatus: string;
        
        if (status === 'done') {
          notificationStatus = 'done';
        } else if (status === 'ready') {
          notificationStatus = 'ready';
        } else if (status === 'in-progress') {
          notificationStatus = 'in_progress';
        } else {
          // Skip notification for other statuses
          notificationStatus = '';
        }
        
        if (notificationStatus) {
          await notifyOrderStatusChange(id as any, notificationStatus as any);
        }
        } catch (error) {
          console.warn('Failed to send LINE notification:', error);
      }

      res.json({
        success: true,
        message: 'Kitchen order status updated successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get kitchen stats
export const getKitchenStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get user's branch_id if not admin
    let branchId: number | null = null;
    if (user && user.userType !== 'admin') {
      const userResult = await pool.query(
        'SELECT branch_id FROM users WHERE id = $1 AND is_active = true',
        [user.id]
      );
      if (userResult.rows.length > 0 && userResult.rows[0].branch_id) {
        branchId = userResult.rows[0].branch_id;
      }
    }

    // Build query with branch filter
    let queuedQuery = `
      SELECT COUNT(*) 
      FROM kitchen_order_status kos
      JOIN orders o ON kos.order_id = o.id
      WHERE kos.status = 'queued' 
        AND kos.changed_at >= CURRENT_DATE
    `;
    
    let inProgressQuery = `
      SELECT COUNT(*) 
      FROM kitchen_order_status kos
      JOIN orders o ON kos.order_id = o.id
      WHERE kos.status = 'in-progress' 
        AND kos.changed_at >= CURRENT_DATE
    `;
    
    let doneQuery = `
      SELECT COUNT(*) 
      FROM kitchen_order_status kos
      JOIN orders o ON kos.order_id = o.id
      WHERE kos.status = 'done' 
        AND kos.changed_at >= CURRENT_DATE
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Filter by branch_id if user is not admin
    if (branchId !== null) {
      const branchFilter = ` AND o.branch_id = $${paramCount}`;
      queuedQuery += branchFilter;
      inProgressQuery += branchFilter;
      doneQuery += branchFilter;
      params.push(branchId);
      paramCount++;
    }

    const [queuedResult, inProgressResult, doneResult] = await Promise.all([
      pool.query(queuedQuery, params),
      pool.query(inProgressQuery, params),
      pool.query(doneQuery, params),
    ]);

    res.json({
      success: true,
      data: {
        queued: parseInt(queuedResult.rows[0].count),
        inProgress: parseInt(inProgressResult.rows[0].count),
        done: parseInt(doneResult.rows[0].count),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

