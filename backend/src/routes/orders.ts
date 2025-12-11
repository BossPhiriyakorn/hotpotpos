import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getNextQueueNumber,
} from '../controllers/orderController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with optional authentication to get user info if available)
router.get('/queue/next', getNextQueueNumber);
router.post('/', optionalAuthenticateToken, createOrder);

// Protected routes
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id/status', authenticateToken, updateOrderStatus);

export default router;

