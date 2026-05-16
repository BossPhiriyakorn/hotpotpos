import axios from 'axios';
import crypto from 'crypto';
// ---- Config ----------------------------------------------------------------
const ENV = process.env.KBANK_ENV || 'sandbox';
const IS_SANDBOX = ENV !== 'production';
const BASE_URL = IS_SANDBOX
    ? (process.env.KBANK_SANDBOX_BASE_URL || 'https://openapi-sandbox.kasikornbank.com')
    : (process.env.KBANK_PRODUCTION_BASE_URL || 'https://openapi.kasikornbank.com');
const API_KEY = IS_SANDBOX
    ? process.env.KBANK_SANDBOX_API_KEY
    : process.env.KBANK_PRODUCTION_API_KEY;
const SECRET_KEY = IS_SANDBOX
    ? process.env.KBANK_SANDBOX_SECRET_KEY
    : process.env.KBANK_PRODUCTION_SECRET_KEY;
const MERCHANT_ID = IS_SANDBOX
    ? process.env.KBANK_SANDBOX_MERCHANT_ID
    : process.env.KBANK_PRODUCTION_MERCHANT_ID;
const MID = IS_SANDBOX
    ? process.env.KBANK_SANDBOX_MID
    : process.env.KBANK_PRODUCTION_MID;
const CURRENCY = process.env.KBANK_CURRENCY || 'THB';
const CHARGE_TIMEOUT_MINUTES = parseInt(process.env.KBANK_CHARGE_TIMEOUT_MINUTES || '15');
const CALLBACK_URL = process.env.KBANK_CALLBACK_URL || '';
const WEBHOOK_SECRET = process.env.KBANK_WEBHOOK_SECRET || '';
// ---- HTTP Client -----------------------------------------------------------
const createHttpClient = () => {
    const client = axios.create({
        baseURL: BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY || '',
        },
    });
    return client;
};
// ---- Helpers ---------------------------------------------------------------
const generatePartnerTxId = (orderId) => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `HOTPOT-${orderId}-${timestamp}-${random}`.substring(0, 50);
};
const generateSignature = (payload) => {
    if (!SECRET_KEY)
        return '';
    return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
};
// ---- KBank API Calls -------------------------------------------------------
/**
 * สร้าง Charge ใหม่สำหรับออเดอร์ที่ระบุ
 * เรียก POST /v2/kpaymentgateway/payment/qrcode/create (ตัวอย่างตาม K Payment Gateway)
 * NOTE: ชื่อ endpoint อาจต่างกันตามเวอร์ชัน API ที่ธนาคารออกให้
 */
export const createCharge = async (req) => {
    if (!API_KEY || !MERCHANT_ID) {
        throw new Error(`KBank ${IS_SANDBOX ? 'sandbox' : 'production'} API key or Merchant ID is not configured. Please update backend/.env`);
    }
    const partnerTxId = generatePartnerTxId(req.orderId);
    const expiresAt = new Date(Date.now() + CHARGE_TIMEOUT_MINUTES * 60 * 1000);
    const requestBody = {
        partnerTxnUid: partnerTxId,
        partnerId: MERCHANT_ID,
        partnerSecret: SECRET_KEY,
        requestDt: new Date().toISOString(),
        merchantId: MID || MERCHANT_ID,
        qrType: '3',
        txnAmount: req.amount.toFixed(2),
        txnCurrencyCode: CURRENCY,
        reference1: `ORDER-${req.orderId}`,
        reference2: req.description || `Hotpot Order #${req.orderId}`,
        callbackUrl: CALLBACK_URL,
    };
    const signature = generateSignature(JSON.stringify(requestBody));
    if (signature) {
        requestBody['x-signature'] = signature;
    }
    const httpClient = createHttpClient();
    try {
        const response = await httpClient.post('/v2/kpaymentgateway/payment/qrcode/create', requestBody);
        const data = response.data;
        return {
            chargeId: data.qrTransactionId || data.chargeId || partnerTxId,
            partnerTxId,
            status: data.status || 'pending',
            qrCodeData: data.qrCode || data.qrCodeData || null,
            qrImageUrl: data.qrImageUrl || null,
            expiresAt,
            rawResponse: data,
        };
    }
    catch (error) {
        const errData = error.response?.data;
        throw new Error(`KBank Create Charge failed: ${errData?.description || errData?.errorDesc || error.message}`);
    }
};
/**
 * ตรวจสอบสถานะ charge (Inquiry)
 * เรียก POST /v2/kpaymentgateway/payment/qrcode/inquiry
 */
export const inquireCharge = async (chargeId, partnerTxId) => {
    if (!API_KEY || !MERCHANT_ID) {
        throw new Error('KBank API key or Merchant ID is not configured');
    }
    const requestBody = {
        partnerId: MERCHANT_ID,
        partnerSecret: SECRET_KEY,
        requestDt: new Date().toISOString(),
        merchantId: MID || MERCHANT_ID,
        qrTransactionId: chargeId,
        partnerTxnUid: partnerTxId,
    };
    const httpClient = createHttpClient();
    try {
        const response = await httpClient.post('/v2/kpaymentgateway/payment/qrcode/inquiry', requestBody);
        const data = response.data;
        const isPaid = ['Success', 'PAID', 'success', 'paid', '00', 'approved'].includes(String(data.status || data.txnStatus || '').toLowerCase());
        return {
            chargeId,
            status: isPaid ? 'paid' : (data.status || data.txnStatus || 'pending'),
            paidAt: isPaid ? new Date() : null,
            kbankPaymentId: data.paymentId || data.transactionId || null,
            rawResponse: data,
        };
    }
    catch (error) {
        const errData = error.response?.data;
        throw new Error(`KBank Inquiry failed: ${errData?.description || errData?.errorDesc || error.message}`);
    }
};
/**
 * ตรวจสอบว่า webhook payload ถูกส่งมาจาก KBank จริงโดยเปรียบ signature
 */
export const verifyWebhookSignature = (payload, signatureHeader) => {
    if (!WEBHOOK_SECRET) {
        // ถ้ายังไม่ตั้ง KBANK_WEBHOOK_SECRET ให้ผ่านไปก่อน (sandbox)
        console.warn('[KBank] KBANK_WEBHOOK_SECRET not set, skipping signature verification');
        return true;
    }
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    return expected === signatureHeader;
};
export const getKBankConfig = () => ({
    env: ENV,
    isSandbox: IS_SANDBOX,
    baseUrl: BASE_URL,
    hasCredentials: !!(API_KEY && MERCHANT_ID),
    currency: CURRENCY,
    timeoutMinutes: CHARGE_TIMEOUT_MINUTES,
    callbackUrl: CALLBACK_URL,
});
//# sourceMappingURL=kbankService.js.map