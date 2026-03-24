import express from 'express';
import {
  createKBankCharge,
  inquireKBankCharge,
  kbankWebhook,
  getPaymentConfig,
} from '../controllers/paymentController.js';

const router = express.Router();

// Public: frontend ตรวจสอบโหมดชำระ + config
router.get('/config', getPaymentConfig);

// Public: Kiosk สร้าง charge (ไม่ต้อง auth เพราะ kiosk ไม่มี token)
router.post('/kbank/charge', createKBankCharge);

// Public: Kiosk poll สถานะการชำระ
router.get('/kbank/inquiry/:orderId', inquireKBankCharge);

// Public: KBank webhook callback (ต้อง HTTPS จริง และ KBank ลงทะเบียน URL นี้)
router.post('/kbank/callback', kbankWebhook);

export default router;
