/**
 * Exercise 8: Cancel QR (Status Requested)
 * สร้าง Thai QR (PARTNERTEST0001) จากข้อ 2 แล้ว cancel
 */
import { config } from '../src/config.js';
import { buildExercise8Body, cancelQr } from '../src/qr-cancel.js';
import { loadOAuthToken } from '../src/state.js';
import { buildExercise2Body, generateThaiQr } from '../src/qr-payment.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  if (!process.argv.includes('--skip-create')) {
    console.log('→ สร้าง Thai QR ข้อ 2 (PARTNERTEST0001) …');
    await generateThaiQr(buildExercise2Body());
  }

  const body = buildExercise8Body();
  const envId = config.cancelRequestedEnvId;

  console.log('Exercise 8 — Cancel QR (Status Requested)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/cancel`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const data = await cancelQr(body, envId);
  console.log('✅ Cancel QR สำเร็จ');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nขั้นถัดไป: portal → Exercise 8 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 02:qr-thai && npm run 08:cancel-requested');
  process.exit(1);
});
