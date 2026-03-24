import React, { useState, useEffect, useRef } from 'react';
import type { Order } from '../../../types';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SecondaryButton from '../../../components/ui/SecondaryButton';
import { useLanguage } from '../../../store/LanguageContext';
import { useSettings } from '../../../store/SettingsContext';
import apiService from '../../../services/api';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';

interface SummaryScreenProps {
  order: Order;
  onBack: () => void;
  onPaymentSuccess: (queueNumber: number, orderId?: number) => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ order, onBack, onPaymentSuccess }) => {
    const { t } = useLanguage();
    const { shop } = useSettings();
    const [isPaying, setIsPaying] = useState(false);

    // KBank state
    const [kbankChargeId, setKbankChargeId] = useState<string | null>(null);
    const [kbankQrData, setKbankQrData] = useState<string | null>(null);
    const [kbankQrImageUrl, setKbankQrImageUrl] = useState<string | null>(null);
    const [kbankExpiresAt, setKbankExpiresAt] = useState<Date | null>(null);
    const [kbankStatus, setKbankStatus] = useState<'idle' | 'waiting' | 'paid' | 'expired' | 'error'>('idle');
    const [kbankOrderId, setKbankOrderId] = useState<number | null>(null);
    const [kbankError, setKbankError] = useState<string | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const paymentMode = shop.paymentMode || 'static_qr';

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    // ── Static QR flow (เดิม) ─────────────────────────────────────────────
    const handleStaticQrPay = async () => {
        setIsPaying(true);
        try {
            const orderData = buildOrderPayload('PROMPTPAY');
            const response = await apiService.createOrder(orderData);
            const responseData = response as any;
            const orderId = responseData?.id;
            const queueNumber = responseData?.queue_number || Math.floor(100 + Math.random() * 900);
            onPaymentSuccess(queueNumber, orderId);
        } catch (error: any) {
            console.error('Payment failed:', error);
            alert(error.message || 'การชำระเงินล้มเหลว กรุณาลองอีกครั้ง');
            setIsPaying(false);
        }
    };

    // ── KBank QR flow ─────────────────────────────────────────────────────
    const handleKBankPay = async () => {
        setIsPaying(true);
        setKbankError(null);
        try {
            // 1. สร้างออเดอร์ก่อน (pending payment)
            const orderData = buildOrderPayload('KBANK_QR');
            const orderRes = await apiService.createOrder(orderData) as any;
            const createdOrderId: number = orderRes?.id;
            const queueNumber: number = orderRes?.queue_number || Math.floor(100 + Math.random() * 900);

            if (!createdOrderId) throw new Error('ไม่สามารถสร้างออเดอร์ได้');
            setKbankOrderId(createdOrderId);

            // 2. ขอ KBank QR charge
            const chargeRes = await apiService.createKBankCharge(createdOrderId) as any;

            setKbankChargeId(chargeRes.chargeId);
            setKbankQrData(chargeRes.qrCodeData);
            setKbankQrImageUrl(chargeRes.qrImageUrl);
            setKbankExpiresAt(chargeRes.expiresAt ? new Date(chargeRes.expiresAt) : null);
            setKbankStatus('waiting');
            setIsPaying(false);

            // 3. Poll สถานะทุก 5 วินาที
            startPolling(createdOrderId, queueNumber);

        } catch (error: any) {
            console.error('[KBank] charge error:', error);
            setKbankError(error.message || 'ไม่สามารถสร้าง QR ชำระเงินได้ กรุณาลองอีกครั้ง');
            setKbankStatus('error');
            setIsPaying(false);
        }
    };

    const startPolling = (createdOrderId: number, queueNumber: number) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await apiService.inquireKBankCharge(createdOrderId) as any;
                if (res.status === 'paid') {
                    clearInterval(pollIntervalRef.current!);
                    setKbankStatus('paid');
                    setTimeout(() => onPaymentSuccess(queueNumber, createdOrderId), 1500);
                }
            } catch (e) {
                // ไม่ต้องแสดง error ตอน poll
            }

            // ตรวจ expired
            if (kbankExpiresAt && new Date() > kbankExpiresAt) {
                clearInterval(pollIntervalRef.current!);
                setKbankStatus('expired');
            }
        }, 5000);
    };

    const handleRetryKBank = () => {
        setKbankStatus('idle');
        setKbankChargeId(null);
        setKbankQrData(null);
        setKbankQrImageUrl(null);
        setKbankExpiresAt(null);
        setKbankError(null);
        setKbankOrderId(null);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };

    // ── Shared: สร้าง order payload ────────────────────────────────────────
    const buildOrderPayload = (paymentMethod: string) => {
        const addonCounts = order.addOns.reduce((acc, addon) => {
            acc[addon.id] = (acc[addon.id] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return {
            weight_grams: order.weight,
            price_per_100g: order.pricePer100g,
            base_price: order.basePrice,
            spice_level_id: order.spiceLevel?.id || null,
            soup_id: order.soup?.id || null,
            addons: Object.entries(addonCounts).map(([id, quantity]) => {
                const addon = order.addOns.find(a => a.id === parseInt(id))!;
                return { id: addon.id, addon_id: addon.id, price: addon.price, quantity };
            }),
            subtotal: order.totalPrice - order.vat,
            vat_rate: 0.07,
            vat_amount: order.vat,
            total_price: order.totalPrice,
            dining_location: order.diningLocation?.id || 'TAKEAWAY',
            table_number: order.tableNumber || null,
            cooking_style: order.cookingStyle?.id || 'READY_TO_EAT',
            note: order.note || '',
            payment_method: paymentMethod,
            payment_status: 'pending',
        };
    };

    const addOnsSummary = order.addOns.reduce((acc, item) => {
        if (!acc[item.name]) acc[item.name] = { count: 0, price: item.price };
        acc[item.name].count++;
        return acc;
    }, {} as Record<string, { count: number; price: number }>);

    // ── QR Display Area ───────────────────────────────────────────────────
    const renderPaymentArea = () => {
        // KBank: waiting for payment
        if (paymentMode === 'kbank_gateway' && kbankStatus === 'waiting') {
            const qrSrc = kbankQrImageUrl || (kbankQrData ? `data:image/png;base64,${kbankQrData}` : null);
            return (
                <div className="flex flex-col items-center w-full gap-4">
                    <p className="text-2xl font-bold text-[#BF0A30]">สแกน QR เพื่อชำระเงิน</p>
                    <p className="text-lg text-slate-500">ผ่าน K PLUS หรือ Mobile Banking</p>
                    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 aspect-square max-w-[320px] flex items-center justify-center">
                        {qrSrc ? (
                            <img src={qrSrc} alt="KBank QR Code" className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-400 p-8">
                                <div className="w-16 h-16 border-4 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin" />
                                <p className="text-lg">กำลังโหลด QR...</p>
                            </div>
                        )}
                    </div>
                    {kbankExpiresAt && (
                        <p className="text-sm text-slate-400">
                            QR หมดอายุ: {kbankExpiresAt.toLocaleTimeString('th-TH')}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-slate-500 text-sm animate-pulse">
                        <div className="w-3 h-3 bg-[#BF0A30] rounded-full" />
                        รอการชำระเงิน...
                    </div>
                    <p className="text-xs text-slate-400 text-center px-4">
                        ระบบจะอัปเดตสถานะอัตโนมัติเมื่อชำระสำเร็จ
                    </p>
                </div>
            );
        }

        // KBank: paid success
        if (paymentMode === 'kbank_gateway' && kbankStatus === 'paid') {
            return (
                <div className="flex flex-col items-center gap-6 py-8">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-14 h-14 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-3xl font-extrabold text-green-600">ชำระเงินสำเร็จ!</p>
                    <p className="text-slate-500">กำลังดำเนินการต่อ...</p>
                </div>
            );
        }

        // KBank: expired
        if (paymentMode === 'kbank_gateway' && kbankStatus === 'expired') {
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-2xl font-bold text-orange-500">QR หมดอายุ</p>
                    <p className="text-slate-500">กรุณาสร้าง QR ใหม่เพื่อชำระเงิน</p>
                    <button onClick={handleRetryKBank} className="bg-[#BF0A30] text-white font-bold py-3 px-8 rounded-xl text-lg">
                        สร้าง QR ใหม่
                    </button>
                </div>
            );
        }

        // KBank: error
        if (paymentMode === 'kbank_gateway' && kbankStatus === 'error') {
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-xl font-bold text-red-500">เกิดข้อผิดพลาด</p>
                    <p className="text-slate-500 text-sm text-center px-4">{kbankError}</p>
                    <button onClick={handleRetryKBank} className="bg-[#BF0A30] text-white font-bold py-3 px-8 rounded-xl text-lg">
                        ลองอีกครั้ง
                    </button>
                </div>
            );
        }

        // Static QR / KBank idle (แสดง QR นิ่งก่อนกดชำระ)
        return (
            <div className="flex flex-col items-center w-full">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6 aspect-square max-w-[400px] flex items-center justify-center">
                    {shop.paymentQrCode ? (
                        <img src={resolveMediaUrl(shop.paymentQrCode)} alt="Payment QR Code" className="w-full h-full object-contain" />
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
        );
    };

    // ── ปุ่มชำระ ──────────────────────────────────────────────────────────
    const isQrShowing = paymentMode === 'kbank_gateway' && ['waiting', 'paid', 'expired', 'error'].includes(kbankStatus);
    const showFooterButtons = !isPaying && !isQrShowing;

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
                                renderPaymentArea()
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Buttons */}
            {showFooterButtons && (
                <div className="flex-shrink-0 p-6 md:p-8 bg-white border-t-2 border-slate-200 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="max-w-7xl mx-auto flex w-full justify-between items-center">
                        <SecondaryButton onClick={onBack} className="text-xl md:text-2xl py-4 px-8 md:px-10">{t('btn.back')}</SecondaryButton>
                        <PrimaryButton
                            onClick={paymentMode === 'kbank_gateway' ? handleKBankPay : handleStaticQrPay}
                            className="text-xl md:text-2xl py-4 px-8 md:px-10"
                        >
                            {t('btn.pay')}
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryScreen;
