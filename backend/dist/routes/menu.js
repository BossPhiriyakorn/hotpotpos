import express from 'express';
import { getAddons, getAddonById, createAddon, updateAddon, deleteAddon, getSoups, getSoupById, createSoup, updateSoup, deleteSoup, getSpiceLevels, getSpiceLevelById, createSpiceLevel, updateSpiceLevel, deleteSpiceLevel, } from '../controllers/menuController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();
// Add-ons routes
router.get('/addons', getAddons);
router.get('/addons/:id', getAddonById);
router.post('/addons', authenticateToken, requireAdmin, createAddon);
router.put('/addons/:id', authenticateToken, requireAdmin, updateAddon);
router.delete('/addons/:id', authenticateToken, requireAdmin, deleteAddon);
// Soups routes
router.get('/soups', getSoups);
router.get('/soups/:id', getSoupById);
router.post('/soups', authenticateToken, requireAdmin, createSoup);
router.put('/soups/:id', authenticateToken, requireAdmin, updateSoup);
router.delete('/soups/:id', authenticateToken, requireAdmin, deleteSoup);
// Spice levels routes
router.get('/spice-levels', getSpiceLevels);
router.get('/spice-levels/:id', getSpiceLevelById);
router.post('/spice-levels', authenticateToken, requireAdmin, createSpiceLevel);
router.put('/spice-levels/:id', authenticateToken, requireAdmin, updateSpiceLevel);
router.delete('/spice-levels/:id', authenticateToken, requireAdmin, deleteSpiceLevel);
export default router;
//# sourceMappingURL=menu.js.map