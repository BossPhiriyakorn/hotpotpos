import { Request, Response } from 'express';
/** สตรีมไฟล์จาก Drive ตาม File ID — Kiosk ใช้แสดงรูป (ไม่ต้องล็อกอิน) */
export declare const streamDriveFile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** รายการไฟล์ในโฟลเดอร์ — folderId จาก query หรือจาก GOOGLE_DRIVE_FOLDER_ID */
export declare const listDriveFolder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/** อัปโหลดรูปเข้าโฟลเดอร์ที่กำหนดด้วย GOOGLE_DRIVE_FOLDER_ID */
export declare const uploadDriveImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=driveController.d.ts.map