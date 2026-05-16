/**
 * Exercise 2: Generate Thai QR Code
 */
import { buildExercise2Body, generateThaiQr } from '../src/qr-payment.js';
import { config } from '../src/config.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  const token = loadOAuthToken();
  if (!token) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise2Body();

  console.log('Exercise 2 — Generate Thai QR Code');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/request`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': config.qrEnvId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await generateThaiQr(body);

  console.log('✅ สร้าง Thai QR สำเร็จ');
  console.log('   qrTransactionId:', result.qrTransactionId || '(ดูใน raw response)');
  console.log('   status:', result.status);
  if (result.qrCode) console.log('   qrCode:', result.qrCode.slice(0, 80) + '…');
  if (result.qrImageUrl) console.log('   qrImageUrl:', result.qrImageUrl);
  console.log('   บันทึกที่: kbank-lab/data/last-qr.json');
  console.log('\nขั้นถัดไป: portal → Exercise 2 → Execute/ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  if (err.message.includes('token') || err.message.includes('401')) {
    console.error('   ลองรันใหม่: npm run 01:oauth แล้ว npm run 02:qr-thai');
  }
  process.exit(1);
});
