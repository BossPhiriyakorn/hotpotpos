import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getNextQueueNumber,
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/queue/next', getNextQueueNumber);
router.post('/', createOrder);

// Protected routes
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id/status', authenticateToken, updateOrderStatus);

export default router;

