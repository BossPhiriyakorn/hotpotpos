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
        // ดึง order_id และ token จากหลายแหล่ง
        let orderId: string | null = null;
        let token: string | null = null;

        // 1. ดึงจาก hash fragment ก่อน (สำหรับ LIFF URL ที่ใช้ hash)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          orderId = hashParams.get('order_id');
          token = hashParams.get('token');
        }

        // 2. ลองดึงจาก LIFF query parameters (ถ้า LIFF SDK พร้อม)
        if (!orderId && typeof window !== 'undefined' && (window as any).liff) {
          try {
            const liffId = import.meta.env.VITE_LINE_LIFF_ID || '';
            
            if (liffId) {
              // Initialize LIFF
              await (window as any).liff.init({ liffId });
              
              // ดึง query parameters จาก LIFF
              orderId = (window as any).liff.getQueryParam('order_id') || orderId;
              token = (window as any).liff.getQueryParam('token') || token;
            }
          } catch (error) {
            console.error('LIFF init error:', error);
          }
        }

        // 3. Fallback: ดึงจาก URL search params (React Router)
        if (!orderId) {
          orderId = searchParams.get('order_id');
          token = searchParams.get('token');
        }

        // 4. Fallback: ดึงจาก window.location.search (ถ้ายังไม่มี)
        if (!orderId) {
          const urlParams = new URLSearchParams(window.location.search);
          orderId = urlParams.get('order_id');
          token = urlParams.get('token');
        }

        if (!orderId) {
          setStatus('error');
          setMessage('ไม่พบข้อมูลออเดอร์');
          console.error('Order ID not found. URL:', window.location.href);
          console.error('Search params:', window.location.search);
          console.error('Hash:', window.location.hash);
          return;
        }

        // Get LINE User ID from LIFF SDK
        let lineUserId: string | null = null;
        
        // Try to get from window.liff (LINE Front-end Framework)
        if (typeof window !== 'undefined' && (window as any).liff) {
          try {
            // Get LIFF ID from environment variable
            const liffId = import.meta.env.VITE_LINE_LIFF_ID || '';
            
            if (liffId) {
              // Initialize LIFF (ถ้ายังไม่ได้ init)
              try {
                await (window as any).liff.init({ liffId });
              } catch (initError) {
                // LIFF อาจจะ init แล้ว
                console.log('LIFF may already be initialized');
              }
              
              // Check if logged in
              if ((window as any).liff.isLoggedIn()) {
                // Get user profile
                const profile = await (window as any).liff.getProfile();
                lineUserId = profile.userId;
              } else {
                // Login if not logged in
                (window as any).liff.login();
                return;
              }
            } else {
              // Try to get profile without init (if already initialized)
              try {
                const profile = await (window as any).liff.getProfile();
                lineUserId = profile.userId;
              } catch (error) {
                console.error('LIFF not initialized:', error);
              }
            }
          } catch (error: any) {
            console.error('Failed to get LINE profile:', error);
            // If LIFF init fails, try to get from URL parameter as fallback
            lineUserId = searchParams.get('line_user_id');
          }
        } else {
          // Fallback: Try to get from URL parameter
          lineUserId = searchParams.get('line_user_id');
        }
        
        // If still no LINE User ID, show error
        if (!lineUserId) {
          setStatus('error');
          setMessage('ไม่พบ LINE User ID กรุณาสแกน QR Code ผ่าน LINE App');
          return;
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

