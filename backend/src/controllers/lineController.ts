import { Request, Response } from 'express';
import pool from '../config/database.js';
import QRCode from 'qrcode';
import { sendOrderNotification, getLineUserProfile } from '../services/lineService.js';
import crypto from 'crypto';

// Generate secure token for order connection
const generateOrderToken = (orderId: number): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  const data = `${orderId}-${Date.now()}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 32);
};

// Generate QR Code for LINE notification
export const generateOrderQRCode = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Verify order exists
    const orderResult = await pool.query(
      'SELECT id, queue_number, order_number FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Generate secure token
    const token = generateOrderToken(order.id);

    // Store token temporarily (valid for 10 minutes)
    await pool.query(
      `INSERT INTO line_notifications (order_id, line_user_id, notification_enabled)
       VALUES ($1, $2, false)
       ON CONFLICT (order_id, line_user_id) DO NOTHING`,
      [order.id, `temp_${token}`]
    );

    // Generate QR Code URL
    // ใช้ LINE Login (LIFF) URL ถ้ามี LIFF ID
    const baseUrl = process.env.LINE_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const liffId = process.env.LINE_LIFF_ID || '';
    
    let qrData: string;
    if (liffId) {
      // ใช้ LIFF URL แต่ส่ง parameters ผ่าน hash fragment
      // LIFF SDK สามารถดึง hash parameters ได้
      qrData = `https://liff.line.me/${liffId}#order_id=${order.id}&token=${token}`;
    } else {
      // Fallback: ใช้ URL ธรรมดา (สำหรับ development)
      qrData = `${baseUrl}/line/connect?order_id=${order.id}&token=${token}`;
    }

    // Generate QR Code image (Base64)
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeImage,
        orderId: order.id,
        queueNumber: order.queue_number,
        orderNumber: order.order_number,
      },
    });
  } catch (error: any) {
    console.error('Generate QR Code Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Connect LINE user to order (via webhook or direct)
export const connectLineToOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, lineUserId, token } = req.body;

    if (!orderId || !lineUserId) {
      return res.status(400).json({
        success: false,
        error: 'orderId and lineUserId are required',
      });
    }

    // Verify order exists and is from today
    const orderResult = await pool.query(
      `SELECT id, queue_number, order_number 
       FROM orders 
       WHERE id = $1 
         AND DATE(created_at) = CURRENT_DATE
         AND order_status != 'cancelled'`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or expired',
      });
    }

    const order = orderResult.rows[0];

    // Get LINE user profile (optional, for display name)
    let displayName = 'Customer';
    try {
      const profileResult = await getLineUserProfile(lineUserId);
      if (profileResult.success && profileResult.data) {
        displayName = profileResult.data.displayName || 'Customer';
      }
    } catch (error) {
      console.warn('Could not get LINE profile:', error);
    }

    // Store LINE notification connection
    await pool.query(
      `INSERT INTO line_notifications (order_id, line_user_id, line_display_name, notification_enabled)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (order_id, line_user_id) 
       DO UPDATE SET 
         line_display_name = $3,
         notification_enabled = true,
         updated_at = CURRENT_TIMESTAMP`,
      [order.id, lineUserId, displayName]
    );

    // Send confirmation message
    try {
      await sendOrderNotification(
        lineUserId,
        order.queue_number,
        'queued'
      );
    } catch (error) {
      console.warn('Could not send confirmation message:', error);
    }

    res.json({
      success: true,
      message: 'LINE connected successfully',
      data: {
        orderId: order.id,
        queueNumber: order.queue_number,
      },
    });
  } catch (error: any) {
    console.error('Connect LINE Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get LINE notification status for order
export const getOrderLineStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT 
        ln.id,
        ln.line_user_id,
        ln.line_display_name,
        ln.notification_enabled,
        ln.created_at,
        o.queue_number
       FROM line_notifications ln
       JOIN orders o ON ln.order_id = o.id
       WHERE ln.order_id = $1
       ORDER BY ln.created_at DESC
       LIMIT 1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: { connected: false },
      });
    }

    res.json({
      success: true,
      data: {
        connected: true,
        notificationEnabled: result.rows[0].notification_enabled,
        displayName: result.rows[0].line_display_name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Disable notification for order
export const disableOrderNotification = async (req: Request, res: Response) => {
  try {
    const { orderId, lineUserId } = req.body;

    await pool.query(
      `UPDATE line_notifications 
       SET notification_enabled = false, updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1 AND line_user_id = $2`,
      [orderId, lineUserId]
    );

    res.json({ success: true, message: 'Notification disabled' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// LINE Webhook handler
export const handleLineWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-line-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify signature (optional, but recommended)
    // const isValid = verifyLineSignature(body, signature);
    // if (!isValid) {
    //   return res.status(401).json({ success: false, error: 'Invalid signature' });
    // }

    const events = req.body.events || [];

    for (const event of events) {
      if (event.type === 'follow' || event.type === 'message') {
        // Handle LINE events here if needed
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('LINE Webhook Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send notification when order status changes (called from other controllers)
export const notifyOrderStatusChange = async (
  orderId: number,
  newStatus: string
) => {
  try {
    // Get order details
    const orderResult = await pool.query(
      'SELECT id, queue_number FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) return;

    const order = orderResult.rows[0];

    // Get all LINE users connected to this order
    const notificationsResult = await pool.query(
      `SELECT line_user_id 
       FROM line_notifications 
       WHERE order_id = $1 AND notification_enabled = true`,
      [orderId]
    );

    // Send notification to each connected user
    for (const notif of notificationsResult.rows) {
      try {
        await sendOrderNotification(
          notif.line_user_id,
          order.queue_number,
          newStatus
        );
      } catch (error) {
        console.error(
          `Failed to send notification to ${notif.line_user_id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error('Notify Order Status Change Error:', error);
  }
};

