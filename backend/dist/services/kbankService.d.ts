export interface KBankCreateChargeRequest {
    orderId: number;
    amount: number;
    description?: string;
}
export interface KBankChargeResult {
    chargeId: string;
    partnerTxId: string;
    status: string;
    qrCodeData: string | null;
    qrImageUrl: string | null;
    expiresAt: Date;
    rawResponse: any;
}
export interface KBankInquiryResult {
    chargeId: string;
    status: string;
    paidAt: Date | null;
    kbankPaymentId: string | null;
    rawResponse: any;
}
/**
 * สร้าง Charge ใหม่สำหรับออเดอร์ที่ระบุ
 * เรียก POST /v2/kpaymentgateway/payment/qrcode/create (ตัวอย่างตาม K Payment Gateway)
 * NOTE: ชื่อ endpoint อาจต่างกันตามเวอร์ชัน API ที่ธนาคารออกให้
 */
export declare const createCharge: (req: KBankCreateChargeRequest) => Promise<KBankChargeResult>;
/**
 * ตรวจสอบสถานะ charge (Inquiry)
 * เรียก POST /v2/kpaymentgateway/payment/qrcode/inquiry
 */
export declare const inquireCharge: (chargeId: string, partnerTxId: string) => Promise<KBankInquiryResult>;
/**
 * ตรวจสอบว่า webhook payload ถูกส่งมาจาก KBank จริงโดยเปรียบ signature
 */
export declare const verifyWebhookSignature: (payload: string, signatureHeader: string) => boolean;
export declare const getKBankConfig: () => {
    env: string;
    isSandbox: boolean;
    baseUrl: string;
    hasCredentials: boolean;
    currency: string;
    timeoutMinutes: number;
    callbackUrl: string;
};
//# sourceMappingURL=kbankService.d.ts.map