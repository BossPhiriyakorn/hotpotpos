import axios from 'axios';
import { config } from './config.js';
import { loadOAuthToken } from './state.js';
import { saveLastQr, type LabQrState } from './state.js';

export interface GenerateQrBody {
  partnerTxnUid: string;
  partnerId: string;
  partnerSecret: string;
  requestDt: string;
  merchantId: string;
  qrType: string;
  txnAmount: string;
  txnCurrencyCode: string;
  reference1: string;
  reference2: string;
  reference3: string;
  reference4: string;
}

export function buildExercise2Body(overrides?: Partial<GenerateQrBody>): GenerateQrBody {
  return {
    partnerTxnUid: config.qrPartnerTxnUid(),
    partnerId: config.partnerId(),
    partnerSecret: config.partnerSecret(),
    requestDt: new Date().toISOString(),
    merchantId: config.merchantId(),
    qrType: config.qrType(),
    txnAmount: config.qrAmount(),
    txnCurrencyCode: config.qrCurrency(),
    reference1: config.qrReference1(),
    reference2: config.qrReference2(),
    reference3: config.qrReference3(),
    reference4: config.qrReference4(),
    ...overrides,
  };
}

/** Exercise 3 — QR Credit Card (qrType 4, env-id QR003) */
export function buildExercise3Body(overrides?: Partial<GenerateQrBody>): GenerateQrBody {
  return buildExercise2Body({
    partnerTxnUid: config.qrCcPartnerTxnUid(),
    qrType: config.qrCcType(),
    ...overrides,
  });
}

async function requestQrPayment(
  body: GenerateQrBody,
  envId: string,
  saveFile: string,
  label: string
): Promise<LabQrState> {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const url = `${config.baseUrl}/v1/qrpayment/request`;
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
  const qrTransactionId = String(
    data.qrTransactionId || data.transactionId || data.txnId || ''
  );

  const state: LabQrState = {
    partnerTxnUid: body.partnerTxnUid,
    partnerId: body.partnerId,
    merchantId: body.merchantId,
    qrTransactionId: qrTransactionId || null,
    status: String(data.status || data.txnStatus || 'requested'),
    qrCode: String(data.qrCode || data.qrData || '') || null,
    qrImageUrl: String(data.qrImageUrl || '') || null,
    txnAmount: body.txnAmount,
    createdAt: new Date().toISOString(),
    raw: data,
  };

  saveLastQr(state, saveFile);
  return state;
}

/** Exercise 2 — Generate Thai QR Code */
export async function generateThaiQr(
  body: GenerateQrBody = buildExercise2Body()
): Promise<LabQrState> {
  return requestQrPayment(body, config.qrEnvId, 'last-qr.json', 'Generate Thai QR');
}

/** Exercise 3 — Generate QR Credit Card */
export async function generateQrCreditCard(
  body: GenerateQrBody = buildExercise3Body()
): Promise<LabQrState> {
  return requestQrPayment(body, config.qrCcEnvId, 'last-qr-cc.json', 'Generate QR Credit Card');
}
