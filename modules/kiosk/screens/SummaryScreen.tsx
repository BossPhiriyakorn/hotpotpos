
import React, { useState } from 'react';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SecondaryButton from '../../../components/ui/SecondaryButton';
import { useLanguage } from '../../../store/LanguageContext';
import { useSettings } from '../../../store/SettingsContext';
import apiService from '../../../services/api';

interface SummaryScreenProps {
  order: Order;
  onBack: () => void;
  onPaymentSuccess: (queueNumber: number, orderId?: number) => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ order, onBack, onPaymentSuccess }) => {
    const { t } = useLanguage();
    const { shop } = useSettings();
    const [isPaying, setIsPaying] = useState(false);

    const handlePay = async () => {
        setIsPaying(true);
        
        try {
            // Transform order to match backend format
            const orderData = {
                weight_grams: order.weight,
                price_per_100g: order.pricePer100g,
                base_price: order.basePrice,
                spice_level_id: order.spiceLevel?.id || null,
                soup_id: order.soup?.id || null,
                addons: (() => {
                    // Count occurrences of each addon by ID
                    const addonCounts = order.addOns.reduce((acc, addon) => {
                        acc[addon.id] = (acc[addon.id] || 0) + 1;
                        return acc;
                    }, {} as Record<number, number>);
                    
                    // Convert to array with unique addons and their quantities
                    return Object.entries(addonCounts).map(([id, quantity]) => {
                        const addon = order.addOns.find(a => a.id === parseInt(id))!;
                        return {
                            id: addon.id,
                            addon_id: addon.id, // Support both field names for compatibility
                            price: addon.price,
                            quantity: quantity,
                        };
                    });
                })(),
                subtotal: order.totalPrice - order.vat,
                vat_rate: 0.07,
                vat_amount: order.vat,
                total_price: order.totalPrice,
                dining_location: order.diningLocation?.id || 'TAKEAWAY',
                table_number: order.tableNumber || null,
                cooking_style: order.cookingStyle?.id || 'READY_TO_EAT',
                note: order.note || '',
                payment_method: 'PROMPTPAY',
                payment_status: 'pending',
            };

            const response = await apiService.createOrder(orderData);
            
            // Get order details from response
            // Response structure: { success: true, data: { id, queue_number, ... } }
            // After API service: { id, queue_number, ... } (data.data)
            const responseData = response;
            const orderId = responseData?.id;
            const queueNumber = responseData?.queue_number || Math.floor(100 + Math.random() * 900);
            
            onPaymentSuccess(queueNumber, orderId);
        } catch (error: any) {
            console.error('Payment failed:', error);
            alert(error.message || 'การชำระเงินล้มเหลว กรุณาลองอีกครั้ง');
            setIsPaying(false);
        }
    };

  // FIX: Provide a typed initial value to Array.reduce to ensure correct type inference for the accumulator.
  // This resolves errors related to accessing properties on the accumulator object and with the reduce call itself.
  const addOnsSummary = order.addOns.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { count: 0, price: item.price };
    }
    acc[item.name].count++;
    return acc;
  }, {} as Record<string, { count: number; price: number }>);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12 pb-8">
                {/* Left Column: Order Summary */}
                <div className="w-full lg:w-1/2 flex flex-col">
                <h2 className="text-4xl font-extrabold text-slate-800 mb-6">{t('sum.title')}</h2>
                
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-3 text-xl w-full">
                    <div className="flex justify-between items-baseline">
                    <span className="font-medium text-slate-700">{t('sum.weight_item')} ({order.weight} g)</span>
                    <span className="font-semibold text-slate-800">{order.basePrice.toFixed(2)} ฿</span>
                    </div>

                    <hr className="border-t border-red-100" />
                    
                    {order.soup?.isSpicy && order.spiceLevel && (
                        <div className="flex justify-between items-baseline">
                        <span className="font-medium text-slate-700">{t('sum.spice_level')}</span>
                        <span className="font-semibold text-slate-800">
                            {order.spiceLevel.name}
                            {order.spiceLevel.price ? ` (+${order.spiceLevel.price})` : ''}
                        </span>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-baseline">
                    <span className="font-medium text-slate-700">{t('sum.soup')}</span>
                    <span className="font-semibold text-slate-800">{order.soup?.name}</span>
                    </div>

                    {Object.keys(addOnsSummary).length > 0 && <hr className="border-t border-red-100" />}

                    {Object.entries(addOnsSummary).map(([name, { count, price }]) => (
                    <div key={name} className="flex justify-between items-baseline">
                        <span className="font-medium text-slate-700">{name} x{count}</span>
                        <span className="font-semibold text-slate-800">{(count * price).toFixed(2)} ฿</span>
                    </div>
                    ))}

                    <hr className="border-t border-red-100" />
                    
                    <div className="flex justify-between items-baseline">
                        <span className="font-medium text-slate-700">{t('sum.cooking_style')}</span>
                        <span className="font-semibold text-[#BF0A30]">{order.cookingStyle?.name}</span>
                    </div>

                    {order.note && (
                        <div className="flex flex-col mt-2">
                            <span className="font-medium text-slate-700">{t('sum.note')}:</span>
                            <span className="text-slate-600 text-lg bg-slate-50 p-2 rounded border border-slate-200 mt-1">{order.note}</span>
                        </div>
                    )}

                </div>
                
                <div className="pt-6 mt-4 text-xl space-y-2">
                    <div className="flex justify-between font-medium">
                    <span className="text-slate-600">{t('sum.subtotal')}</span>
                    <span>{(order.totalPrice - order.vat).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                    <span className="text-slate-600">{t('sum.vat')}</span>
                    <span>{order.vat.toFixed(2)}</span>
                    </div>
                    <hr className="border-t border-slate-300 my-2" />
                    <div className="flex justify-between font-bold text-3xl">
                    <span className="text-slate-800">{t('sum.grand_total')}</span>
                    <span className="text-[#BF0A30]">{order.totalPrice.toFixed(2)}</span>
                    </div>
                </div>
                </div>

                {/* Right Column: Payment */}
                <div className="w-full lg:w-1/2 flex flex-col items-center mt-8 lg:mt-0">
                {isPaying ? (
                    <div className="text-center py-12">
                    <div className="w-24 h-24 border-8 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
                    <p className="text-4xl font-bold text-slate-700 mt-8">{t('sum.paying')}</p>
                    <p className="text-2xl text-slate-500 mt-2">{t('sum.wait')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6 aspect-square max-w-[400px] flex items-center justify-center">
                        {shop.paymentQrCode ? (
                            <img src={shop.paymentQrCode} alt="Payment QR Code" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-4H6v4H2v-4h4V9h4v2h2a2 2 0 012 2v1z" />
                                </svg>
                                <p className="text-slate-400 text-lg font-medium">กรุณาอัพโหลด QR Code</p>
                                <p className="text-slate-400 text-sm mt-2">ในหน้า Admin → ตั้งค่าระบบ</p>
                            </div>
                        )}
                    </div>
                    <p className="text-xl text-slate-600 text-center font-medium bg-white px-6 py-2 rounded-full shadow-sm">
                        {t('sum.mobile_banking')}
                    </p>
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>

      {/* Footer Buttons (only if not paying) */}
      {!isPaying && (
        <div className="flex-shrink-0 p-6 md:p-8 bg-white border-t-2 border-slate-200 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto flex w-full justify-between items-center">
            <SecondaryButton onClick={onBack} className="text-xl md:text-2xl py-4 px-8 md:px-10">{t('btn.back')}</SecondaryButton>
            <PrimaryButton onClick={handlePay} className="text-xl md:text-2xl py-4 px-8 md:px-10">{t('btn.pay')}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryScreen;