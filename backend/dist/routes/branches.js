import express from 'express';
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch, getBranchStats, } from '../controllers/branchController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();
// Public route: Get all active branches (for kiosk selection, etc.)
router.get('/', getBranches);
// Protected routes: Admin only
router.get('/:id', authenticateToken, getBranchById);
router.get('/:id/stats', authenticateToken, getBranchStats);
router.post('/', authenticateToken, requireAdmin, createBranch);
router.put('/:id', authenticateToken, requireAdmin, updateBranch);
router.delete('/:id', authenticateToken, requireAdmin, deleteBranch);
export default router;
//# sourceMappingURL=branches.js.map