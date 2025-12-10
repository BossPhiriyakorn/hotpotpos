
import React from 'react';
import { useSettings } from '../../../store/SettingsContext';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SecondaryButton from '../../../components/ui/SecondaryButton';

interface MemberScanScreenProps {
  order: Order;
  onReceiveNotification: () => void;
  onSkipNotification: () => void;
}

const MemberScanScreen: React.FC<MemberScanScreenProps> = ({ order, onReceiveNotification, onSkipNotification }) => {
  const { shop } = useSettings();

  return (
    <div className="flex-1 w-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 animate-[fade-in_0.5s_ease-in-out]">
            <h2 className="text-5xl font-extrabold text-slate-900 mb-3">สะสมคะแนนสมาชิก</h2>
            <p className="text-xl text-slate-500 mb-10">กรุณานำโทรศัพท์ของคุณสแกน QR Code นี้เพื่อรับแต้มสะสม</p>
            
            {/* QR Code Display - No Border, Larger Size */}
            <div className="mb-10 flex-shrink-0">
                <div className="w-[400px] h-[400px] max-w-full aspect-square flex items-center justify-center relative">
                    {shop.memberQrCode ? (
                        <img src={shop.memberQrCode} alt="Member QR Code" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-4H6v4H2v-4h4V9h4v2h2a2 2 0 012 2v1z" />
                            </svg>
                            <span className="mt-4 font-bold text-3xl tracking-widest text-slate-400">LINE</span>
                            <p className="text-slate-400 mt-2">ยังไม่ได้อัปโหลด QR Code</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Buttons */}
            <div className="w-full max-w-lg mb-4 flex-shrink-0 space-y-4">
                <PrimaryButton 
                    onClick={onReceiveNotification}
                    className="w-full py-4 text-xl"
                >
                    รับการแจ้งเตือน
                </PrimaryButton>
                <SecondaryButton 
                    onClick={onSkipNotification}
                    className="w-full py-4 text-xl"
                >
                    ไม่รับการแจ้งเตือน
                </SecondaryButton>
            </div>
        </div>
    </div>
  );
};

export default MemberScanScreen;
