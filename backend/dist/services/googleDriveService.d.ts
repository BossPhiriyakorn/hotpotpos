import { Readable } from 'stream';
import { drive_v3 } from 'googleapis';
export declare function isDriveConfigured(): boolean;
export declare function getDriveClient(): drive_v3.Drive;
export declare function getDefaultFolderId(): string | undefined;
export declare function getFileMetadata(fileId: string): Promise<drive_v3.Schema$File>;
/**
 * สตรีมไฟล์จาก Drive (รองรับ Shared Drive ด้วย supportsAllDrives)
 */
export declare function getFileMediaStream(fileId: string): Promise<{
    stream: Readable;
    mimeType: string;
}>;
/**
 * รายการไฟล์ในโฟลเดอร์ — รองรับ Shared Drive
 */
export declare function listFilesInFolder(folderId: string): Promise<drive_v3.Schema$File[]>;
/**
 * อัปโหลดรูปเข้าโฟลเดอร์ — รองรับ Shared Drive ด้วย supportsAllDrives
 */
export declare function uploadImageToFolder(folderId: string, fileName: string, mimeType: string, buffer: Buffer): Promise<{
    id: string;
    name: string | null | undefined;
}>;
//# sourceMappingURL=googleDriveService.d.ts.map