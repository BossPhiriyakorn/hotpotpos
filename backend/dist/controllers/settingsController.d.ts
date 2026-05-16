import { Request, Response } from 'express';
export declare const getSettings: (req: Request, res: Response) => Promise<void>;
export declare const getSettingByKey: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPricePer100g: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePricePer100g: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=settingsController.d.ts.map