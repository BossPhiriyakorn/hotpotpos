/**
 * Exercise 13: Void Payment (Status Not Paid)
 * คาดว่า void ไม่ได้ — ผ่านเมื่อ API ตอบ error (statusCode != 00)
 */
import { config } from '../src/config.js';
import { buildExercise13Body, voidQrCall } from '../src/qr-void.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise13Body();
  const envId = config.voidNotPaidEnvId;

  console.log('Exercise 13 — Void Payment (Status Not Paid)');
  console.log('(แบบทดสอบคาดว่า **void ไม่สำเร็จ** — นั่นคือผลที่ถูกต้อง)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/void`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await voidQrCall(body, envId);

  console.log('Response:', JSON.stringify(result.raw, null, 2));

  if (result.statusCode === '00') {
    console.warn('\n⚠️  Void สำเร็จ (statusCode 00) — ไม่ตรงผลที่ exercise คาดไว้');
    process.exit(1);
  }

  console.log('\n✅ ผลตามที่ exercise คาดไว้ — void QR ที่ยังไม่ชำระไม่ได้');
  console.log(`   statusCode: ${result.statusCode}`);
  if (result.errorDesc) console.log(`   errorDesc: ${result.errorDesc}`);
  console.log('\nขั้นถัดไป: portal → Exercise 13 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 13:void-not-paid');
  process.exit(1);
});
