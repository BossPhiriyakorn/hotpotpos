import axios from 'axios';
import { config } from './config.js';
import { loadOAuthToken } from './state.js';

export interface CancelQrBody {
  partnerTxnUid: string;
  partnerId: string;
  partnerSecret: string;
  requestDt: string;
  merchantId: string;
  origPartnerTxnUid: string;
}

function baseCancelFields(): Omit<CancelQrBody, 'partnerTxnUid' | 'origPartnerTxnUid'> {
  return {
    partnerId: config.partnerId(),
    partnerSecret: config.partnerSecret(),
    requestDt: new Date().toISOString(),
    merchantId: config.merchantId(),
  };
}

/** Exercise 8 — Cancel QR (Status Requested) */
export function buildExercise8Body(): CancelQrBody {
  return {
    partnerTxnUid: config.cancelRequestedPartnerTxnUid(),
    origPartnerTxnUid: config.cancelRequestedOrigPartnerTxnUid(),
    ...baseCancelFields(),
  };
}

/** Exercise 9 — Cancel QR (Status Paid) — คาดว่ายกเลิกไม่ได้ */
export function buildExercise9Body(): CancelQrBody {
  const uid = config.cancelPaidPartnerTxnUid();
  return {
    partnerTxnUid: uid,
    origPartnerTxnUid: config.cancelPaidOrigPartnerTxnUid(),
    ...baseCancelFields(),
  };
}

/** Exercise 10 — Cancel QR (Status Voided) — คาดว่ายกเลิกไม่ได้ */
export function buildExercise10Body(): CancelQrBody {
  return {
    partnerTxnUid: config.cancelVoidedPartnerTxnUid(),
    origPartnerTxnUid: config.cancelVoidedOrigPartnerTxnUid(),
    ...baseCancelFields(),
  };
}

export interface CancelQrResult {
  httpStatus: number;
  statusCode: string;
  errorCode: string;
  errorDesc: string;
  raw: unknown;
}

/**
 * Cancel QR — คืนผลดิบ (ไม่ throw เมื่อ statusCode != 00)
 */
export async function cancelQrCall(
  body: CancelQrBody,
  envId: string,
  apiPath = '/v1/qrpayment/cancel'
): Promise<CancelQrResult> {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const url = `${config.baseUrl}${apiPath}`;
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
    throw new Error(`Cancel QR failed HTTP ${response.status}\n${detail}`);
  }

  const data = response.data as Record<string, unknown>;
  return {
    httpStatus: response.status,
    statusCode: String(data.statusCode ?? ''),
    errorCode: String(data.errorCode ?? ''),
    errorDesc: String(data.errorDesc ?? ''),
    raw: data,
  };
}

/** Cancel QR — ต้องได้ statusCode 00 */
export async function cancelQr(
  body: CancelQrBody,
  envId: string,
  apiPath = '/v1/qrpayment/cancel'
): Promise<unknown> {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const result = await cancelQrCall(body, envId, apiPath);
  if (result.statusCode && result.statusCode !== '00') {
    throw new Error(`Cancel QR API error\n${JSON.stringify(result.raw, null, 2)}`);
  }
  return result.raw;
}
