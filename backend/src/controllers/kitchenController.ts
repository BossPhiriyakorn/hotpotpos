import { Request, Response } from 'express';
import pool from '../config/database.js';

// Get kitchen orders by status
export const getKitchenOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.queue_number,
        o.dining_location,
        o.table_number,
        o.cooking_style,
        o.note,
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

    if (status) {
      query += ` AND kos.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at ASC`;

    const result = await pool.query(query, params);

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

    res.json({ success: true, data: ordersWithAddons });
  } catch (error: any) {
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
    const queuedResult = await pool.query(
      `SELECT COUNT(*) FROM kitchen_order_status 
       WHERE status = 'queued' 
       AND changed_at >= CURRENT_DATE`
    );

    const inProgressResult = await pool.query(
      `SELECT COUNT(*) FROM kitchen_order_status 
       WHERE status = 'in-progress' 
       AND changed_at >= CURRENT_DATE`
    );

    const doneResult = await pool.query(
      `SELECT COUNT(*) FROM kitchen_order_status 
       WHERE status = 'done' 
       AND changed_at >= CURRENT_DATE`
    );

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

