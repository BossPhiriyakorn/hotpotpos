
import React, { useState, useEffect, useRef } from 'react';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { useLanguage } from '../../../store/LanguageContext';

interface WeighingScreenProps {
  order: Order;
  setOrder: (updates: Partial<Order>) => void;
  onNext: () => void;
  weightKg: number;
  isConnected: boolean;
  connect: () => Promise<void>;
}

const WeighingScreen: React.FC<WeighingScreenProps> = ({ 
  order, 
  setOrder, 
  onNext,
  weightKg,
  isConnected,
  connect
}) => {
  const { t } = useLanguage();
  const [secretClicks, setSecretClicks] = useState(0);
  const [priceClicks, setPriceClicks] = useState(0);
  const priceClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert Kg from scale to Grams for display and calculation
  const weightGrams = Math.floor(weightKg * 1000);

  useEffect(() => {
    // Formula: Weight (Grams) / 100 * pricePer100g
    // Example: 0.5kg -> 500g -> 5 units of 100g -> 5 * 29 = 145 Baht
    const basePrice = (weightGrams / 100) * order.pricePer100g;
    
    setOrder({ 
        weight: weightGrams, 
        basePrice: parseFloat(basePrice.toFixed(2)) 
    });
  }, [weightGrams, order.pricePer100g, setOrder]);

  // Secret trigger: Click 5 times to open USB connection dialog
  const handleSecretTrigger = () => {
      const newCount = secretClicks + 1;
      setSecretClicks(newCount);
      if (newCount >= 5) {
          connect();
          setSecretClicks(0);
      }
  };

  // Secret trigger: Click 3 times on price or subtitle to skip (hidden feature for testing)
  const handlePriceClick = () => {
      // Clear existing timeout
      if (priceClickTimeoutRef.current) {
          clearTimeout(priceClickTimeoutRef.current);
      }

      const newCount = priceClicks + 1;
      setPriceClicks(newCount);
      
      if (newCount >= 3) {
          handleSkip();
          setPriceClicks(0);
      } else {
          // Reset counter after 2 seconds if not reached 3 clicks
          priceClickTimeoutRef.current = setTimeout(() => {
              setPriceClicks(0);
              priceClickTimeoutRef.current = null;
          }, 2000);
      }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
      return () => {
          if (priceClickTimeoutRef.current) {
              clearTimeout(priceClickTimeoutRef.current);
          }
      };
  }, []);

  // Skip button handler for demo/testing
  const handleSkip = () => {
      const demoWeight = 500;
      const basePrice = (demoWeight / 100) * order.pricePer100g;
      
      setOrder({ 
          weight: demoWeight, 
          basePrice: parseFloat(basePrice.toFixed(2)) 
      });
      onNext();
  };

  return (
    <div className="flex-1 w-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 md:p-12">
            {/* Header with Secret Trigger */}
            <h2 
                onClick={handleSecretTrigger}
                className="text-5xl font-bold text-slate-800 mb-6 select-none active:scale-95 transition-transform cursor-pointer"
                title="แตะ 5 ครั้งเพื่อเชื่อมต่อเครื่องชั่ง"
            >
                {t('weighing.title')}
            </h2>
            
            <p 
                onClick={handlePriceClick}
                className="text-2xl text-slate-500 mb-4 cursor-pointer select-none active:scale-95 transition-transform"
                title="ระบบจะคำนวณราคาให้อัตโนมัติ"
            >
                {t('weighing.subtitle')}
            </p>
            
            {/* Connection Status Hint (Only visible if disconnected to help staff) */}
            {!isConnected && (
                <div className="mb-4 text-amber-500 bg-amber-50 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
                    ⚠️ ยังไม่ได้เชื่อมต่อเครื่องชั่ง (แตะหัวข้อ "นำสินค้า..." 5 ครั้ง)
                </div>
            )}

            <p className="text-3xl font-semibold text-[#BF0A30] mb-8">{t('weighing.price_per_unit')}</p>

            <div className="bg-slate-100 rounded-2xl p-10 w-full max-w-2xl mb-12 shadow-inner border border-slate-200">
                <div className="grid grid-cols-2 gap-8 divide-x-2 divide-slate-300">
                <div>
                    <p className="text-3xl font-medium text-slate-600 mb-2">{t('weighing.weight_label')}</p>
                    <p className="text-8xl font-extrabold text-slate-900 tracking-tighter transition-all duration-300">
                        {order.weight}
                    </p>
                </div>
                <div className="pl-8">
                    <p className="text-3xl font-medium text-slate-600 mb-2">{t('weighing.price_label')}</p>
                    <p 
                        onClick={handlePriceClick}
                        className="text-8xl font-extrabold text-[#BF0A30] tracking-tighter transition-all duration-300 cursor-pointer select-none active:scale-95"
                        title="ระบบจะคำนวณราคาให้อัตโนมัติ"
                    >
                        {order.basePrice.toFixed(2)}
                    </p>
                </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 items-center">
                <PrimaryButton 
                    onClick={onNext} 
                    disabled={order.weight === 0 || !isConnected} 
                    className="text-2xl py-6 px-16"
                >
                    {isConnected 
                        ? (order.weight > 0 ? t('weighing.confirm') : t('weighing.place_item')) 
                        : t('weighing.not_ready')}
                </PrimaryButton>

                {/* Demo Skip Button - Hidden for production, use secret click on price instead */}
                {/* <button 
                    onClick={handleSkip}
                    className="mt-4 px-6 py-2 rounded-full border border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all text-sm font-medium"
                >
                    {t('weighing.skip_demo')}
                </button> */}
            </div>
        </div>
    </div>
  );
};

export default WeighingScreen;