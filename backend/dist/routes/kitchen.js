import express from 'express';
import { getKitchenOrders, updateKitchenOrderStatus, getKitchenStats, } from '../controllers/kitchenController.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.get('/', authenticateToken, getKitchenOrders);
router.get('/stats', authenticateToken, getKitchenStats);
router.put('/:id/status', authenticateToken, updateKitchenOrderStatus);
export default router;
//# sourceMappingURL=kitchen.js.map