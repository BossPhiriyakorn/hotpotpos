import { Request, Response } from 'express';
import pool from '../config/database.js';
import {
  createCharge,
  inquireCharge,
  verifyWebhookSignature,
  getKBankConfig,
} from '../services/kbankService.js';

// ---- Create KBank Charge ---------------------------------------------------

export const createKBankCharge = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    // ดึงข้อมูลออเดอร์
    const orderResult = await client.query(
      'SELECT id, total_price, order_status, payment_status, kbank_charge_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // ถ้าชำระแล้ว ไม่ต้องสร้างใหม่
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, error: 'Order already paid' });
    }

    // ถ้ามี charge เดิมที่ยัง pending อยู่ ส่งกลับเลย
    if (order.kbank_charge_id) {
      const existingCharge = await client.query(
        `SELECT * FROM kbank_charges WHERE charge_id = $1 AND status = 'pending' AND expires_at > NOW()`,
        [order.kbank_charge_id]
      );
      if (existingCharge.rows.length > 0) {
        const charge = existingCharge.rows[0];
        return res.json({
          success: true,
          data: {
            chargeId: charge.charge_id,
            partnerTxId: charge.partner_tx_id,
            qrCodeData: charge.qr_code_data,
            qrImageUrl: charge.qr_image_url,
            expiresAt: charge.expires_at,
            status: charge.status,
          },
        });
      }
    }

    // สร้าง Charge ใหม่ผ่าน KBank API
    const chargeResult = await createCharge({
      orderId: order.id,
      amount: parseFloat(order.total_price),
      description: `ชำระเงิน Order #${order.id}`,
    });

    // บันทึก charge ลงฐานข้อมูล
    await client.query(
      `INSERT INTO kbank_charges (
        order_id, charge_id, partner_tx_id, amount, currency,
        status, qr_code_data, qr_image_url, expires_at, raw_response
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (charge_id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP`,
      [
        order.id,
        chargeResult.chargeId,
        chargeResult.partnerTxId,
        parseFloat(order.total_price),
        'THB',
        chargeResult.status,
        chargeResult.qrCodeData,
        chargeResult.qrImageUrl,
        chargeResult.expiresAt,
        JSON.stringify(chargeResult.rawResponse),
      ]
    );

    // อัปเดต kbank_charge_id ในออเดอร์
    await client.query(
      `UPDATE orders SET kbank_charge_id = $1, payment_method = 'KBANK_QR', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [chargeResult.chargeId, order.id]
    );

    res.json({
      success: true,
      data: {
        chargeId: chargeResult.chargeId,
        partnerTxId: chargeResult.partnerTxId,
        qrCodeData: chargeResult.qrCodeData,
        qrImageUrl: chargeResult.qrImageUrl,
        expiresAt: chargeResult.expiresAt,
        status: chargeResult.status,
      },
    });
  } catch (error: any) {
    console.error('[Payment] createKBankCharge error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// ---- Inquiry Charge Status ------------------------------------------------

export const inquireKBankCharge = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;

    const chargeRow = await client.query(
      `SELECT kc.* FROM kbank_charges kc
       JOIN orders o ON o.id = kc.order_id
       WHERE kc.order_id = $1
       ORDER BY kc.created_at DESC LIMIT 1`,
      [orderId]
    );

    if (chargeRow.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No charge found for this order' });
    }

    const charge = chargeRow.rows[0];

    // ถ้าชำระแล้ว ส่งสถานะกลับเลย ไม่ต้อง re-inquiry
    if (charge.status === 'paid') {
      return res.json({ success: true, data: { status: 'paid', paidAt: charge.paid_at } });
    }

    // inquiry จาก KBank
    const inquiryResult = await inquireCharge(charge.charge_id, charge.partner_tx_id);

    // อัปเดตฐานข้อมูลถ้าสถานะเปลี่ยน
    if (inquiryResult.status === 'paid') {
      await client.query('BEGIN');

      await client.query(
        `UPDATE kbank_charges SET status = 'paid', kbank_payment_id = $1,
         paid_at = $2, raw_webhook = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [inquiryResult.kbankPaymentId, inquiryResult.paidAt, JSON.stringify(inquiryResult.rawResponse), charge.id]
      );

      await client.query(
        `UPDATE orders SET payment_status = 'paid', kbank_payment_id = $1,
         paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [inquiryResult.kbankPaymentId, orderId]
      );

      await client.query('COMMIT');
    }

    res.json({
      success: true,
      data: {
        status: inquiryResult.status,
        paidAt: inquiryResult.paidAt,
        kbankPaymentId: inquiryResult.kbankPaymentId,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Payment] inquireKBankCharge error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// ---- Webhook (KBank → เซิร์ฟเวอร์คุณ) ------------------------------------

export const kbankWebhook = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = (req.headers['x-kbank-signature'] || req.headers['x-signature'] || '') as string;

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[KBank Webhook] Invalid signature');
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }

    const payload = req.body;
    console.log('[KBank Webhook] Received:', JSON.stringify(payload));

    // KBank ส่ง field ชื่อต่างกันตามเวอร์ชัน API
    const chargeId = payload.qrTransactionId || payload.chargeId || payload.txnRefId;
    const txnStatus = payload.txnStatus || payload.status || '';
    const isPaid = ['Success', 'success', 'PAID', 'paid', '00', 'approved'].includes(String(txnStatus).toLowerCase());
    const kbankPaymentId = payload.paymentId || payload.transactionId || null;

    if (!chargeId) {
      return res.status(400).json({ success: false, error: 'Missing chargeId in webhook payload' });
    }

    const chargeRow = await client.query(
      'SELECT * FROM kbank_charges WHERE charge_id = $1',
      [chargeId]
    );

    if (chargeRow.rows.length === 0) {
      console.warn(`[KBank Webhook] Charge not found: ${chargeId}`);
      return res.status(200).json({ success: true, message: 'charge not tracked' });
    }

    const charge = chargeRow.rows[0];

    if (isPaid && charge.status !== 'paid') {
      await client.query('BEGIN');

      await client.query(
        `UPDATE kbank_charges SET status = 'paid', kbank_payment_id = $1,
         paid_at = CURRENT_TIMESTAMP, raw_webhook = $2, updated_at = CURRENT_TIMESTAMP
         WHERE charge_id = $3`,
        [kbankPaymentId, JSON.stringify(payload), chargeId]
      );

      await client.query(
        `UPDATE orders SET payment_status = 'paid', kbank_payment_id = $1,
         payment_reference = $2, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [kbankPaymentId, chargeId, charge.order_id]
      );

      await client.query('COMMIT');
      console.log(`[KBank Webhook] ✅ Order ${charge.order_id} marked as PAID`);
    } else {
      // บันทึก webhook ดิบแม้ยังไม่ paid
      await client.query(
        `UPDATE kbank_charges SET raw_webhook = $1, status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE charge_id = $3`,
        [JSON.stringify(payload), txnStatus || charge.status, chargeId]
      );
    }

    // ตอบ 200 เสมอเพื่อไม่ให้ KBank ส่งซ้ำ
    res.status(200).json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[KBank Webhook] Error:', error.message);
    res.status(200).json({ success: true }); // ยังตอบ 200 ป้องกัน retry storm
  } finally {
    client.release();
  }
};

// ---- Config Endpoint (สำหรับ frontend ตรวจสอบโหมด) -----------------------

export const getPaymentConfig = async (_req: Request, res: Response) => {
  try {
    // ดึง payment_mode จาก settings
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'payment_mode'`
    );
    const paymentMode = result.rows[0]?.value || 'static_qr';
    const kbankConf = getKBankConfig();

    res.json({
      success: true,
      data: {
        paymentMode,
        kbank: {
          env: kbankConf.env,
          isSandbox: kbankConf.isSandbox,
          configured: kbankConf.hasCredentials,
          currency: kbankConf.currency,
          timeoutMinutes: kbankConf.timeoutMinutes,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
