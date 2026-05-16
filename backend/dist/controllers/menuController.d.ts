import { Request, Response } from 'express';
export declare const getAddons: (req: Request, res: Response) => Promise<void>;
export declare const getAddonById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createAddon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateAddon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteAddon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSoups: (req: Request, res: Response) => Promise<void>;
export declare const getSoupById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createSoup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateSoup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteSoup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSpiceLevels: (req: Request, res: Response) => Promise<void>;
export declare const getSpiceLevelById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createSpiceLevel: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateSpiceLevel: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteSpiceLevel: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=menuController.d.ts.map