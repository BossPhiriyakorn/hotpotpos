/**
 * รองรับการอ้างอิงรูปหลายรูปแบบ:
 * - data:image/... (Base64)
 * - https:// หรือ http://
 * - gdrive:FILE_ID (Google Drive file ID — ดึงผ่าน /api/drive/files/:fileId)
 */
export function isValidImageReference(value) {
    if (!value || typeof value !== 'string')
        return false;
    const v = value.trim();
    if (v.startsWith('data:image/'))
        return true;
    if (v.startsWith('http://') || v.startsWith('https://'))
        return true;
    if (v.startsWith('gdrive:')) {
        const id = v.slice('gdrive:'.length).trim();
        return id.length >= 10 && /^[a-zA-Z0-9_-]+$/.test(id);
    }
    return false;
}
//# sourceMappingURL=imageReference.js.map