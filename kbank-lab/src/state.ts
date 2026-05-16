import fs from 'fs';
import path from 'path';
import { config } from './config.js';

export interface LabTokenState {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  obtainedAt: string;
  raw?: unknown;
}

const tokenPath = () => path.join(config.dataDir, 'oauth-token.json');

export function saveOAuthToken(state: LabTokenState): void {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(tokenPath(), JSON.stringify(state, null, 2), 'utf8');
}

export function loadOAuthToken(): LabTokenState | null {
  const p = tokenPath();
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as LabTokenState;
}

export interface LabQrState {
  partnerTxnUid: string;
  partnerId: string;
  merchantId: string;
  qrTransactionId: string | null;
  status: string;
  qrCode: string | null;
  qrImageUrl: string | null;
  txnAmount: string;
  createdAt: string;
  raw: unknown;
}

const qrPath = (file = 'last-qr.json') => path.join(config.dataDir, file);

export function saveLastQr(state: LabQrState, file = 'last-qr.json'): void {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(qrPath(file), JSON.stringify(state, null, 2), 'utf8');
}

export function loadLastQr(file = 'last-qr.json'): LabQrState | null {
  const p = qrPath(file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as LabQrState;
}
