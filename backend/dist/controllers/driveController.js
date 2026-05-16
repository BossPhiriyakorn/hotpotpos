import { isDriveConfigured, getFileMediaStream, getDefaultFolderId, listFilesInFolder, uploadImageToFolder, } from '../services/googleDriveService.js';
/** สตรีมไฟล์จาก Drive ตาม File ID — Kiosk ใช้แสดงรูป (ไม่ต้องล็อกอิน) */
export const streamDriveFile = async (req, res) => {
    try {
        if (!isDriveConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'Google Drive is not enabled. Set GOOGLE_DRIVE_ENABLED=true and GOOGLE_DRIVE_CREDENTIALS_PATH in .env',
            });
        }
        const { fileId } = req.params;
        if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
            return res.status(400).json({ success: false, error: 'Invalid file id' });
        }
        const { stream, mimeType } = await getFileMediaStream(fileId);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=300');
        stream.on('error', (err) => {
            console.error('[Drive] stream error:', err.message);
            if (!res.headersSent)
                res.status(500).end();
        });
        stream.pipe(res);
    }
    catch (error) {
        const msg = error.message || String(error);
        if (msg.includes('404') || msg.includes('not found')) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }
        console.error('[Drive] streamDriveFile:', msg);
        return res.status(500).json({ success: false, error: msg });
    }
};
/** รายการไฟล์ในโฟลเดอร์ — folderId จาก query หรือจาก GOOGLE_DRIVE_FOLDER_ID */
export const listDriveFolder = async (req, res) => {
    try {
        if (!isDriveConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'Google Drive is not enabled',
            });
        }
        const folderId = req.query.folderId?.trim() || getDefaultFolderId();
        if (!folderId) {
            return res.status(400).json({
                success: false,
                error: 'Provide ?folderId=DRIVE_FOLDER_ID or set GOOGLE_DRIVE_FOLDER_ID in .env',
            });
        }
        const files = await listFilesInFolder(folderId);
        res.json({
            success: true,
            data: {
                folderId,
                files: files.map((f) => ({
                    id: f.id,
                    name: f.name,
                    mimeType: f.mimeType,
                    thumbnailLink: f.thumbnailLink,
                    webViewLink: f.webViewLink,
                    imageRef: f.id ? `gdrive:${f.id}` : null,
                })),
            },
        });
    }
    catch (error) {
        console.error('[Drive] listDriveFolder:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
/** อัปโหลดรูปเข้าโฟลเดอร์ที่กำหนดด้วย GOOGLE_DRIVE_FOLDER_ID */
export const uploadDriveImage = async (req, res) => {
    try {
        if (!isDriveConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'Google Drive is not enabled',
            });
        }
        const folderId = getDefaultFolderId();
        if (!folderId) {
            return res.status(400).json({
                success: false,
                error: 'Set GOOGLE_DRIVE_FOLDER_ID in .env (Drive folder ID from URL)',
            });
        }
        const file = req.file;
        if (!file?.buffer) {
            return res.status(400).json({ success: false, error: 'No image file (field name: file)' });
        }
        const safeName = file.originalname.replace(/[^\w.\-ก-๙]+/g, '_') || `upload-${Date.now()}.jpg`;
        const { id, name } = await uploadImageToFolder(folderId, safeName, file.mimetype, file.buffer);
        res.status(201).json({
            success: true,
            data: {
                id,
                name,
                imageRef: `gdrive:${id}`,
                publicUrlHint: `Use gdrive:${id} in menu/settings or ${req.protocol}://${req.get('host')}/api/drive/files/${id}`,
            },
        });
    }
    catch (error) {
        console.error('[Drive] uploadDriveImage:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
//# sourceMappingURL=driveController.js.map