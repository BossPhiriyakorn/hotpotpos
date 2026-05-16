/**
 * Exercise 11: Void Payment (Status Paid)
 * ยกเลิกรายการชำระ (คืนเงิน) สำหรับ QR ที่ Paid แล้ว
 */
import { config } from '../src/config.js';
import { buildExercise11Body, voidQr } from '../src/qr-void.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise11Body();
  const envId = config.voidPaidEnvId;

  console.log('Exercise 11 — Void Payment (Status Paid)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/void`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await voidQr(body, envId);

  console.log('✅ Void สำเร็จ');
  console.log('   statusCode:', result.statusCode);
  console.log(JSON.stringify(result.raw, null, 2));
  console.log('\nขั้นถัดไป: portal → Exercise 11 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 11:void-paid');
  process.exit(1);
});
