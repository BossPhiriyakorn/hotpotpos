import { config } from '../src/config.js';
import { loadOAuthToken } from '../src/state.js';

console.log('=== KBank Lab — config check ===\n');
console.log('Environment:', config.env);
console.log('Base URL:', config.baseUrl);

let ok = true;

try {
  config.consumerId();
  config.consumerSecret();
  console.log('Consumer ID:', mask(config.consumerId()));
  console.log('Consumer Secret:', mask(config.consumerSecret()));
} catch (e: unknown) {
  ok = false;
  console.log('Consumer credentials:', '❌', (e as Error).message);
}

console.log('OAuth headers:', {
  'x-test-mode': config.oauthTestMode,
  'env-id': config.oauthEnvId,
});

const apiKey = config.apiKey();
if (apiKey && !apiKey.startsWith('your_')) {
  console.log('API Key (QR):', mask(apiKey));
} else {
  console.log('API Key (QR):', '(ยังไม่ตั้ง — ใช้ตอน Exercise 2+)');
}

const token = loadOAuthToken();
if (token) {
  console.log('\nCached OAuth token:', mask(token.accessToken), `(at ${token.obtainedAt})`);
} else {
  console.log('\nCached OAuth token: (ยังไม่มี — รัน npm run 01:oauth)');
}

console.log(ok ? '\n✅ พร้อมรัน Exercise 1' : '\n⚠️  ใส่ KBANK_CONSUMER_ID / SECRET ใน kbank-lab/.env');
process.exit(ok ? 0 : 1);

function mask(s: string): string {
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}
