import { Request, Response } from 'express';
import pool from '../config/database.js';

// Get all branches
export const getBranches = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    let query = 'SELECT * FROM branches';
    const params: any[] = [];
    
    if (includeInactive !== 'true') {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY created_at ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Get branches error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get branch by ID
export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM branches WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Get branch by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create branch
export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, code, address, phone, is_active } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Branch name is required',
      });
    }
    
    // Check if name already exists (only active branches)
    const nameCheck = await pool.query('SELECT id FROM branches WHERE name = $1 AND is_active = true', [name.trim()]);
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Branch name already exists',
      });
    }
    
    // Check if code already exists (if provided, only active branches)
    if (code && code.trim() !== '') {
      const codeCheck = await pool.query('SELECT id FROM branches WHERE code = $1 AND is_active = true', [code.trim()]);
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Branch code already exists',
        });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO branches (name, code, address, phone, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name.trim(),
        code ? code.trim() : null,
        address || null,
        phone || null,
        is_active !== undefined ? is_active : true,
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create branch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update branch
export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, address, phone, is_active } = req.body;
    
    // Check if branch exists
    const branchCheck = await pool.query('SELECT id FROM branches WHERE id = $1', [id]);
    if (branchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }
    
    // Check if name already exists (excluding current branch, only active branches)
    if (name && name.trim() !== '') {
      const nameCheck = await pool.query(
        'SELECT id FROM branches WHERE name = $1 AND id != $2 AND is_active = true',
        [name.trim(), id]
      );
      if (nameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Branch name already exists',
        });
      }
    }
    
    // Check if code already exists (excluding current branch, only active branches)
    if (code && code.trim() !== '') {
      const codeCheck = await pool.query(
        'SELECT id FROM branches WHERE code = $1 AND id != $2 AND is_active = true',
        [code.trim(), id]
      );
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Branch code already exists',
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE branches 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           address = COALESCE($3, address),
           phone = COALESCE($4, phone),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name ? name.trim() : null,
        code ? code.trim() : null,
        address || null,
        phone || null,
        is_active !== undefined ? is_active : null,
        id,
      ]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Update branch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete branch (soft delete by setting is_active = false)
export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if branch exists
    const branchCheck = await pool.query('SELECT id FROM branches WHERE id = $1', [id]);
    if (branchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }
    
    // Check if branch has orders
    const ordersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE branch_id = $1',
      [id]
    );
    const orderCount = parseInt(ordersCheck.rows[0].count);
    
    // Check if branch has users
    const usersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE branch_id = $1',
      [id]
    );
    const userCount = parseInt(usersCheck.rows[0].count);
    
    if (orderCount > 0 || userCount > 0) {
      // Soft delete: set is_active = false
      const result = await pool.query(
        `UPDATE branches 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      
      res.json({
        success: true,
        data: result.rows[0],
        message: `Branch deactivated. It has ${orderCount} orders and ${userCount} users.`,
      });
    } else {
      // Hard delete: remove from database
      await pool.query('DELETE FROM branches WHERE id = $1', [id]);
      
      res.json({
        success: true,
        message: 'Branch deleted successfully',
      });
    }
  } catch (error: any) {
    console.error('Delete branch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get branch statistics
export const getBranchStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if branch exists
    const branchCheck = await pool.query('SELECT id, name FROM branches WHERE id = $1', [id]);
    if (branchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }
    
    const start = typeof startDate === 'string' ? startDate : undefined;
    const end = typeof endDate === 'string' ? endDate : undefined;
    
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value
      FROM orders
      WHERE branch_id = $1 AND order_status != 'cancelled'
    `;
    const params: any[] = [id];
    let paramCount = 2;
    
    if (start) {
      query += ` AND DATE(created_at) >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }
    
    if (end) {
      query += ` AND DATE(created_at) <= $${paramCount}`;
      params.push(end);
      paramCount++;
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: {
        branch: branchCheck.rows[0],
        stats: {
          totalOrders: parseInt(result.rows[0].total_orders) || 0,
          totalRevenue: parseFloat(result.rows[0].total_revenue) || 0,
          avgOrderValue: parseFloat(result.rows[0].avg_order_value) || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Get branch stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

