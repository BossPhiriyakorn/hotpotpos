/**
 * Exercise 12: Void Payment (QR Credit Card)
 */
import { config } from '../src/config.js';
import { buildExercise12Body, voidQr } from '../src/qr-void.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise12Body();
  const envId = config.voidCcEnvId;

  console.log('Exercise 12 — Void Payment (QR Credit Card)');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/void`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': envId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await voidQr(body, envId);

  console.log('✅ Void สำเร็จ');
  console.log('   statusCode:', result.statusCode);
  console.log(JSON.stringify(result.raw, null, 2));
  console.log('\nขั้นถัดไป: portal → Exercise 12 → ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nลอง: npm run 01:oauth && npm run 12:void-cc');
  process.exit(1);
});
