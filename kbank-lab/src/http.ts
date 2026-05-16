import axios, { type AxiosInstance } from 'axios';
import { config } from './config.js';
import { loadOAuthToken } from './state.js';

/** HTTP client หลังได้ OAuth token (ใช้ข้อ 2–15) */
export function createAuthedClient(): AxiosInstance {
  const token = loadOAuthToken();
  if (!token?.accessToken) {
    throw new Error('ยังไม่มี access token — รัน npm run 01:oauth ก่อน');
  }

  const type = token.tokenType || 'Bearer';
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${type} ${token.accessToken}`,
      'x-api-key': config.apiKey() || undefined,
    },
  });
}
