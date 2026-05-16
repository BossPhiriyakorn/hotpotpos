/**
 * Exercise 1: OAuth 2.0
 * หลังรันสำเร็จ ไปกดตรวจใน KBank Developer Portal
 */
import { config } from '../src/config.js';
import { fetchOAuthToken } from '../src/oauth.js';

async function main() {
  console.log('Exercise 1 — OAuth 2.0');
  console.log('URL:', `${config.baseUrl}/v2/oauth/token`);
  console.log('Headers:', {
    'x-test-mode': config.oauthTestMode,
    'env-id': config.oauthEnvId,
  });
  console.log('');

  const state = await fetchOAuthToken();

  console.log('✅ ได้ access token แล้ว');
  console.log('   token_type:', state.tokenType);
  if (state.expiresIn) console.log('   expires_in:', state.expiresIn, 'วินาที');
  console.log('   บันทึกที่: kbank-lab/data/oauth-token.json');
  console.log('\nขั้นถัดไป: เปิด portal → Exercise 1 → ตรวจผล (หรือ Execute บนหน้าเว็บ)');
}

main().catch((err: Error) => {
  console.error('\n❌', err.message);
  console.error('\nตรวจสอบ:');
  console.error('  1. สร้าง kbank-lab/.env จาก .env.example');
  console.error('  2. ใส่ KBANK_CONSUMER_ID และ KBANK_CONSUMER_SECRET จากเมนู Get Credential');
  process.exit(1);
});
