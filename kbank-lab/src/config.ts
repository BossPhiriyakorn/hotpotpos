import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(__dirname, '..');
const backendEnv = path.resolve(labRoot, '..', 'backend', '.env');

// โหลด backend/.env ก่อน (ค่า default) แล้วให้ kbank-lab/.env override
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
}
dotenv.config({ path: path.join(labRoot, '.env') });

function req(name: string, optional = false): string {
  const v = process.env[name]?.trim();
  if (!v && !optional) {
    throw new Error(`ขาดค่า ${name} — ใส่ใน kbank-lab/.env (ดู .env.example)`);
  }
  return v || '';
}

/** ค่าจาก backend/.env ที่ยังเป็น placeholder ไม่นับ */
function envReal(name: string): string | undefined {
  const v = process.env[name]?.trim();
  if (!v || v.startsWith('your_')) return undefined;
  return v;
}

function envFirst(names: string[], fallback: string): string {
  for (const name of names) {
    const v = envReal(name);
    if (v) return v;
  }
  return fallback;
}

export const config = {
  env: process.env.KBANK_ENV || 'sandbox',
  baseUrl: (
    process.env.KBANK_BASE_URL ||
    process.env.KBANK_SANDBOX_BASE_URL ||
    'https://openapi-sandbox.kasikornbank.com'
  ).replace(/\/$/, ''),

  consumerId: () => req('KBANK_CONSUMER_ID'),
  consumerSecret: () => req('KBANK_CONSUMER_SECRET'),

  oauthTestMode: process.env.KBANK_OAUTH_TEST_MODE || 'true',
  oauthEnvId: process.env.KBANK_OAUTH_ENV_ID || 'OAUTH2',

  apiKey: () => req('KBANK_SANDBOX_API_KEY', true) || req('KBANK_PRODUCTION_API_KEY', true),
  callbackUrl: () => process.env.KBANK_CALLBACK_URL?.trim() || '',

  /** Exercise 2+ — QR Payment API */
  qrEnvId: process.env.KBANK_QR_ENV_ID || 'QR002',
  qrCcEnvId: process.env.KBANK_QR_CC_ENV_ID || 'QR003',
  /** Exercise 4–7: Inquiry QR */
  inquiryRequestedEnvId: process.env.KBANK_INQUIRY_REQUESTED_ENV_ID || 'QR004',
  /** Exercise 4: inquiry uid + QR ต้นทางจากข้อ 2 */
  inquiryPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0002',
  inquiryOrigPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_ORIG_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0001',
  /** Exercise 5: Inquiry QR (Cancelled) */
  inquiryCancelledEnvId: process.env.KBANK_INQUIRY_CANCELLED_ENV_ID || 'QR005',
  inquiryCancelledPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_CANCELLED_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0003',
  inquiryCancelledOrigPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_CANCELLED_ORIG_TXN_UID?.trim() || 'TESTCANCELQR001',
  /** Exercise 6: Inquiry QR (Paid) */
  inquiryPaidEnvId: process.env.KBANK_INQUIRY_PAID_ENV_ID || 'QR006',
  inquiryPaidPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_PAID_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0004',
  inquiryPaidOrigPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_PAID_ORIG_TXN_UID?.trim() || 'PARTNERTEST0007',
  /** Exercise 7: Inquiry QR (Voided) */
  inquiryVoidedEnvId: process.env.KBANK_INQUIRY_VOIDED_ENV_ID || 'QR007',
  inquiryVoidedPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_VOIDED_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0005',
  inquiryVoidedOrigPartnerTxnUid: () =>
    process.env.KBANK_INQUIRY_VOIDED_ORIG_TXN_UID?.trim() || 'PARTNERTEST0011',
  /** Exercise 8: Cancel QR (Requested) — ยกเลิก QR จากข้อ 2 */
  cancelRequestedEnvId: process.env.KBANK_CANCEL_REQUESTED_ENV_ID || 'QR008',
  cancelRequestedPartnerTxnUid: () =>
    process.env.KBANK_CANCEL_REQUESTED_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0006',
  cancelRequestedOrigPartnerTxnUid: () =>
    process.env.KBANK_CANCEL_REQUESTED_ORIG_TXN_UID?.trim() || 'PARTNERTEST0001',
  /** Exercise 9: Cancel QR (Paid) — sandbox QR ชำระแล้ว ยกเลิกไม่ได้ */
  cancelPaidEnvId: process.env.KBANK_CANCEL_PAID_ENV_ID || 'QR010',
  cancelPaidPartnerTxnUid: () =>
    process.env.KBANK_CANCEL_PAID_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0007',
  cancelPaidOrigPartnerTxnUid: () =>
    process.env.KBANK_CANCEL_PAID_ORIG_TXN_UID?.trim() || 'PARTNERTEST0007',
  /** Exercise 10: Cancel QR (Voided) */
  cancelVoidedEnvId: process.env.KBANK_CANCEL_VOIDED_ENV_ID || 'QR011',
  cancelVoidedPartnerTxnUid: () =>
    process.env.KBANK_CANCEL_VOIDED_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0008',
  cancelVoidedOrigPartnerTxnUid: () =>
    process.env.KBANK_CANCEL_VOIDED_ORIG_TXN_UID?.trim() || 'PARTNERTEST0011',
  /** Exercise 11: Void Payment (Paid) */
  voidPaidEnvId: process.env.KBANK_VOID_PAID_ENV_ID || 'QR012',
  voidPaidPartnerTxnUid: () =>
    process.env.KBANK_VOID_PAID_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0009',
  voidPaidOrigPartnerTxnUid: () =>
    process.env.KBANK_VOID_PAID_ORIG_TXN_UID?.trim() || 'PARTNERTEST0011',
  /** Exercise 12: Void Payment (QR Credit Card) */
  voidCcEnvId: process.env.KBANK_VOID_CC_ENV_ID || 'QR013',
  voidCcPartnerTxnUid: () =>
    process.env.KBANK_VOID_CC_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0009-2',
  voidCcOrigPartnerTxnUid: () =>
    process.env.KBANK_VOID_CC_ORIG_TXN_UID?.trim() || 'PARTNERTEST0001-2',
  /** Exercise 13: Void Payment (Not Paid) */
  voidNotPaidEnvId: process.env.KBANK_VOID_NOT_PAID_ENV_ID || 'QR014',
  voidNotPaidPartnerTxnUid: () =>
    process.env.KBANK_VOID_NOT_PAID_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0010',
  voidNotPaidOrigPartnerTxnUid: () =>
    process.env.KBANK_VOID_NOT_PAID_ORIG_TXN_UID?.trim() || 'PARTNERTEST0017',
  /** Exercise 14: Void Payment (Settlement) */
  voidSettlementEnvId: process.env.KBANK_VOID_SETTLEMENT_ENV_ID || 'QR015',
  voidSettlementPartnerTxnUid: () =>
    process.env.KBANK_VOID_SETTLEMENT_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0011',
  voidSettlementOrigPartnerTxnUid: () =>
    process.env.KBANK_VOID_SETTLEMENT_ORIG_TXN_UID?.trim() || 'PARTNERTEST0016',
  /** Exercise 15: Void Payment (Over the day) */
  voidOverDayEnvId: process.env.KBANK_VOID_OVER_DAY_ENV_ID || 'QR016',
  voidOverDayPartnerTxnUid: () =>
    process.env.KBANK_VOID_OVER_DAY_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0012',
  voidOverDayOrigPartnerTxnUid: () =>
    process.env.KBANK_VOID_OVER_DAY_ORIG_TXN_UID?.trim() || 'PARTNERTEST0007',
  qrTestMode: process.env.KBANK_QR_TEST_MODE || 'true',

  /** ค่าตามตาราง sandbox Exercise 2 (override ใน kbank-lab/.env เมื่อได้ค่าจริงจาก UAT) */
  partnerId: () => envFirst(['KBANK_PARTNER_ID', 'KBANK_SANDBOX_MERCHANT_ID'], 'PTR1051673'),
  partnerSecret: () =>
    envFirst(['KBANK_PARTNER_SECRET', 'KBANK_SANDBOX_SECRET_KEY'], 'd4bded59200547bc85903574a293831b'),
  merchantId: () => envFirst(['KBANK_MERCHANT_ID', 'KBANK_SANDBOX_MID'], 'KB102057149704'),
  qrPartnerTxnUid: () => process.env.KBANK_QR_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0001',
  qrCcPartnerTxnUid: () => process.env.KBANK_QR_CC_PARTNER_TXN_UID?.trim() || 'PARTNERTEST0001-2',
  qrAmount: () => process.env.KBANK_QR_AMOUNT?.trim() || '100.00',
  qrType: () => process.env.KBANK_QR_TYPE?.trim() || '3',
  qrCcType: () => process.env.KBANK_QR_CC_TYPE?.trim() || '4',
  qrCurrency: () => process.env.KBANK_QR_CURRENCY?.trim() || 'THB',
  qrReference1: () => process.env.KBANK_QR_REF1?.trim() || 'INV001',
  qrReference2: () => process.env.KBANK_QR_REF2?.trim() || 'HELLOWORLD',
  qrReference3: () => process.env.KBANK_QR_REF3?.trim() || 'INV001',
  qrReference4: () => process.env.KBANK_QR_REF4?.trim() || 'INV001',

  dataDir: path.join(labRoot, 'data'),
};
