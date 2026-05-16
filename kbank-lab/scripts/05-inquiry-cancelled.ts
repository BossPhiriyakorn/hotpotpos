/**
 * Exercise 5: Inquiry QR (Status Cancelled)
 * Sandbox มี QR ยกเลิกสำเร็จรูปที่ origPartnerTxnUid = TESTCANCELQR001
 */
import { config } from '../src/config.js';
import { buildExercise5Body, inquireQr } from '../src/qr-inquiry.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise5Body();
  const envId = config.inquiryCancelledEnvId;

  console.log('Exercise 5 — Inquiry QR (Status Cancelled)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/v4/inquiry`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await inquireQr(body, envId, 'Inquiry (Cancelled)');

  console.log('✅ Inquiry สำเร็จ');
  console.log('   status:', result.status);
  console.log('   statusCode:', result.statusCode);
  console.log('\nขั้นถัดไป: portal → Exercise 5 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 05:inquiry-cancelled');
  process.exit(1);
});
