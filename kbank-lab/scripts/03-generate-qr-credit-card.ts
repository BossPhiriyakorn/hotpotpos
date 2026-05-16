/**
 * Exercise 3: Generate QR Credit Card
 */
import { buildExercise3Body, generateQrCreditCard } from '../src/qr-payment.js';
import { config } from '../src/config.js';
import { loadOAuthToken } from '../src/state.js';

async function main() {
  if (!loadOAuthToken()) {
    throw new Error('ไม่มี OAuth token — รัน: npm run 01:oauth');
  }

  const body = buildExercise3Body();

  console.log('Exercise 3 — Generate QR Credit Card');
  console.log('POST', `${config.baseUrl}/v1/qrpayment/request`);
  console.log('Headers:', { 'x-test-mode': config.qrTestMode, 'env-id': config.qrCcEnvId });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('');

  const result = await generateQrCreditCard(body);

  console.log('✅ สร้าง QR Credit Card สำเร็จ');
  console.log('   qrType:', body.qrType);
  console.log('   status:', result.status);
  if (result.qrCode) console.log('   qrCode:', result.qrCode.slice(0, 80) + '…');
  console.log('   บันทึกที่: kbank-lab/data/last-qr-cc.json');
  console.log('\nขั้นถัดไป: portal → Exercise 3 → Execute/ตรวจผล');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  if (err.message.includes('token') || err.message.includes('401')) {
    console.error('   ลอง: npm run 01:oauth && npm run 03:qr-cc');
  }
  process.exit(1);
});
