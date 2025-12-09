
import React from 'react';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface PaymentSuccessScreenProps {
  order: Order;
  onNext: () => void;
}

const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ order, onNext }) => {
  return (
    <div className="flex-1 w-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 md:p-12 animate-[fade-in_0.5s_ease-in-out]">
            {/* Large Green Check Icon */}
            <div className="bg-[#86efac] text-green-600 rounded-full w-32 h-32 flex items-center justify-center mb-6 shadow-sm flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h2 className="text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">ชำระเงินสำเร็จ!</h2>
            <p className="text-xl text-slate-500 mb-10 font-medium">กรุณารับใบเสร็จและรอรับอาหารที่เคาน์เตอร์</p>

            {/* Queue Number Box */}
            <div className="bg-slate-100 rounded-xl p-8 w-full max-w-xs mb-12 shadow-sm border border-slate-200">
                <p className="text-2xl text-slate-800 font-extrabold mb-4">หมายเลขคิว</p>
                <p className="text-9xl font-extrabold text-[#BF0A30] tracking-tighter leading-none">{order.queueNumber}</p>
            </div>
            
            {/* Next Button */}
            <div className="w-full max-w-xs">
                <PrimaryButton onClick={onNext} className="w-full py-4 text-xl shadow-lg">
                    ถัดไป
                </PrimaryButton>
            </div>
        </div>
    </div>
  );
};

export default PaymentSuccessScreen;
