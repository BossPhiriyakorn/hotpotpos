import { Request, Response } from 'express';
export declare const generateOrderQRCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const connectLineToOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOrderLineStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const disableOrderNotification: (req: Request, res: Response) => Promise<void>;
export declare const handleLineWebhook: (req: Request, res: Response) => Promise<void>;
export declare const notifyOrderStatusChange: (orderId: number, newStatus: string) => Promise<void>;
//# sourceMappingURL=lineController.d.ts.map