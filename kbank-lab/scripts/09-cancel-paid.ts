/**
 * Exercise 9: Cancel QR (Status Paid)
 * คาดว่ายกเลิกไม่ได้ — ผ่านเมื่อ API ตอบ error (statusCode != 00)
 */
import { config } from '../src/config.js';
import { buildExercise9Body, cancelQrCall } from '../src/qr-cancel.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise9Body();
  const envId = config.cancelPaidEnvId;

  console.log('Exercise 9 — Cancel QR (Status Paid)');
  console.log('(แบบทดสอบคาดว่า **ยกเลิกไม่สำเร็จ** — นั่นคือผลที่ถูกต้อง)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/cancel`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await cancelQrCall(body, envId);

  console.log('Response:', JSON.stringify(result.raw, null, 2));

  if (result.statusCode === '00') {
    console.warn('\n⚠️  Cancel สำเร็จ (statusCode 00) — ไม่ตรงผลที่ exercise คาดไว้');
    console.warn('   ลอง Execute บน portal ตามตาราง exercise');
    process.exit(1);
  }

  console.log('\n✅ ผลตามที่ exercise คาดไว้ — ยกเลิก QR ที่ Paid ไม่ได้');
  console.log(`   statusCode: ${result.statusCode}`);
  if (result.errorDesc) console.log(`   errorDesc: ${result.errorDesc}`);
  console.log('\nขั้นถัดไป: portal → Exercise 9 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 09:cancel-paid');
  process.exit(1);
});
