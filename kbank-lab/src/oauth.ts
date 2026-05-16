import axios from 'axios';
import { config } from './config.js';
import { saveOAuthToken, type LabTokenState } from './state.js';

/**
 * Exercise 1 — OAuth 2.0 (client credentials)
 * POST {baseUrl}/v2/oauth/token
 * Headers: x-test-mode, env-id (ตามคู่มือ sandbox)
 */
export async function fetchOAuthToken(): Promise<LabTokenState> {
  const consumerId = config.consumerId();
  const consumerSecret = config.consumerSecret();
  const basic = Buffer.from(`${consumerId}:${consumerSecret}`).toString('base64');

  const url = `${config.baseUrl}/v2/oauth/token`;

  const response = await axios.post(
    url,
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
        'x-test-mode': config.oauthTestMode,
        'env-id': config.oauthEnvId,
      },
      timeout: 30000,
      validateStatus: () => true,
    }
  );

  if (response.status < 200 || response.status >= 300) {
    const detail =
      typeof response.data === 'object'
        ? JSON.stringify(response.data, null, 2)
        : String(response.data);
    throw new Error(`OAuth failed HTTP ${response.status}\n${detail}`);
  }

  const data = response.data as Record<string, unknown>;
  const accessToken = String(data.access_token || data.accessToken || '');
  if (!accessToken) {
    throw new Error(`OAuth response ไม่มี access_token: ${JSON.stringify(data, null, 2)}`);
  }

  const state: LabTokenState = {
    accessToken,
    tokenType: String(data.token_type || data.tokenType || 'Bearer'),
    expiresIn: Number(data.expires_in || data.expiresIn || 0) || undefined,
    obtainedAt: new Date().toISOString(),
    raw: data,
  };

  saveOAuthToken(state);
  return state;
}
