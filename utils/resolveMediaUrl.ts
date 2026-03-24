/**
 * แปลงอ้างอิงรูปจาก DB เป็น URL ที่ใช้ใน <img> / background-image
 * - gdrive:FILE_ID → {API}/api/drive/files/FILE_ID
 */
export function resolveMediaUrl(src: string | null | undefined): string {
  if (!src) return '';
  const s = src.trim();
  if (!s) return '';
  if (s.startsWith('gdrive:')) {
    const id = s.slice('gdrive:'.length).trim();
    if (!id) return '';
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${base}/api/drive/files/${id}`;
  }
  return s;
}
