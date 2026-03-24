import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { google, drive_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

let driveClient: drive_v3.Drive | null = null;

export function isDriveConfigured(): boolean {
  return (
    process.env.GOOGLE_DRIVE_ENABLED === 'true' &&
    !!process.env.GOOGLE_DRIVE_CREDENTIALS_PATH?.trim()
  );
}

function resolveCredentialsPath(): string {
  const p = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH?.trim() || '';
  if (!p) throw new Error('GOOGLE_DRIVE_CREDENTIALS_PATH is not set');
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * ลูกค้า Service Account ต้องได้รับสิทธิ์บนโฟลเดอร์/ไฟล์ใน Drive (แชร์โฟลเดอร์ให้อีเมล xxx@xxx.iam.gserviceaccount.com)
 */
export function getDriveClient(): drive_v3.Drive {
  if (!isDriveConfigured()) {
    throw new Error('Google Drive is disabled or GOOGLE_DRIVE_CREDENTIALS_PATH is missing');
  }
  if (driveClient) return driveClient;

  const jsonPath = resolveCredentialsPath();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Google Drive credentials file not found: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const credentials = JSON.parse(raw) as Record<string, unknown>;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export function getDefaultFolderId(): string | undefined {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  return id || undefined;
}

export async function getFileMetadata(fileId: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });
  return data;
}

export async function getFileMediaStream(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
}> {
  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: 'mimeType',
  });
  const mimeType = meta.data.mimeType || 'application/octet-stream';

  const media = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  const stream = media.data as Readable;
  return { stream, mimeType };
}

/** อ่านรายการไฟล์ในโฟลเดอร์ — ใช้ Google Drive Folder ID (จาก URL) ไม่ใช่ชื่อโฟลเดอร์ */
export async function listFilesInFolder(folderId: string) {
  const drive = getDriveClient();
  const q = `'${folderId}' in parents and trashed = false`;
  const { data } = await drive.files.list({
    q,
    fields: 'files(id, name, mimeType, thumbnailLink, webViewLink, size)',
    pageSize: 200,
    orderBy: 'folder,name',
  });
  return data.files || [];
}

export async function uploadImageToFolder(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ id: string; name: string | null | undefined }> {
  const drive = getDriveClient();
  const body = Readable.from(buffer);

  const { data } = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body,
    },
    fields: 'id, name',
  });

  if (!data.id) {
    throw new Error('Drive upload succeeded but no file id returned');
  }
  return { id: data.id, name: data.name };
}
