import { Request, Response } from 'express';
export declare const getBranches: (req: Request, res: Response) => Promise<void>;
export declare const getBranchById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createBranch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBranch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteBranch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBranchStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=branchController.d.ts.map