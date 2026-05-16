import express from 'express';
import { getSettings, getSettingByKey, updateSetting, getPricePer100g, updatePricePer100g, } from '../controllers/settingsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();
// Public routes
router.get('/price-per-100g', getPricePer100g);
// Get settings is public for Kiosk display (no sensitive data)
router.get('/', getSettings);
// Protected routes
router.get('/:key', authenticateToken, getSettingByKey);
router.put('/:key', authenticateToken, requireAdmin, updateSetting);
router.put('/price-per-100g', authenticateToken, requireAdmin, updatePricePer100g);
export default router;
//# sourceMappingURL=settings.js.map