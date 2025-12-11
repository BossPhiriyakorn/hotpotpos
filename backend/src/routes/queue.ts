import express from 'express';
import {
  getReadyOrders,
  getInProgressOrders,
  getOrderByQueueNumber,
} from '../controllers/queueController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Queue display now requires authentication to apply branch filtering correctly
router.get('/ready', authenticateToken, getReadyOrders);
router.get('/in-progress', authenticateToken, getInProgressOrders);
router.get('/:queueNumber', authenticateToken, getOrderByQueueNumber);

export default router;

