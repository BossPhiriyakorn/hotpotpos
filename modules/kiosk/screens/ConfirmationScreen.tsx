import React, { useEffect } from 'react';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface ConfirmationScreenProps {
  order: Order;
  onFinish: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ order, onFinish }) => {
  useEffect(() => {
    // Set a timer to automatically navigate back to the welcome screen after 30 seconds.
    const timer = setTimeout(() => {
      onFinish();
    }, 30000); 

    // Clean up the timer if the component unmounts before the timer fires
    // (e.g., if the user clicks the "Finish" button manually).
    return () => clearTimeout(timer);
  }, [onFinish]);
  
  return (
    <div className="flex flex-col flex-grow items-center justify-center text-center">
      <div className="bg-green-100 text-green-700 rounded-full w-32 h-32 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-6xl font-extrabold text-slate-800 mb-3">ชำระเงินสำเร็จ!</h2>
      <p className="text-3xl text-slate-500 mb-10">กรุณารับใบเสร็จและรอรับอาหารที่เคาน์เตอร์</p>

      <div className="w-full max-w-md bg-slate-100 rounded-2xl p-8 mb-12">
        <p className="text-3xl text-slate-600 font-medium">หมายเลขคิวของคุณ</p>
        <p className="text-9xl font-extrabold text-[#BF0A30] leading-none tracking-tighter py-4">{order.queueNumber}</p>
      </div>
      
      <div className="mt-8">
        <PrimaryButton onClick={onFinish}>
            เสร็จสิ้นและกลับสู่หน้าแรก
        </PrimaryButton>
      </div>

    </div>
  );
};

export default ConfirmationScreen;