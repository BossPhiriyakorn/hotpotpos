import { Request, Response } from 'express';
import pool from '../config/database.js';

// Get ready orders (for queue display)
export const getReadyOrders = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.queue_number,
        o.dining_location,
        o.table_number,
        o.cooking_style
      FROM orders o
      LEFT JOIN LATERAL (
        SELECT status, changed_at
        FROM kitchen_order_status
        WHERE order_id = o.id
        ORDER BY changed_at DESC
        LIMIT 1
      ) kos ON true
      WHERE kos.status = 'done'
        AND o.order_status IN ('ready', 'preparing')
        AND kos.changed_at >= CURRENT_DATE
      ORDER BY o.queue_number ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get in-progress orders (for queue display)
export const getInProgressOrders = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.queue_number,
        o.dining_location,
        o.table_number,
        o.cooking_style
      FROM orders o
      LEFT JOIN LATERAL (
        SELECT status, changed_at
        FROM kitchen_order_status
        WHERE order_id = o.id
        ORDER BY changed_at DESC
        LIMIT 1
      ) kos ON true
      WHERE kos.status = 'in-progress'
        AND o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
        AND kos.changed_at >= CURRENT_DATE
      ORDER BY o.queue_number ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get order by queue number
export const getOrderByQueueNumber = async (req: Request, res: Response) => {
  try {
    const { queueNumber } = req.params;
    
    const result = await pool.query(
      `SELECT 
        o.*,
        s.name AS soup_name,
        sl.name AS spice_level_name
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN spice_levels sl ON o.spice_level_id = sl.id
      WHERE o.queue_number = $1
        AND o.created_at >= CURRENT_DATE
      ORDER BY o.created_at DESC
      LIMIT 1`,
      [queueNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found for this queue number',
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

