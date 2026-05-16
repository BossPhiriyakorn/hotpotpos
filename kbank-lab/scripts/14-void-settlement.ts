/**
 * Exercise 14: Void Payment (Status Settlement)
 * คาดว่า void ไม่ได้ — ผ่านเมื่อ API ตอบ error (statusCode != 00)
 */
import { config } from '../src/config.js';
import { buildExercise14Body, voidQrCall } from '../src/qr-void.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise14Body();
  const envId = config.voidSettlementEnvId;

  console.log('Exercise 14 — Void Payment (Status Settlement)');
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

  console.log('\n✅ ผลตามที่ exercise คาดไว้ — void หลัง Settlement ไม่ได้');
  console.log(`   statusCode: ${result.statusCode}`);
  if (result.errorDesc) console.log(`   errorDesc: ${result.errorDesc}`);
  console.log('\n🎉 ครบ 14 ข้อ lab — ตรวจ checklist บน portal');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 14:void-settlement');
  process.exit(1);
});
