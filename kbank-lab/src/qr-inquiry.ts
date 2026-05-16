import axios from 'axios';
import { config } from './config.js';
import { loadOAuthToken } from './state.js';

export interface InquiryQrBody {
  partnerTxnUid: string;
  partnerId: string;
  partnerSecret: string;
  requestDt: string;
  merchantId: string;
  origPartnerTxnUid?: string;
}

function baseInquiryFields(): Omit<InquiryQrBody, 'partnerTxnUid' | 'origPartnerTxnUid'> {
  return {
    partnerId: config.partnerId(),
    partnerSecret: config.partnerSecret(),
    requestDt: new Date().toISOString(),
    merchantId: config.merchantId(),
  };
}

/** Exercise 4 — Inquiry QR (Status Requested) */
export function buildExercise4Body(): InquiryQrBody {
  return {
    partnerTxnUid: config.inquiryPartnerTxnUid(),
    origPartnerTxnUid: config.inquiryOrigPartnerTxnUid(),
    ...baseInquiryFields(),
  };
}

/** Exercise 5 — Inquiry QR (Status Cancelled) */
export function buildExercise5Body(): InquiryQrBody {
  return {
    partnerTxnUid: config.inquiryCancelledPartnerTxnUid(),
    origPartnerTxnUid: config.inquiryCancelledOrigPartnerTxnUid(),
    ...baseInquiryFields(),
  };
}

/** Exercise 6 — Inquiry QR (Status Paid) */
export function buildExercise6Body(): InquiryQrBody {
  return {
    partnerTxnUid: config.inquiryPaidPartnerTxnUid(),
    origPartnerTxnUid: config.inquiryPaidOrigPartnerTxnUid(),
    ...baseInquiryFields(),
  };
}

/** Exercise 7 — Inquiry QR (Status Voided) */
export function buildExercise7Body(): InquiryQrBody {
  return {
    partnerTxnUid: config.inquiryVoidedPartnerTxnUid(),
    origPartnerTxnUid: config.inquiryVoidedOrigPartnerTxnUid(),
    ...baseInquiryFields(),
  };
}

export interface InquiryQrResult {
  partnerTxnUid: string;
  status: string;
  statusCode: string;
  raw: unknown;
}

/**
 * Inquiry QR payment status
 * POST /v1/qrpayment/v4/inquiry
 */
export async function inquireQr(
  body: InquiryQrBody,
  envId: string,
  label: string
): Promise<InquiryQrResult> {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const url = `${config.baseUrl}/v1/qrpayment/v4/inquiry`;
  const authType = token.tokenType || 'Bearer';

  const response = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${authType} ${token.accessToken}`,
      'x-test-mode': config.qrTestMode,
      'env-id': envId,
    },
    timeout: 30000,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    const detail =
      typeof response.data === 'object'
        ? JSON.stringify(response.data, null, 2)
        : String(response.data);
    throw new Error(`${label} failed HTTP ${response.status}\n${detail}`);
  }

  const data = response.data as Record<string, unknown>;
  const statusCode = String(data.statusCode ?? '');

  if (statusCode && statusCode !== '00') {
    throw new Error(
      `${label} API error statusCode=${statusCode}\n${JSON.stringify(data, null, 2)}`
    );
  }

  return {
    partnerTxnUid: body.partnerTxnUid,
    status: String(data.txnStatus || data.status || 'requested'),
    statusCode,
    raw: data,
  };
}
