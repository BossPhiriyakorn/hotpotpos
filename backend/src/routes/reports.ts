import express from 'express';
import { getDashboardSummary, getProductSales, getOrdersForReports } from '../controllers/reportsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Dashboard summary
router.get('/dashboard/summary', authenticateToken, requireAdmin, getDashboardSummary);

// Product sales report
router.get('/products', authenticateToken, requireAdmin, getProductSales);

// Orders for reports (formatted)
router.get('/orders', authenticateToken, requireAdmin, getOrdersForReports);

export default router;

