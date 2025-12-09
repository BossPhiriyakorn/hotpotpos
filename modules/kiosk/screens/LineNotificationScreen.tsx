import React, { useState, useEffect } from 'react';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SecondaryButton from '../../../components/ui/SecondaryButton';
import apiService from '../../../services/api';

interface LineNotificationScreenProps {
  order: Order;
  onBack: () => void;
  onFinish: () => void;
}

const LineNotificationScreen: React.FC<LineNotificationScreenProps> = ({ order, onBack, onFinish }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if order has ID
        if (!order.id) {
          console.error('Order ID is missing:', order);
          setError('ไม่พบข้อมูลออเดอร์ กรุณาลองใหม่อีกครั้ง');
          setLoading(false);
          return;
        }

        // Get QR Code from backend
        const response = await apiService.getOrderQRCode(order.id);
        
        // Response structure after API service: { qrCode: "...", orderId: ..., queueNumber: ... }
        const qrCodeData = response?.qrCode;
        
        if (qrCodeData) {
          setQrCode(qrCodeData);
        } else {
          console.error('QR Code not found in response:', response);
          setError('ไม่สามารถสร้าง QR Code ได้: ' + (response?.error || 'Response format incorrect'));
        }
      } catch (err: any) {
        console.error('Failed to fetch QR Code:', err);
        setError(err.message || 'ไม่สามารถโหลด QR Code ได้');
      } finally {
        setLoading(false);
      }
    };

    if (order.id) {
      fetchQRCode();
    } else {
      console.error('Order ID is missing in order object:', order);
      setError('ไม่พบข้อมูลออเดอร์');
      setLoading(false);
    }
  }, [order]);

  return (
    <div className="flex-1 w-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center text-center p-6 md:p-12 animate-[fade-in_0.5s_ease-in-out]">
        <h2 className="text-5xl font-extrabold text-slate-900 mb-3">รับแจ้งเตือนคิวผ่าน LINE</h2>
        <p className="text-xl text-slate-500 mb-10">
          สแกน QR Code นี้ด้วย LINE เพื่อรับการแจ้งเตือนเมื่อออเดอร์ของคุณพร้อม
        </p>

        {loading ? (
          <div className="w-[400px] h-[400px] max-w-full aspect-square flex items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 border-8 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 mt-4">กำลังสร้าง QR Code...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-[400px] h-[400px] max-w-full aspect-square flex items-center justify-center bg-red-50 rounded-xl border-2 border-red-200 mb-10">
            <div className="text-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : qrCode ? (
          <div className="mb-10 flex-shrink-0">
            <div className="w-[400px] h-[400px] max-w-full aspect-square flex items-center justify-center relative bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4">
              <img src={qrCode} alt="LINE QR Code" className="w-full h-full object-contain" />
            </div>
            {connected && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ เชื่อมต่อ LINE สำเร็จแล้ว!</p>
                <p className="text-green-600 text-sm mt-1">คุณจะได้รับแจ้งเตือนเมื่อออเดอร์พร้อม</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="w-full max-w-md space-y-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-blue-800 font-medium mb-2">วิธีใช้งาน:</p>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>เปิดแอป LINE บนโทรศัพท์</li>
              <li>กดปุ่ม "สแกน QR Code" ใน LINE</li>
              <li>สแกน QR Code ที่แสดงบนหน้าจอ</li>
              <li>กด "เพิ่มเพื่อน" หรือ "ยืนยัน"</li>
              <li>คุณจะได้รับแจ้งเตือนเมื่อออเดอร์พร้อม</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-md">
          <SecondaryButton onClick={onBack} className="flex-1 py-4 text-xl">
            ย้อนกลับ
          </SecondaryButton>
          <PrimaryButton onClick={onFinish} className="flex-1 py-4 text-xl">
            เสร็จสิ้น
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default LineNotificationScreen;

