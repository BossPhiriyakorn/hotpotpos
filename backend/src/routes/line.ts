import express from 'express';
import {
  generateOrderQRCode,
  connectLineToOrder,
  getOrderLineStatus,
  disableOrderNotification,
  handleLineWebhook,
} from '../controllers/lineController.js';

const router = express.Router();

// Webhook endpoint (must be public, LINE will call this)
router.post('/webhook', express.json({ verify: (req: any, res, buf) => {
  req.rawBody = buf.toString('utf8');
}}), handleLineWebhook);

// Public routes (for QR Code connection)
router.get('/orders/:orderId/qr', generateOrderQRCode);
router.post('/connect', connectLineToOrder);
router.get('/orders/:orderId/status', getOrderLineStatus);
router.post('/disable', disableOrderNotification);

export default router;

