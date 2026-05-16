/**
 * Exercise 7: Inquiry QR (Status Voided)
 * Sandbox มี QR void สำเร็จรูปที่ origPartnerTxnUid = PARTNERTEST0011
 */
import { config } from '../src/config.js';
import { buildExercise7Body, inquireQr } from '../src/qr-inquiry.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise7Body();
  const envId = config.inquiryVoidedEnvId;

  console.log('Exercise 7 — Inquiry QR (Status Voided)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/v4/inquiry`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await inquireQr(body, envId, 'Inquiry (Voided)');

  console.log('✅ Inquiry สำเร็จ');
  console.log('   status:', result.status);
  console.log('   statusCode:', result.statusCode);
  console.log('\nขั้นถัดไป: portal → Exercise 7 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 07:inquiry-voided');
  process.exit(1);
});
