/**
 * Exercise 4: Inquiry QR (Status Requested)
 * ต้องมี QR จากข้อ 2 (PARTNERTEST0001) ก่อน — รัน 02:qr-thai หรือ Execute ข้อ 2 บน portal
 */
import { config } from '../src/config.js';
import { buildExercise4Body, inquireQr } from '../src/qr-inquiry.js';
import { loadOAuthToken } from '../src/state.js';
import { generateThaiQr, buildExercise2Body } from '../src/qr-payment.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  if (!process.argv.includes('--skip-create')) {
    console.log('→ สร้าง Thai QR ข้อ 2 (PARTNERTEST0001) …');
    await generateThaiQr(buildExercise2Body());
  }

  const body = buildExercise4Body();
  const envId = config.inquiryRequestedEnvId;

  console.log('Exercise 4 — Inquiry QR (Status Requested)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/v4/inquiry`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await inquireQr(body, envId, 'Inquiry (Requested)');

  console.log('✅ Inquiry สำเร็จ');
  console.log('   partnerTxnUid:', result.partnerTxnUid);
  console.log('   status:', result.status);
  console.log('   statusCode:', result.statusCode);
  console.log('\nขั้นถัดไป: portal → Exercise 4 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nแนะนำ: npm run 01:oauth && npm run 02:qr-thai && npm run 04:inquiry-requested');
  process.exit(1);
});
