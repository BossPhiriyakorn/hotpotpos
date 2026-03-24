
import React, { useState, useRef } from 'react';
import { useSettings } from '../../../store/SettingsContext';
import { SOUPS, SPICE_LEVELS, ADD_ONS, COOKING_STYLES } from '../../../constants';
import { AppScreen } from '../../../types';
import apiService from '../../../services/api';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';

// Import actual components for High-Fidelity Preview
import Header from '../../../components/ui/Header';
import ProgressBar from '../../kiosk/components/ProgressBar';
import SoupSelection from '../../kiosk/components/SoupSelection';
import SpiceLevelSelection from '../../kiosk/components/SpiceLevelSelection';
import AddOnSelection from '../../kiosk/components/AddOnSelection';
import CookingStyleSelection from '../../kiosk/components/CookingStyleSelection';
import AdditionalNoteInput from '../../kiosk/components/AdditionalNoteInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SecondaryButton from '../../../components/ui/SecondaryButton';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
      active ? 'border-[#BF0A30] text-[#BF0A30]' : 'border-transparent text-slate-500 hover:text-slate-700'
    }`}
  >
    {children}
  </button>
);

const EyeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
);
const EyeClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const Settings = () => {
  const { shop, auth, layout, logs, updateShop, updateAuth, updateLayout, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'member' | 'payment' | 'auth' | 'layout'>('general');
  const [showToast, setShowToast] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const paymentQrInputRef = useRef<HTMLInputElement>(null);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showKioskPass, setShowKioskPass] = useState(false);

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress logo to max 512x512 for better performance
        const compressed = await compressImage(file, 512, 512, 0.85);
        updateShop({ logo: compressed });
      } catch (error) {
        console.error('Error compressing logo:', error);
        // Fallback to original if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        updateShop({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
      }
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress QR code to max 800x800 (QR codes need higher resolution)
        const compressed = await compressImage(file, 800, 800, 0.9);
        updateShop({ memberQrCode: compressed });
      } catch (error) {
        console.error('Error compressing QR code:', error);
        // Fallback to original if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        updateShop({ memberQrCode: reader.result as string });
      };
      reader.readAsDataURL(file);
      }
    }
  };

  const handlePaymentQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress payment QR code to max 800x800 (QR codes need higher resolution)
        const compressed = await compressImage(file, 800, 800, 0.9);
        updateShop({ paymentQrCode: compressed });
      } catch (error) {
        console.error('Error compressing payment QR code:', error);
        // Fallback to original if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        updateShop({ paymentQrCode: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save shop settings to database (save all values, including null)
      const settingsToSave = [
        { key: 'logo', value: shop.logo || null },
        { key: 'member_qr_code', value: shop.memberQrCode || null },
        { key: 'payment_qr_code', value: shop.paymentQrCode || null },
        { key: 'payment_mode', value: shop.paymentMode || 'static_qr' },
        { key: 'shop_name', value: shop.name || '' },
        { key: 'welcome_title', value: shop.welcomeTitle || '' },
        { key: 'welcome_subtitle', value: shop.welcomeSubtitle || '' },
        { key: 'tare_weight', value: shop.tareWeight || 250, data_type: 'number' },
        { key: 'min_weight', value: shop.minWeight || 300, data_type: 'number' },
        { key: 'soup_grid_cols', value: layout.soupGridCols },
        { key: 'show_spiciness', value: layout.showSpiciness },
        { key: 'show_addons', value: layout.showAddOns },
        { key: 'show_cooking_style', value: layout.showCookingStyle },
        { key: 'show_note', value: layout.showNote },
      ];

      // Save all settings in parallel
      await Promise.all(
        settingsToSave.map(({ key, value, data_type }) => 
          apiService.updateSetting(key, value, data_type)
        )
      );

      // Refresh settings from database after saving (silently fail if error)
      try {
        await refreshSettings();
      } catch (refreshError) {
        // Silently fail - settings are already saved, refresh is just for sync
        console.log('Settings saved but refresh failed (non-critical):', refreshError);
      }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      const errorMessage = error.message || 'ไม่สามารถบันทึกการตั้งค่าได้';
      
      // Check if it's an authentication error
      if (errorMessage.includes('Admin access required') || errorMessage.includes('authentication')) {
        alert(`เกิดข้อผิดพลาดในการบันทึก: กรุณาเข้าสู่ระบบใหม่\n\n${errorMessage}`);
        // Don't redirect automatically - let user decide
      } else {
        alert(`เกิดข้อผิดพลาดในการบันทึก: ${errorMessage}`);
      }
    }
  };

  // Mock handlers for the preview components
  const noop = () => {};

  // PREVIEW SCALE CONFIGURATION
  // 0.25 Scale results in approx 270px width x 480px height
  const PREVIEW_SCALE = 0.25;
  const PREVIEW_WIDTH = 1080 * PREVIEW_SCALE; // 270
  const PREVIEW_HEIGHT = 1920 * PREVIEW_SCALE; // 480

  return (
    <div className="p-4 md:p-8 space-y-6 animate-[fade-in_0.5s_ease-in-out] max-w-7xl mx-auto pb-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800">ตั้งค่าระบบ (Settings)</h2>
        <p className="text-slate-500">จัดการข้อมูลร้าน, รหัสผ่าน, สะสมแต้ม และการแสดงผลหน้า Kiosk</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border-b border-slate-200 flex overflow-x-auto">
        <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>ข้อมูลทั่วไป</TabButton>
        <TabButton active={activeTab === 'member'} onClick={() => setActiveTab('member')}>สะสมแต้ม</TabButton>
        <TabButton active={activeTab === 'payment'} onClick={() => setActiveTab('payment')}>ชำระเงิน</TabButton>
        <TabButton active={activeTab === 'auth'} onClick={() => setActiveTab('auth')}>รหัสเข้าใช้งาน & Logs</TabButton>
        <TabButton active={activeTab === 'layout'} onClick={() => setActiveTab('layout')}>ปรับแต่ง Kiosk</TabButton>
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[500px]">
        
        {/* === GENERAL TAB === */}
        {activeTab === 'general' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <label className="block text-slate-700 font-bold mb-2">ชื่อร้าน (Shop Name)</label>
              <input
                type="text"
                value={shop.name}
                onChange={(e) => updateShop({ name: e.target.value })}
                className="w-full bg-white text-slate-900 border-2 border-slate-200 rounded-lg p-3 focus:border-[#BF0A30] focus:ring-[#BF0A30] outline-none text-lg"
                placeholder="ระบุชื่อร้าน"
              />
              <p className="text-slate-400 text-sm mt-2">ชื่อร้านจะแสดงที่ส่วนหัวของหน้า Kiosk และในใบเสร็จ</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-4">โลโก้ร้าน (Shop Logo)</label>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative group">
                  {shop.logo ? (
                    <img src={resolveMediaUrl(shop.logo)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs">No Logo</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                    <button 
                      onClick={() => updateShop({ logo: null })}
                      className="text-white text-xs bg-red-600 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    อัปโหลดรูปภาพ
                  </button>
                  <p className="text-slate-400 text-sm mt-2">แนะนำขนาด 512x512px (PNG, JPG)</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-slate-700 font-bold mb-2">ข้อความต้อนรับ (Title)</label>
                    <input
                        type="text"
                        value={shop.welcomeTitle || 'ยินดีต้อนรับ'}
                        onChange={(e) => updateShop({ welcomeTitle: e.target.value })}
                        className="w-full bg-white text-slate-900 border-2 border-slate-200 rounded-lg p-3 focus:border-[#BF0A30] focus:ring-[#BF0A30] outline-none"
                    />
                </div>
                <div>
                    <label className="block text-slate-700 font-bold mb-2">ข้อความรอง (Subtitle)</label>
                    <input
                        type="text"
                        value={shop.welcomeSubtitle || 'กดเพื่อเริ่มต้นสั่งอาหาร'}
                        onChange={(e) => updateShop({ welcomeSubtitle: e.target.value })}
                        className="w-full bg-white text-slate-900 border-2 border-slate-200 rounded-lg p-3 focus:border-[#BF0A30] focus:ring-[#BF0A30] outline-none"
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-4">ตั้งค่าการชั่งน้ำหนัก</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 font-bold mb-2">น้ำหนักภาชนะ (Tare Weight)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={shop.tareWeight || 250}
                      onChange={(e) => updateShop({ tareWeight: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-white text-slate-900 border-2 border-slate-200 rounded-lg p-3 focus:border-[#BF0A30] focus:ring-[#BF0A30] outline-none"
                    />
                    <span className="text-slate-600 font-medium whitespace-nowrap">กรัม</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">น้ำหนักภาชนะที่จะหักลบออกจากน้ำหนักที่ชั่งได้</p>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-2">น้ำหนักขั้นต่ำ (Minimum Weight)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={shop.minWeight || 300}
                      onChange={(e) => updateShop({ minWeight: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-white text-slate-900 border-2 border-slate-200 rounded-lg p-3 focus:border-[#BF0A30] focus:ring-[#BF0A30] outline-none"
                    />
                    <span className="text-slate-600 font-medium whitespace-nowrap">กรัม</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">น้ำหนักขั้นต่ำที่อนุญาตให้สั่งซื้อได้ (น้ำหนักสุทธิหลังหักภาชนะ)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === MEMBER POINTS TAB === */}
        {activeTab === 'member' && (
           <div className="max-w-2xl space-y-8">
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-800 text-lg mb-4">ตั้งค่า QR Code สะสมแต้ม</h3>
                   <p className="text-slate-500 mb-6">
                       อัปโหลดรูปภาพ QR Code (เช่น จาก LINE Official Account) เพื่อให้ลูกค้าสแกนสะสมคะแนนหลังจากชำระเงิน
                   </p>

                   <div className="flex flex-col md:flex-row items-center gap-8">
                       <div className="flex-shrink-0">
                           <div className="w-64 h-64 border-2 border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden relative group shadow-sm">
                               {shop.memberQrCode ? (
                                   <img src={resolveMediaUrl(shop.memberQrCode)} alt="Member QR" className="w-full h-full object-contain" />
                               ) : (
                                   <div className="text-center p-4">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-4H6v4H2v-4h4V9h4v2h2a2 2 0 012 2v1z" />
                                       </svg>
                                       <span className="text-slate-400 text-sm">No QR Code</span>
                                   </div>
                               )}
                               
                               {shop.memberQrCode && (
                                   <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                       <button 
                                           onClick={() => updateShop({ memberQrCode: null })}
                                           className="text-white text-sm bg-red-600 px-3 py-1.5 rounded font-bold hover:bg-red-700 transition-colors"
                                       >
                                           ลบรูปภาพ
                                       </button>
                                   </div>
                               )}
                           </div>
                       </div>

                       <div className="flex-grow">
                           <button
                               onClick={() => qrInputRef.current?.click()}
                               className="bg-white border border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-50 hover:border-[#BF0A30] hover:text-[#BF0A30] transition-all w-full md:w-auto"
                           >
                               อัปโหลดรูปภาพ QR Code
                           </button>
                           <p className="text-slate-400 text-sm mt-3">
                               รองรับไฟล์ภาพ JPG, PNG <br/>
                               ขนาดที่แนะนำ: สี่เหลี่ยมจัตุรัส (Square)
                           </p>
                           <input
                               type="file"
                               ref={qrInputRef}
                               onChange={handleQrUpload}
                               accept="image/*"
                               className="hidden"
                           />
                       </div>
                   </div>
               </div>
               
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 text-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                   </svg>
                   <p>
                       เมื่ออัปโหลดแล้ว QR Code นี้จะไปแสดงที่หน้า "สะสมคะแนนสมาชิก" (Member Scan) บนเครื่อง Kiosk ทันที
                   </p>
               </div>
           </div>
        )}

        {/* === PAYMENT TAB === */}
        {activeTab === 'payment' && (
          <div className="max-w-2xl space-y-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-1">โหมดการชำระเงิน</h3>
              <p className="text-sm text-slate-500 mb-6">เลือกวิธีที่ลูกค้าจะชำระเงินที่ Kiosk</p>

              <div className="space-y-3">
                {/* Static QR */}
                <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${shop.paymentMode === 'static_qr' ? 'border-[#BF0A30] bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="static_qr"
                    checked={shop.paymentMode === 'static_qr'}
                    onChange={() => updateShop({ paymentMode: 'static_qr' })}
                    className="mt-1 accent-[#BF0A30]"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">QR นิ่ง (PromptPay / พร้อมเพย์)</p>
                    <p className="text-sm text-slate-500 mt-0.5">แสดงรูป QR ที่อัปโหลดไว้ ลูกค้าสแกนแล้วกดยืนยันเอง ไม่ต้องเชื่อม API ธนาคาร</p>
                  </div>
                </label>

                {/* KBank Gateway */}
                <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${shop.paymentMode === 'kbank_gateway' ? 'border-[#BF0A30] bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="kbank_gateway"
                    checked={shop.paymentMode === 'kbank_gateway'}
                    onChange={() => updateShop({ paymentMode: 'kbank_gateway' })}
                    className="mt-1 accent-[#BF0A30]"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">K Payment Gateway (กสิกรไทย)</p>
                    <p className="text-sm text-slate-500 mt-0.5">ระบบสร้าง QR อัตโนมัติต่อรายการ ตรวจสอบการชำระผ่าน API ต้องตั้งค่า KBANK_* ใน backend/.env</p>
                  </div>
                </label>
              </div>
            </div>

            {/* KBank config hint */}
            {shop.paymentMode === 'kbank_gateway' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
                <p className="font-semibold text-amber-800">ตรวจสอบการตั้งค่า KBank</p>
                <p className="text-sm text-amber-700">ต้องกรอกค่าเหล่านี้ใน <code className="bg-amber-100 px-1 rounded">backend/.env</code> ก่อนใช้งาน:</p>
                <ul className="text-sm text-amber-700 space-y-1 ml-4 list-disc">
                  <li><code>KBANK_ENV</code> = sandbox หรือ production</li>
                  <li><code>KBANK_SANDBOX_API_KEY</code> / <code>KBANK_PRODUCTION_API_KEY</code></li>
                  <li><code>KBANK_SANDBOX_MERCHANT_ID</code> / <code>KBANK_PRODUCTION_MERCHANT_ID</code></li>
                  <li><code>KBANK_CALLBACK_URL</code> = URL ของเซิร์ฟเวอร์คุณที่ HTTPS</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2">สมัครและรับ credentials ที่ <a href="https://apiportal.kasikornbank.com" target="_blank" rel="noopener noreferrer" className="underline">apiportal.kasikornbank.com</a></p>
              </div>
            )}

            {/* QR Code ชำระเงิน — เฉพาะโหมด static_qr (จัดการที่แท็บนี้ที่เดียว) */}
            {shop.paymentMode === 'static_qr' && (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-4">ตั้งค่า QR Code ชำระเงิน</h3>
                <p className="text-slate-500 mb-6">
                  อัปโหลดรูปภาพ QR Code สำหรับชำระเงิน (เช่น PromptPay, Mobile Banking) เพื่อให้ลูกค้าสแกนชำระเงิน
                </p>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-64 h-64 border-2 border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden relative group shadow-sm">
                      {shop.paymentQrCode ? (
                        <img src={resolveMediaUrl(shop.paymentQrCode)} alt="Payment QR" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-4H6v4H2v-4h4V9h4v2h2a2 2 0 012 2v1z" />
                          </svg>
                          <span className="text-slate-400 text-sm">No QR Code</span>
                        </div>
                      )}

                      {shop.paymentQrCode && (
                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => updateShop({ paymentQrCode: null })}
                            className="text-white text-sm bg-red-600 px-3 py-1.5 rounded font-bold hover:bg-red-700 transition-colors"
                          >
                            ลบรูปภาพ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-grow">
                    <button
                      type="button"
                      onClick={() => paymentQrInputRef.current?.click()}
                      className="bg-white border border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-50 hover:border-[#BF0A30] hover:text-[#BF0A30] transition-all w-full md:w-auto"
                    >
                      อัปโหลดรูปภาพ QR Code
                    </button>
                    <p className="text-slate-400 text-sm mt-3">
                      รองรับไฟล์ภาพ JPG, PNG <br />
                      ขนาดที่แนะนำ: สี่เหลี่ยมจัตุรัส (Square)
                    </p>
                    <p className="text-slate-500 text-sm mt-4">
                      กด <span className="font-semibold text-slate-700">บันทึกการตั้งค่า</span> ด้านล่างเพื่อเก็บลงระบบ
                    </p>
                    <input
                      type="file"
                      ref={paymentQrInputRef}
                      onChange={handlePaymentQrUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === AUTH TAB === */}
        {activeTab === 'auth' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Credentials */}
            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-[#BF0A30] rounded-full"></span>
                  สำหรับ Admin (CMS)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                    <input
                      type="text"
                      value={auth.adminUser}
                      onChange={(e) => updateAuth({ adminUser: e.target.value })}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#BF0A30]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        value={auth.adminPass}
                        onChange={(e) => updateAuth({ adminPass: e.target.value })}
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#BF0A30]"
                        autoComplete="off"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-form-type="other"
                        name="admin-password-setting"
                      />
                      <button 
                        onClick={() => setShowAdminPass(!showAdminPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-slate-500 rounded-full"></span>
                  สำหรับ Kiosk User
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                    <input
                      type="text"
                      value={auth.kioskUser}
                      onChange={(e) => updateAuth({ kioskUser: e.target.value })}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#BF0A30]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showKioskPass ? 'text' : 'password'}
                        value={auth.kioskPass}
                        onChange={(e) => updateAuth({ kioskPass: e.target.value })}
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#BF0A30]"
                        autoComplete="off"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-form-type="other"
                        name="kiosk-password-setting"
                      />
                      <button 
                        onClick={() => setShowKioskPass(!showKioskPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showKioskPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Access Logs */}
            <div className="flex flex-col h-full max-h-[600px] space-y-6">
              <div className="flex flex-col h-full max-h-[400px]">
                <h3 className="font-bold text-slate-800 text-lg mb-4">ประวัติการเข้าใช้งาน (Access Logs)</h3>
              <div className="flex-grow border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                <div className="overflow-y-auto flex-grow p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-200 text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-3 font-semibold">เวลา</th>
                        <th className="p-3 font-semibold">ผู้ใช้งาน</th>
                        <th className="p-3 font-semibold text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="bg-white">
                          <td className="p-3 text-slate-500">{log.timestamp}</td>
                          <td className="p-3 font-medium text-slate-700">{log.userType}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {log.status === 'success' ? 'Success' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400 italic">ไม่มีข้อมูลการเข้าใช้งาน</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* === LAYOUT TAB === */}
        {activeTab === 'layout' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Controls */}
            <div className="w-full lg:w-1/3 space-y-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4">การแสดงผล Grid (Soup)</h3>
                <div className="space-y-3">
                  {[2, 3, 4].map((cols) => (
                    <label key={cols} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      layout.soupGridCols === cols ? 'border-[#BF0A30] bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="gridCols"
                        checked={layout.soupGridCols === cols}
                        onChange={() => updateLayout({ soupGridCols: cols as 2 | 3 | 4 })}
                        className="w-4 h-4 text-[#BF0A30] focus:ring-[#BF0A30]"
                      />
                      <span className="ml-3 font-medium text-slate-700">{cols} คอลัมน์ต่อแถว</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4">เปิด/ปิด การแสดงผลส่วนต่างๆ</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">ส่วนเลือกระดับความเผ็ด</span>
                    <button 
                      onClick={() => updateLayout({ showSpiciness: !layout.showSpiciness })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${layout.showSpiciness ? 'bg-[#BF0A30]' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${layout.showSpiciness ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">ส่วนเลือกของเพิ่มเติม (Add-ons)</span>
                    <button 
                      onClick={() => updateLayout({ showAddOns: !layout.showAddOns })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${layout.showAddOns ? 'bg-[#BF0A30]' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${layout.showAddOns ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">ส่วนเลือกรูปแบบการปรุง</span>
                    <button 
                      onClick={() => updateLayout({ showCookingStyle: !layout.showCookingStyle })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${layout.showCookingStyle ? 'bg-[#BF0A30]' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${layout.showCookingStyle ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                   <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">ส่วนระบุหมายเหตุ</span>
                    <button 
                      onClick={() => updateLayout({ showNote: !layout.showNote })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${layout.showNote ? 'bg-[#BF0A30]' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${layout.showNote ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: High-Fidelity Preview (Vertical 9:16) */}
            <div className="w-full lg:w-2/3 h-full flex flex-col items-center bg-slate-100 rounded-xl border border-slate-200 p-8 relative overflow-hidden">
               <div className="w-full flex justify-start mb-6">
                    <h3 className="font-bold text-slate-500 uppercase tracking-wide text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Kiosk Preview (1080x1920 PC Touch)
                    </h3>
               </div>

               {/* Kiosk Monitor Frame */}
               <div className="relative flex flex-col items-center">
                   {/* Screen Bezel & Container */}
                   <div className="bg-slate-800 rounded-[2.5rem] p-4 shadow-2xl ring-4 ring-slate-900 border-4 border-slate-700">
                        {/* Viewport Mask */}
                        <div 
                            className="bg-white overflow-hidden relative rounded-[4px]"
                            style={{
                                width: `${PREVIEW_WIDTH}px`, 
                                height: `${PREVIEW_HEIGHT}px`,
                            }}
                        >
                            {/* Scaled Content */}
                            <div 
                                    className="bg-white origin-top-left flex flex-col w-[1080px] h-[1920px]"
                                    style={{
                                        transform: `scale(${PREVIEW_SCALE})`,
                                    }}
                            >
                                {/* 1. Header (No status bar) */}
                                <Header />
                                
                                {/* 2. Content */}
                                <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                                    {/* Real Progress Bar */}
                                    <ProgressBar currentStep={AppScreen.Customize} />

                                    <div className="flex-1 overflow-y-auto no-scrollbar p-12 space-y-16 pb-40">
                                        {/* Always Show Soups */}
                                        <SoupSelection 
                                            soups={SOUPS} 
                                            onSelect={noop} 
                                            selectedSoup={null} 
                                        />

                                        {layout.showSpiciness && (
                                            <div className="animate-[fade-in_0.5s_ease-in-out]">
                                                <SpiceLevelSelection 
                                                    levels={SPICE_LEVELS} 
                                                    onSelect={noop} 
                                                    selectedLevel={null} 
                                                />
                                            </div>
                                        )}

                                        {layout.showAddOns && (
                                            <div className="animate-[fade-in_0.5s_ease-in-out]">
                                                <AddOnSelection 
                                                    addOns={ADD_ONS} 
                                                    onAdd={noop} 
                                                    onRemove={noop} 
                                                    selectedAddOns={[]} 
                                                />
                                            </div>
                                        )}

                                        {layout.showCookingStyle && (
                                            <div className="animate-[fade-in_0.5s_ease-in-out]">
                                                <CookingStyleSelection 
                                                    options={COOKING_STYLES}
                                                    selectedStyle={COOKING_STYLES[0]}
                                                    onSelect={noop}
                                                />
                                            </div>
                                        )}

                                        {layout.showNote && (
                                            <div className="animate-[fade-in_0.5s_ease-in-out]">
                                                <AdditionalNoteInput 
                                                    note=""
                                                    onChange={noop}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Footer */}
                                <div className="flex-shrink-0 p-8 border-t-2 border-slate-200 flex justify-between items-center bg-white">
                                    <SecondaryButton className="text-3xl py-6 px-12" disabled>ย้อนกลับ</SecondaryButton>
                                    <div className="text-right">
                                        <p className="text-2xl font-medium text-slate-600">ราคารวม</p>
                                        <p className="text-5xl font-bold text-[#BF0A30]">0.00 บาท</p>
                                    </div>
                                    <PrimaryButton className="text-3xl py-6 px-12" disabled>สรุปรายการ</PrimaryButton>
                                </div>
                            </div>
                        </div>
                   </div>
                   
                   {/* Monitor Stand */}
                   <div className="w-24 h-20 bg-gradient-to-b from-slate-700 to-slate-800 mt-0 shadow-inner rounded-b-lg border-x-4 border-slate-900"></div>
                   <div className="w-64 h-6 bg-slate-800 rounded-full shadow-2xl -mt-2 border-t border-slate-600"></div>
               </div>
            </div>
          </div>
        )}
        
        {/* Footer: Save Button */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button 
                onClick={handleSaveSettings}
                className="bg-[#BF0A30] text-white font-bold text-xl py-3 px-8 rounded-xl shadow-lg hover:bg-[#a00828] transition-transform transform active:scale-95 flex items-center gap-2"
            >
                <CheckIcon />
                บันทึกการแก้ไข
            </button>
        </div>

      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-[slide-up_0.3s_ease-out] z-50">
            <div className="bg-green-500 rounded-full p-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <h4 className="font-bold">บันทึกสำเร็จ</h4>
                <p className="text-sm text-slate-300">การตั้งค่าของคุณถูกบันทึกเรียบร้อยแล้ว</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
