import { Request, Response } from 'express';
export declare const getOrders: (req: Request, res: Response) => Promise<void>;
export declare const getOrderById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createOrder: (req: Request, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNextQueueNumber: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=orderController.d.ts.map