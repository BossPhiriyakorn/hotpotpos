import { Request, Response } from 'express';
import pool from '../config/database.js';
import { Order, OrderAddon } from '../types/index.js';

// Get all orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, limit } = req.query;
    
    let query = `
      SELECT 
        o.*,
        s.name AS soup_name,
        sl.name AS spice_level_name
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN spice_levels sl ON o.spice_level_id = sl.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND o.order_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (startDate) {
      query += ` AND o.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND o.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY o.created_at DESC`;
    
    // Only add LIMIT if specified and valid (not 'all' or '0')
    if (limit && limit !== 'all' && limit !== '0') {
      const limitNum = parseInt(limit as string);
      if (!isNaN(limitNum) && limitNum > 0) {
        query += ` LIMIT $${paramCount}`;
        params.push(limitNum);
      }
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get order
    const orderResult = await pool.query(
      `SELECT 
        o.*,
        s.name AS soup_name,
        s.image_url AS soup_image,
        sl.name AS spice_level_name
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN spice_levels sl ON o.spice_level_id = sl.id
      WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Get order addons
    const addonsResult = await pool.query(
      `SELECT 
        oa.*,
        a.name AS addon_name,
        a.image_url AS addon_image
      FROM order_addons oa
      JOIN addons a ON oa.addon_id = a.id
      WHERE oa.order_id = $1`,
      [id]
    );

    const order = {
      ...orderResult.rows[0],
      addons: addonsResult.rows,
    };

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create order
export const createOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      weight_grams,
      price_per_100g,
      base_price,
      soup_id,
      spice_level_id,
      addons,
      dining_location,
      table_number,
      cooking_style,
      note,
      payment_method,
      payment_reference,
      branch_id, // Get branch_id from request body (for kiosk)
    } = req.body;

    // Get branch_id from authenticated user if not provided in body (for CMS/API)
    let finalBranchId = branch_id;
    if (!finalBranchId && (req as any).user) {
      const userResult = await client.query(
        'SELECT branch_id FROM users WHERE id = $1',
        [(req as any).user.id]
      );
      if (userResult.rows.length > 0 && userResult.rows[0].branch_id) {
        finalBranchId = userResult.rows[0].branch_id;
      }
    }

    // Fallback: Use default branch (สาขาหลัก) if no branch_id is provided
    // This ensures all orders have a branch_id, even from Kiosk without authentication
    if (!finalBranchId) {
      const defaultBranchResult = await client.query(
        'SELECT id FROM branches WHERE code = $1 AND is_active = true LIMIT 1',
        ['MAIN']
      );
      if (defaultBranchResult.rows.length > 0) {
        finalBranchId = defaultBranchResult.rows[0].id;
      }
    }

    // Validation
    if (!weight_grams || weight_grams <= 0) {
      throw new Error('Weight in grams must be greater than 0');
    }

    if (!price_per_100g || price_per_100g <= 0) {
      throw new Error('Price per 100g must be greater than 0');
    }

    if (!base_price || base_price < 0) {
      throw new Error('Base price must be greater than or equal to 0');
    }

    if (!dining_location || !['DINE_IN', 'TAKEAWAY'].includes(dining_location)) {
      throw new Error('Dining location must be either DINE_IN or TAKEAWAY');
    }

    if (!cooking_style || !['READY_TO_EAT', 'SEPARATE_SOUP', 'UNCOOKED'].includes(cooking_style)) {
      throw new Error('Cooking style must be one of: READY_TO_EAT, SEPARATE_SOUP, UNCOOKED');
    }

    // Validate soup_id if provided
    if (soup_id) {
      const soupCheck = await client.query('SELECT id FROM soups WHERE id = $1 AND is_active = true', [soup_id]);
      if (soupCheck.rows.length === 0) {
        throw new Error(`Soup with ID ${soup_id} not found or inactive`);
      }
    }

    // Validate spice_level_id if provided
    if (spice_level_id) {
      const spiceCheck = await client.query('SELECT id FROM spice_levels WHERE id = $1 AND is_active = true', [spice_level_id]);
      if (spiceCheck.rows.length === 0) {
        throw new Error(`Spice level with ID ${spice_level_id} not found or inactive`);
      }
    }

    // Calculate totals and validate addons
    let addonsTotal = 0;
    if (addons && Array.isArray(addons)) {
      for (const addon of addons) {
        const addonId = addon.id || addon.addon_id;
        if (!addonId) {
          throw new Error('Addon ID is required for all addons');
        }
        
        // If price is not provided, fetch from database
        let addonPrice = addon.price;
        if (!addonPrice) {
          const addonResult = await client.query(
            'SELECT price FROM addons WHERE id = $1',
            [addonId]
          );
          if (addonResult.rows.length === 0) {
            throw new Error(`Addon with ID ${addonId} not found`);
          }
          addonPrice = parseFloat(addonResult.rows[0].price) || 0;
        }
        
        const quantity = addon.quantity || 1;
        if (quantity <= 0 || !Number.isInteger(quantity)) {
          throw new Error(`Invalid quantity for addon ID ${addonId}. Quantity must be a positive integer`);
        }
        addonsTotal += addonPrice * quantity;
      }
    }

    // Get spice price
    let spicePrice = 0;
    if (spice_level_id) {
      const spiceResult = await client.query(
        'SELECT price FROM spice_levels WHERE id = $1',
        [spice_level_id]
      );
      if (spiceResult.rows.length > 0) {
        spicePrice = parseFloat(spiceResult.rows[0].price) || 0;
      }
    }

    const subtotal = base_price + addonsTotal + spicePrice;
    const vatRate = 0.07; // From settings
    const vatAmount = subtotal * vatRate;
    const totalPrice = subtotal + vatAmount;

    // Insert order (order_number and queue_number will be generated by triggers)
    const orderResult = await client.query(
      `INSERT INTO orders (
        weight_grams, price_per_100g, base_price,
        addons_total, spice_price, subtotal,
        vat_rate, vat_amount, total_price,
        soup_id, spice_level_id,
        dining_location, table_number, cooking_style, note,
        order_status, payment_status, payment_method, payment_reference,
        branch_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        weight_grams,
        price_per_100g,
        base_price,
        addonsTotal,
        spicePrice,
        subtotal,
        vatRate,
        vatAmount,
        totalPrice,
        soup_id || null,
        spice_level_id || null,
        dining_location,
        table_number || null,
        cooking_style,
        note || null,
        'pending',
        'pending',
        payment_method || null,
        payment_reference || null,
        finalBranchId || null,
      ]
    );

    const order = orderResult.rows[0];

    // Insert order addons
    if (addons && Array.isArray(addons) && addons.length > 0) {
      for (const addon of addons) {
        // Support both 'id' and 'addon_id' field names
        const addonId = addon.id || addon.addon_id;
        if (!addonId) {
          throw new Error('Addon ID is required for all addons');
        }
        
        // Get addon price from database if not provided
        let addonPrice = addon.price;
        if (!addonPrice) {
          const addonResult = await client.query(
            'SELECT price FROM addons WHERE id = $1',
            [addonId]
          );
          if (addonResult.rows.length === 0) {
            throw new Error(`Addon with ID ${addonId} not found`);
          }
          addonPrice = parseFloat(addonResult.rows[0].price) || 0;
        }
        
        const quantity = addon.quantity || 1;
        const totalPrice = addonPrice * quantity;
        
        await client.query(
          `INSERT INTO order_addons (order_id, addon_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            order.id,
            addonId,
            quantity,
            addonPrice,
            totalPrice,
          ]
        );
      }
    }

    // Insert kitchen order status
    await client.query(
      `INSERT INTO kitchen_order_status (order_id, status)
       VALUES ($1, 'queued')`,
      [order.id]
    );

    await client.query('COMMIT');

    // Send LINE notification when order is created (queued)
    try {
      const { notifyOrderStatusChange } = await import('./lineController.js');
      await notifyOrderStatusChange(order.id, 'queued');
    } catch (error) {
      console.warn('Failed to send LINE notification:', error);
    }

    // Get full order with relationships
    const fullOrderResult = await client.query(
      `SELECT 
        o.*,
        s.name AS soup_name,
        sl.name AS spice_level_name
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN spice_levels sl ON o.spice_level_id = sl.id
      WHERE o.id = $1`,
      [order.id]
    );

    res.status(201).json({
      success: true,
      data: fullOrderResult.rows[0],
      message: 'Order created successfully',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Build dynamic UPDATE query based on status
    let updateQuery = `UPDATE orders 
       SET order_status = $1, updated_at = CURRENT_TIMESTAMP`;
    const params: any[] = [order_status];
    let paramCount = 2;

    // Update timestamp columns based on status
    if (order_status === 'confirmed') {
      updateQuery += `, confirmed_at = CURRENT_TIMESTAMP`;
    } else if (order_status === 'completed') {
      updateQuery += `, completed_at = CURRENT_TIMESTAMP`;
    } else if (order_status === 'cancelled') {
      updateQuery += `, cancelled_at = CURRENT_TIMESTAMP`;
    }

    // Update payment_status if provided
    if (payment_status) {
      updateQuery += `, payment_status = $${paramCount}`;
      params.push(payment_status);
      paramCount++;

      // Update paid_at if payment is completed
      if (payment_status === 'paid') {
        updateQuery += `, paid_at = CURRENT_TIMESTAMP`;
      }
    }

    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get next queue number
export const getNextQueueNumber = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await pool.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
       FROM orders
       WHERE created_at >= $1 AND created_at < $1 + INTERVAL '1 day'`,
      [todayStart]
    );

    res.json({
      success: true,
      data: { nextQueueNumber: parseInt(result.rows[0].next_queue) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

