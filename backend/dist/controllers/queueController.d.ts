import { Request, Response } from 'express';
export declare const getReadyOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getInProgressOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOrderByQueueNumber: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=queueController.d.ts.map