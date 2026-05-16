import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

const ENV = process.env.KBANK_ENV || 'sandbox';
const IS_SANDBOX = ENV !== 'production';
const NODE_ENV = process.env.NODE_ENV || '';

const BASE_URL = IS_SANDBOX
  ? process.env.KBANK_SANDBOX_BASE_URL?.trim() || 'https://openapi-sandbox.kasikornbank.com'
  : process.env.KBANK_PRODUCTION_BASE_URL?.trim() || 'https://openapi.kasikornbank.com';

const API_KEY = IS_SANDBOX
  ? process.env.KBANK_SANDBOX_API_KEY?.trim()
  : process.env.KBANK_PRODUCTION_API_KEY?.trim();

const SECRET_KEY_LEGACY = IS_SANDBOX
  ? process.env.KBANK_SANDBOX_SECRET_KEY?.trim()
  : process.env.KBANK_PRODUCTION_SECRET_KEY?.trim();

/** Legacy v2 «partner Id» slot (sandbox lab เรียก slot นี้เป็น Partner ID เช่น PTR…) */
const MERCHANT_ID_LEGACY = IS_SANDBOX
  ? process.env.KBANK_SANDBOX_MERCHANT_ID?.trim()
  : process.env.KBANK_PRODUCTION_MERCHANT_ID?.trim();

const MID_LEGACY = IS_SANDBOX
  ? process.env.KBANK_SANDBOX_MID?.trim()
  : process.env.KBANK_PRODUCTION_MID?.trim();

const CURRENCY = process.env.KBANK_CURRENCY || 'THB';
const CHARGE_TIMEOUT_MINUTES = parseInt(process.env.KBANK_CHARGE_TIMEOUT_MINUTES || '15', 10);
const CALLBACK_URL = process.env.KBANK_CALLBACK_URL?.trim() || '';
const WEBHOOK_SECRET = process.env.KBANK_WEBHOOK_SECRET?.trim() || '';

/** OAuth + /v1/qrpayment (POS QR cert path) — ครบเมื่อมี consumer + partner id/secret + MID บนสลิป */
function consumerId(): string | undefined {
  const v = process.env.KBANK_CONSUMER_ID?.trim();
  return v || undefined;
}

function consumerSecret(): string | undefined {
  const v = process.env.KBANK_CONSUMER_SECRET?.trim();
  return v || undefined;
}

function partnerIdOpenApi(): string | undefined {
  return (
    process.env.KBANK_PARTNER_ID?.trim() ||
    MERCHANT_ID_LEGACY ||
    undefined
  );
}

function partnerSecretOpenApi(): string | undefined {
  return process.env.KBANK_PARTNER_SECRET?.trim() || SECRET_KEY_LEGACY || undefined;
}

/** Merchant MID ใน body (เช่น KB102… บนสลิป) */
function merchantQrIdOpenApi(): string | undefined {
  return process.env.KBANK_MERCHANT_ID?.trim() || MID_LEGACY || undefined;
}

const FORCE_LEGACY_V2 =
  process.env.KBANK_LEGACY_KPAY_GATEWAY === 'true' ||
  process.env.KBANK_USE_LEGACY_V2_KPAY === 'true';

const oauthQrReady = (): boolean =>
  !!consumerId() &&
  !!consumerSecret() &&
  !!partnerIdOpenApi() &&
  !!partnerSecretOpenApi() &&
  !!merchantQrIdOpenApi();

export const usesOAuthPosQrFlow = (): boolean => !FORCE_LEGACY_V2 && oauthQrReady();

function includeSandboxTestHeaders(): boolean {
  return IS_SANDBOX && process.env.KBANK_INCLUDE_SANDBOX_TEST_HEADERS !== 'false';
}

function headerXTestMode(): string {
  const v = process.env.KBANK_X_TEST_MODE?.trim();
  return v === 'false' || v === '0' ? 'false' : 'true';
}

function oauthRequestHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (includeSandboxTestHeaders()) {
    h['x-test-mode'] = headerXTestMode();
    h['env-id'] = process.env.KBANK_OAUTH_ENV_ID?.trim() || 'OAUTH2';
  }
  return h;
}

function sandboxQrPaymentHeaders(which: 'create' | 'inquiry'): Record<string, string> {
  if (!includeSandboxTestHeaders()) return {};
  const envKey =
    which === 'create' ? 'KBANK_QR_CREATE_ENV_ID' : 'KBANK_QR_INQUIRY_ENV_ID';
  const fallback = which === 'create' ? 'QR002' : 'QR004';
  return {
    'x-test-mode': headerXTestMode(),
    'env-id': process.env[envKey]?.trim() || fallback,
  };
}

// ---- OAuth token cache ----------------------------------------------------

let oauthTokenCache: {
  token: string;
  tokenType: string;
  expiresAtMs: number;
} | null = null;

async function getOAuthAccessToken(): Promise<{ token: string; tokenType: string }> {
  const now = Date.now();
  const skewMs = 120_000;
  if (
    oauthTokenCache &&
    oauthTokenCache.expiresAtMs > now + skewMs &&
    oauthTokenCache.token
  ) {
    return { token: oauthTokenCache.token, tokenType: oauthTokenCache.tokenType };
  }

  const cid = consumerId();
  const csec = consumerSecret();
  if (!cid || !csec) {
    throw new Error('OAuth: set KBANK_CONSUMER_ID และ KBANK_CONSUMER_SECRET');
  }

  const basic = Buffer.from(`${cid}:${csec}`).toString('base64');
  const url = `${BASE_URL}/v2/oauth/token`;

  const response = await axios.post(
    url,
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        ...oauthRequestHeaders(),
        Authorization: `Basic ${basic}`,
      },
      timeout: 30000,
      validateStatus: () => true,
    }
  );

  if (response.status < 200 || response.status >= 300) {
    const detail =
      typeof response.data === 'object'
        ? JSON.stringify(response.data, null, 2)
        : String(response.data);
    throw new Error(`OAuth token failed HTTP ${response.status}\n${detail}`);
  }

  const data = response.data as Record<string, unknown>;
  const token = String(data.access_token || data.accessToken || '');
  if (!token) {
    throw new Error(`OAuth response ไม่มี access_token: ${JSON.stringify(data)}`);
  }
  const tokenType = String(data.token_type || data.tokenType || 'Bearer');
  const expiresIn = Number(data.expires_in || data.expiresIn || 0) || 3600;

  oauthTokenCache = {
    token,
    tokenType,
    expiresAtMs: now + expiresIn * 1000,
  };

  return { token, tokenType };
}

// ---- Types ----------------------------------------------------------------

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
  rawResponse: unknown;
}

export interface KBankInquiryResult {
  chargeId: string;
  status: string;
  paidAt: Date | null;
  kbankPaymentId: string | null;
  rawResponse: unknown;
}

// ---- Legacy v2 ------------------------------------------------------------

const createLegacyHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
    },
  });

const generatePartnerTxId = (orderId: number): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `HOTPOT-${orderId}-${timestamp}-${random}`.substring(0, 50);
};

const legacySignature = (payload: string): string => {
  if (!SECRET_KEY_LEGACY) return '';
  return crypto.createHmac('sha256', SECRET_KEY_LEGACY).update(payload).digest('hex');
};

async function createChargeLegacy(req: KBankCreateChargeRequest): Promise<KBankChargeResult> {
  if (!API_KEY || !MERCHANT_ID_LEGACY) {
    throw new Error(
      `KBank ${IS_SANDBOX ? 'sandbox' : 'production'}: โหมด legacy ต้องมี KBANK_*_API_KEY และ KBANK_*_MERCHANT_ID`
    );
  }

  const partnerTxId = generatePartnerTxId(req.orderId);
  const expiresAt = new Date(Date.now() + CHARGE_TIMEOUT_MINUTES * 60 * 1000);

  const requestBody: Record<string, unknown> = {
    partnerTxnUid: partnerTxId,
    partnerId: MERCHANT_ID_LEGACY,
    partnerSecret: SECRET_KEY_LEGACY,
    requestDt: new Date().toISOString(),
    merchantId: MID_LEGACY || MERCHANT_ID_LEGACY,
    qrType: '3',
    txnAmount: req.amount.toFixed(2),
    txnCurrencyCode: CURRENCY,
    reference1: `ORDER-${req.orderId}`,
    reference2: req.description || `Hotpot Order #${req.orderId}`,
    callbackUrl: CALLBACK_URL,
  };

  const sig = legacySignature(JSON.stringify(requestBody));
  if (sig) {
    requestBody['x-signature'] = sig;
  }

  try {
    const response = await createLegacyHttpClient().post(
      '/v2/kpaymentgateway/payment/qrcode/create',
      requestBody
    );
    const data = response.data as Record<string, unknown>;

    return {
      chargeId: String(data.qrTransactionId || data.chargeId || partnerTxId),
      partnerTxId,
      status: String(data.status || 'pending'),
      qrCodeData: data.qrCode || data.qrCodeData ? String(data.qrCode || data.qrCodeData) : null,
      qrImageUrl: data.qrImageUrl ? String(data.qrImageUrl) : null,
      expiresAt,
      rawResponse: data,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: Record<string, unknown> }; message?: string };
    const errData = err.response?.data;
    throw new Error(
      `KBank Create Charge (legacy) failed: ${errData?.description || errData?.errorDesc || err.message}`
    );
  }
}

async function inquireChargeLegacy(
  chargeId: string,
  partnerTxId: string
): Promise<KBankInquiryResult> {
  if (!API_KEY || !MERCHANT_ID_LEGACY) {
    throw new Error('KBank legacy: API key หรือ Merchant ID ยังไม่ตั้งค่า');
  }

  const requestBody: Record<string, unknown> = {
    partnerId: MERCHANT_ID_LEGACY,
    partnerSecret: SECRET_KEY_LEGACY,
    requestDt: new Date().toISOString(),
    merchantId: MID_LEGACY || MERCHANT_ID_LEGACY,
    qrTransactionId: chargeId,
    partnerTxnUid: partnerTxId,
  };

  try {
    const response = await createLegacyHttpClient().post(
      '/v2/kpaymentgateway/payment/qrcode/inquiry',
      requestBody
    );
    const data = response.data as Record<string, unknown>;
    const raw = String(data.status || data.txnStatus || '');
    const isPaid = ['success', 'paid', '00', 'approved'].includes(raw.toLowerCase());

    return {
      chargeId,
      status: isPaid ? 'paid' : raw || 'pending',
      paidAt: isPaid ? new Date() : null,
      kbankPaymentId:
        data.paymentId != null
          ? String(data.paymentId)
          : data.transactionId != null
            ? String(data.transactionId)
            : null,
      rawResponse: data,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: Record<string, unknown> }; message?: string };
    const errData = err.response?.data;
    throw new Error(
      `KBank Inquiry (legacy) failed: ${errData?.description || errData?.errorDesc || err.message}`
    );
  }
}

// ---- Open API OAuth /v1/qrpayment -----------------------------------------

function generateInquiryPartnerTxnUid(origPartnerTxId: string): string {
  const random = crypto.randomBytes(4).toString('hex');
  const ts = Date.now();
  const sliced = origPartnerTxId.substring(0, 24).replace(/[^A-Za-z0-9_-]/g, '');
  return `HOTPOT-I-${sliced}-${ts}-${random}`.substring(0, 50);
}

function txnStatusIndicatesPaid(txnStatusRaw: string, statusCode: string): boolean {
  const t = txnStatusRaw.toUpperCase().trim();
  if (statusCode === '00' && ['PAID', 'SUCCESS'].includes(t)) return true;
  if (['PAID', 'SUCCESS', 'SUCCEED'].includes(t)) return true;
  return false;
}

async function createChargeOpenApi(req: KBankCreateChargeRequest): Promise<KBankChargeResult> {
  const partnerId = partnerIdOpenApi()!;
  const partnerSecret = partnerSecretOpenApi()!;
  const merchantQrId = merchantQrIdOpenApi()!;
  const partnerTxId = generatePartnerTxId(req.orderId);
  const expiresAt = new Date(Date.now() + CHARGE_TIMEOUT_MINUTES * 60 * 1000);

  const requestBody: Record<string, unknown> = {
    partnerTxnUid: partnerTxId,
    partnerId,
    partnerSecret,
    requestDt: new Date().toISOString(),
    merchantId: merchantQrId,
    qrType: process.env.KBANK_QR_TYPE?.trim() || '3',
    txnAmount: req.amount.toFixed(2),
    txnCurrencyCode: CURRENCY,
    reference1: `ORDER-${req.orderId}`,
    reference2: req.description || `Hotpot Order #${req.orderId}`,
    reference3: process.env.KBANK_QR_REF3_PREFIX?.trim()
      ? `${process.env.KBANK_QR_REF3_PREFIX}-${req.orderId}`
      : String(req.orderId),
    reference4: process.env.KBANK_QR_REF4?.trim() || 'HOTPOT',
  };

  if (CALLBACK_URL) {
    requestBody.callbackUrl = CALLBACK_URL;
  }

  const auth = await getOAuthAccessToken();
  const authorization = `${auth.tokenType || 'Bearer'} ${auth.token}`.trim();

  try {
    const response = await axios.post(`${BASE_URL}/v1/qrpayment/request`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        ...sandboxQrPaymentHeaders('create'),
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      const detail =
        typeof response.data === 'object'
          ? JSON.stringify(response.data, null, 2)
          : String(response.data);
      throw new Error(`KBank QR request failed HTTP ${response.status}\n${detail}`);
    }

    const data = response.data as Record<string, unknown>;
    const bankTxnId = String(data.qrTransactionId || data.transactionId || data.txnId || '');
    const chargeId = bankTxnId || partnerTxId;

    return {
      chargeId,
      partnerTxId,
      status: String(data.status || data.txnStatus || 'pending'),
      qrCodeData: data.qrCode || data.qrData ? String(data.qrCode || data.qrData) : null,
      qrImageUrl: data.qrImageUrl ? String(data.qrImageUrl) : null,
      expiresAt,
      rawResponse: data,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('KBank QR request')) throw error;
    const err = error as { response?: { data?: unknown }; message?: string };
    throw new Error(
      `KBank Create Charge failed: ${err.response?.data != null ? JSON.stringify(err.response.data) : err.message}`
    );
  }
}

async function inquireChargeOpenApi(
  chargeId: string,
  origPartnerTxnUid: string
): Promise<KBankInquiryResult> {
  void chargeId;

  const partnerId = partnerIdOpenApi()!;
  const partnerSecret = partnerSecretOpenApi()!;
  const merchantQrId = merchantQrIdOpenApi()!;

  const requestBody = {
    partnerTxnUid: generateInquiryPartnerTxnUid(origPartnerTxnUid),
    origPartnerTxnUid,
    partnerId,
    partnerSecret,
    requestDt: new Date().toISOString(),
    merchantId: merchantQrId,
  };

  const auth = await getOAuthAccessToken();
  const authorization = `${auth.tokenType || 'Bearer'} ${auth.token}`.trim();

  try {
    const response = await axios.post(`${BASE_URL}/v1/qrpayment/v4/inquiry`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        ...sandboxQrPaymentHeaders('inquiry'),
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      const detail =
        typeof response.data === 'object'
          ? JSON.stringify(response.data, null, 2)
          : String(response.data);
      throw new Error(`KBank inquiry failed HTTP ${response.status}\n${detail}`);
    }

    const data = response.data as Record<string, unknown>;
    const statusCode = String(data.statusCode ?? '').trim();
    if (statusCode && statusCode !== '00') {
      throw new Error(`KBank inquiry statusCode=${statusCode}\n${JSON.stringify(data, null, 2)}`);
    }

    const txnStatus = String(data.txnStatus || data.status || 'pending');
    const paid = txnStatusIndicatesPaid(txnStatus, statusCode || '00');
    const kbankPaymentId =
      data.paymentId != null
        ? String(data.paymentId)
        : data.transactionId != null
          ? String(data.transactionId)
          : data.txnReferenceId != null
            ? String(data.txnReferenceId)
            : null;

    return {
      chargeId: String(chargeId),
      status: paid ? 'paid' : txnStatus.toLowerCase(),
      paidAt: paid ? new Date() : null,
      kbankPaymentId,
      rawResponse: data,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('KBank inquiry')) throw error;
    const err = error as { response?: { data?: unknown }; message?: string };
    throw new Error(
      `KBank Inquiry failed: ${err.response?.data != null ? JSON.stringify(err.response.data) : err.message}`
    );
  }
}

// ---- Public API -------------------------------------------------------------

/**
 * สร้าง QR / charge — เลือกชั้นโดยอัตโนมัติ:
 * - มี OAuth + Partner + MID → POST /v1/qrpayment/request
 * - ไม่ครบ และตั้ง KBANK_LEGACY_KPAY_GATEWAY / เก่ามีคีย์ → POST /v2/kpaymentgateway/...
 */
export const createCharge = async (req: KBankCreateChargeRequest): Promise<KBankChargeResult> => {
  if (usesOAuthPosQrFlow()) {
    return createChargeOpenApi(req);
  }
  return createChargeLegacy(req);
};

/**
 * Inquiry — ในโฟลว์ OAuth ใช้ /v1/qrpayment/v4/inquiry และ origPartnerTxnUid = partner_tx_id จากตอนสร้าง
 */
export const inquireCharge = async (
  chargeId: string,
  partnerTxId: string
): Promise<KBankInquiryResult> => {
  if (usesOAuthPosQrFlow()) {
    return inquireChargeOpenApi(chargeId, partnerTxId);
  }
  return inquireChargeLegacy(chargeId, partnerTxId);
};

export const verifyWebhookSignature = (payload: string, signatureHeader: string): boolean => {
  if (!WEBHOOK_SECRET) {
    if (NODE_ENV === 'production') {
      console.warn(
        '[KBank] KBANK_WEBHOOK_SECRET ไม่ได้ตั้ง — ปฏิเสธ webhook ใน production (ตั้ง webhook secret เพื่อรับได้)'
      );
      return false;
    }
    console.warn('[KBank] KBANK_WEBHOOK_SECRET ไม่ได้ตั้ง — sandbox: ข้ามการตรวจลายเซ็น');
    return true;
  }
  const signature = typeof signatureHeader === 'string' ? signatureHeader.trim() : '';
  if (!signature) return false;

  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  try {
    if (expected.length === signature.length) {
      return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
    }
  } catch {
    /* fallthrough */
  }
  return expected === signature;
};

export const getKBankConfig = () => {
  const openApiReady = oauthQrReady();
  const legacyReady = !!(API_KEY && MERCHANT_ID_LEGACY);

  return {
    env: ENV,
    isSandbox: IS_SANDBOX,
    baseUrl: BASE_URL,
    /** เส้นทางเรียก API ในรันไทม์ */
    apiMode: usesOAuthPosQrFlow() ? ('openapi_oauth_pos_qr_v1' as const) : ('legacy_kpay_v2' as const),
    hasCredentials: usesOAuthPosQrFlow() || legacyReady,
    openapiReady: FORCE_LEGACY_V2 ? false : openApiReady,
    legacyConfigured: legacyReady,
    currency: CURRENCY,
    timeoutMinutes: CHARGE_TIMEOUT_MINUTES,
    callbackUrl: CALLBACK_URL,
    /** ธนาคารอาจสั่งให้ปิดเมื่อเข้าจริง — default sandbox เปิด */
    sandboxTestHeadersActive: IS_SANDBOX && includeSandboxTestHeaders(),
  };
};
