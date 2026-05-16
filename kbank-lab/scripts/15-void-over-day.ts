/**
 * Exercise 15: Void Payment (Over the day)
 * void หลังวันทำรายการ — คาดว่า void ไม่ได้
 */
import { config } from '../src/config.js';
import { buildExercise15Body, voidQrCall } from '../src/qr-void.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise15Body();
  const envId = config.voidOverDayEnvId;

  console.log('Exercise 15 — Void Payment (Over the day)');
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

  console.log('\n✅ ผลตามที่ exercise คาดไว้ — void หลังวันทำรายการไม่ได้');
  console.log(`   statusCode: ${result.statusCode}`);
  if (result.errorDesc) console.log(`   errorDesc: ${result.errorDesc}`);
  console.log('\n🎉 ครบ 15 ข้อ lab — ตรวจ checklist บน portal (15/15)');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 15:void-over-day');
  process.exit(1);
});
