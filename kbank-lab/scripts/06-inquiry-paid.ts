/**
 * Exercise 6: Inquiry QR (Status Paid)
 * Sandbox มี QR ชำระแล้วสำเร็จรูปที่ origPartnerTxnUid = PARTNERTEST0007
 */
import { config } from '../src/config.js';
import { buildExercise6Body, inquireQr } from '../src/qr-inquiry.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise6Body();
  const envId = config.inquiryPaidEnvId;

  console.log('Exercise 6 — Inquiry QR (Status Paid)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/v4/inquiry`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await inquireQr(body, envId, 'Inquiry (Paid)');

  console.log('✅ Inquiry สำเร็จ');
  console.log('   status:', result.status);
  console.log('   statusCode:', result.statusCode);
  console.log('\nขั้นถัดไป: portal → Exercise 6 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 06:inquiry-paid');
  process.exit(1);
});
