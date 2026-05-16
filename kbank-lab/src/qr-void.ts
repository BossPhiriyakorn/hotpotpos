import axios from 'axios';
import { config } from './config.js';
import { loadOAuthToken } from './state.js';

export interface VoidQrBody {
  partnerTxnUid: string;
  partnerId: string;
  partnerSecret: string;
  requestDt: string;
  merchantId: string;
  origPartnerTxnUid: string;
}

function baseVoidFields(): Omit<VoidQrBody, 'partnerTxnUid' | 'origPartnerTxnUid'> {
  return {
    partnerId: config.partnerId(),
    partnerSecret: config.partnerSecret(),
    requestDt: new Date().toISOString(),
    merchantId: config.merchantId(),
  };
}

/** Exercise 11 — Void Payment (Status Paid) */
export function buildExercise11Body(): VoidQrBody {
  return {
    partnerTxnUid: config.voidPaidPartnerTxnUid(),
    origPartnerTxnUid: config.voidPaidOrigPartnerTxnUid(),
    ...baseVoidFields(),
  };
}

/** Exercise 12 — Void Payment (QR Credit Card) */
export function buildExercise12Body(): VoidQrBody {
  return {
    partnerTxnUid: config.voidCcPartnerTxnUid(),
    origPartnerTxnUid: config.voidCcOrigPartnerTxnUid(),
    ...baseVoidFields(),
  };
}

/** Exercise 13 — Void Payment (Status Not Paid) — คาดว่า void ไม่ได้ */
export function buildExercise13Body(): VoidQrBody {
  return {
    partnerTxnUid: config.voidNotPaidPartnerTxnUid(),
    origPartnerTxnUid: config.voidNotPaidOrigPartnerTxnUid(),
    ...baseVoidFields(),
  };
}

/** Exercise 14 — Void Payment (Status Settlement) — คาดว่า void ไม่ได้ */
export function buildExercise14Body(): VoidQrBody {
  return {
    partnerTxnUid: config.voidSettlementPartnerTxnUid(),
    origPartnerTxnUid: config.voidSettlementOrigPartnerTxnUid(),
    ...baseVoidFields(),
  };
}

/** Exercise 15 — Void Payment (Over the day) — คาดว่า void ไม่ได้ */
export function buildExercise15Body(): VoidQrBody {
  return {
    partnerTxnUid: config.voidOverDayPartnerTxnUid(),
    origPartnerTxnUid: config.voidOverDayOrigPartnerTxnUid(),
    ...baseVoidFields(),
  };
}

export interface VoidQrResult {
  statusCode: string;
  errorCode: string;
  errorDesc: string;
  raw: unknown;
}

/**
 * Void payment — POST /v1/qrpayment/void
 */
export async function voidQr(
  body: VoidQrBody,
  envId: string
): Promise<VoidQrResult> {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const url = `${config.baseUrl}/v1/qrpayment/void`;
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
    throw new Error(`Void payment failed HTTP ${response.status}\n${detail}`);
  }

  const data = response.data as Record<string, unknown>;
  const statusCode = String(data.statusCode ?? '');

  if (statusCode && statusCode !== '00') {
    throw new Error(`Void payment API error\n${JSON.stringify(data, null, 2)}`);
  }

  return {
    statusCode,
    errorCode: String(data.errorCode ?? ''),
    errorDesc: String(data.errorDesc ?? ''),
    raw: data,
  };
}

/** คืนผลดิบ — ไม่ throw เมื่อ statusCode != 00 */
export async function voidQrCall(body: VoidQrBody, envId: string): Promise<VoidQrResult> {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const url = `${config.baseUrl}/v1/qrpayment/void`;
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
    throw new Error(`Void payment failed HTTP ${response.status}\n${detail}`);
  }

  const data = response.data as Record<string, unknown>;
  return {
    statusCode: String(data.statusCode ?? ''),
    errorCode: String(data.errorCode ?? ''),
    errorDesc: String(data.errorDesc ?? ''),
    raw: data,
  };
}
