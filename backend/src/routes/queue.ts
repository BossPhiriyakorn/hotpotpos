import express from 'express';
import {
  getReadyOrders,
  getInProgressOrders,
  getOrderByQueueNumber,
} from '../controllers/queueController.js';

const router = express.Router();

// Public routes (for queue display)
router.get('/ready', getReadyOrders);
router.get('/in-progress', getInProgressOrders);
router.get('/:queueNumber', getOrderByQueueNumber);

export default router;

