export declare const sendPushMessage: (userId: string, message: string) => Promise<{
    success: boolean;
    data: any;
}>;
export declare const sendOrderNotification: (userId: string, queueNumber: number, status: string) => Promise<{
    success: boolean;
    data: any;
}>;
export declare const verifyLineSignature: (body: string, signature: string) => boolean;
export declare const getLineUserProfile: (userId: string) => Promise<{
    success: boolean;
    data: any;
}>;
//# sourceMappingURL=lineService.d.ts.map