import express from 'express';
import multer from 'multer';
import { streamDriveFile, listDriveFolder, uploadDriveImage } from '../controllers/driveController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

router.get('/files/:fileId', streamDriveFile);
router.get('/list', authenticateToken, requireAdmin, listDriveFolder);
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), uploadDriveImage);

export default router;
