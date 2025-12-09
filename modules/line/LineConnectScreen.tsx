import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';

const LineConnectScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อ...');

  useEffect(() => {
    const connect = async () => {
      try {
        const orderId = searchParams.get('order_id');
        const token = searchParams.get('token');

        if (!orderId) {
          setStatus('error');
          setMessage('ไม่พบข้อมูลออเดอร์');
          return;
        }

        // Get LINE User ID from query parameter
        // When scanning QR Code from LINE app, LINE will add line_user_id parameter
        // If not available, we'll try to get from LINE SDK or prompt user
        let lineUserId = searchParams.get('line_user_id');
        
        // If LINE User ID is not in URL, try to get from LINE SDK
        // For now, we'll show an error if not provided
        // In production, integrate with LINE Login or LINE SDK
        if (!lineUserId) {
          // Try to get from window.liff (LINE Front-end Framework)
          if (typeof window !== 'undefined' && (window as any).liff) {
            try {
              const profile = await (window as any).liff.getProfile();
              lineUserId = profile.userId;
            } catch (error) {
              console.error('Failed to get LINE profile:', error);
            }
          }
          
          // If still no LINE User ID, show error
          if (!lineUserId) {
            setStatus('error');
            setMessage('ไม่พบ LINE User ID กรุณาสแกน QR Code ผ่าน LINE App');
            return;
          }
        }

        // Connect LINE to order
        await apiService.connectLineToOrder(parseInt(orderId), lineUserId, token || undefined);

        setStatus('success');
        setMessage('เชื่อมต่อ LINE สำเร็จแล้ว! คุณจะได้รับแจ้งเตือนเมื่อออเดอร์พร้อม');
      } catch (error: any) {
        console.error('Connect LINE Error:', error);
        setStatus('error');
        setMessage(error.message || 'ไม่สามารถเชื่อมต่อ LINE ได้');
      }
    };

    connect();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#BF0A30] to-[#8B0720] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-8 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">กำลังเชื่อมต่อ...</h2>
            <p className="text-slate-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">เชื่อมต่อสำเร็จ!</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={() => window.close()}
              className="bg-[#BF0A30] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#a00828] transition-colors"
            >
              ปิดหน้าต่างนี้
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={() => window.close()}
              className="bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors"
            >
              ปิดหน้าต่างนี้
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LineConnectScreen;

