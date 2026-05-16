import { Request, Response } from 'express';
export declare const createKBankCharge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const inquireKBankCharge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const kbankWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPaymentConfig: (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map