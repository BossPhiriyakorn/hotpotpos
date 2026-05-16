import axios from 'axios';
import crypto from 'crypto';
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot';
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
// Send push message to LINE user
export const sendPushMessage = async (userId, message) => {
    try {
        if (!CHANNEL_ACCESS_TOKEN) {
            throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
        }
        const response = await axios.post(`${LINE_MESSAGING_API}/message/push`, {
            to: userId,
            messages: [
                {
                    type: 'text',
                    text: message,
                },
            ],
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
        });
        return { success: true, data: response.data };
    }
    catch (error) {
        console.error('LINE Push Message Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to send LINE message');
    }
};
// Send notification when order status changes
export const sendOrderNotification = async (userId, queueNumber, status) => {
    const statusMessages = {
        queued: 'ออเดอร์ของคุณถูกเพิ่มเข้าคิวแล้ว',
        in_progress: 'ออเดอร์ของคุณกำลังเตรียมอยู่',
        ready: `ออเดอร์คิว #${queueNumber} ของคุณพร้อมแล้ว! กรุณามารับที่เคาน์เตอร์`,
        done: `ออเดอร์คิว #${queueNumber} ของคุณเสร็จสมบูรณ์แล้ว`,
    };
    const message = statusMessages[status] || `ออเดอร์คิว #${queueNumber} ของคุณ: ${status}`;
    return await sendPushMessage(userId, message);
};
// Verify LINE webhook signature
export const verifyLineSignature = (body, signature) => {
    if (!CHANNEL_SECRET) {
        return false;
    }
    const hash = crypto
        .createHmac('sha256', CHANNEL_SECRET)
        .update(body)
        .digest('base64');
    return hash === signature;
};
// Get LINE user profile
export const getLineUserProfile = async (userId) => {
    try {
        if (!CHANNEL_ACCESS_TOKEN) {
            throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
        }
        const response = await axios.get(`${LINE_MESSAGING_API}/profile/${userId}`, {
            headers: {
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
        });
        return { success: true, data: response.data };
    }
    catch (error) {
        console.error('Get LINE Profile Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to get LINE user profile');
    }
};
//# sourceMappingURL=lineService.js.map