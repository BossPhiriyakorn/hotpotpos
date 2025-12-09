import React, { useState, useEffect } from 'react';
import type { KitchenOrder } from '../../types';
import apiService from '../../services/api';

const ReadyOrderCard: React.FC<{ order: KitchenOrder }> = ({ order }) => (
    <div className="bg-green-500 rounded-2xl p-4 flex items-center justify-center aspect-[4/3] shadow-lg animate-[fade-in_0.5s_ease-in-out] w-[200px] h-[150px] md:w-[240px] md:h-[180px]">
        <p className="text-7xl md:text-9xl font-extrabold text-white tracking-tighter">{order.id}</p>
    </div>
);

const InProgressQueueItem: React.FC<{ orderId: number }> = ({ orderId }) => (
    <div className="bg-white border-2 border-red-200 rounded-xl p-6 flex items-center justify-center shadow-sm">
        <p className="text-6xl font-extrabold text-red-500 tracking-tighter">{orderId}</p>
    </div>
);

const HotpotIcon = () => (
    <div className="inline-block w-16 h-16 mx-2">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8,32 C8,42 18,50 32,50 C46,50 56,42 56,32" stroke="#4A4A4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12,32 C12,38 20,44 32,44 C44,44 52,38 52,32" fill="#BF0A30" />
            <path d="M24 28 Q 28 20 32 28" stroke="#E0E0E0" strokeWidth="3" strokeLinecap="round"/>
            <path d="M32 24 Q 36 16 40 24" stroke="#E0E0E0" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    </div>
);


interface QueueDisplayScreenProps {
  onBack: () => void;
}

const QueueDisplayScreen: React.FC<QueueDisplayScreenProps> = ({ onBack }) => {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const [readyOrders, inProgressOrders] = await Promise.all([
                apiService.getReadyOrders(),
                apiService.getInProgressOrders(),
            ]);

            // Transform API data to KitchenOrder format
            const transformedOrders: KitchenOrder[] = [
                ...inProgressOrders.map((order: any) => ({
                    id: order.queue_number || order.id,
                    status: 'in-progress' as const,
                    items: order.items || [],
                    diningType: order.dining_location === 'DINE_IN' ? 'dine-in' : 'takeaway',
                    cookingStyle: order.cooking_style || 'พร้อมทาน',
                })),
                ...readyOrders.map((order: any) => ({
                    id: order.queue_number || order.id,
                    status: 'done' as const,
                    items: order.items || [],
                    diningType: order.dining_location === 'DINE_IN' ? 'dine-in' : 'takeaway',
                    cookingStyle: order.cooking_style || 'พร้อมทาน',
                })),
            ];

            setOrders(transformedOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            // Set empty array if API fails (no fallback to mock data)
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);
    
    const inProgressOrders = orders.filter(o => o.status === 'in-progress').sort((a, b) => a.id - b.id);
    const readyOrders = orders.filter(o => o.status === 'done').sort((a, b) => a.id - b.id);

    return (
        <div className="w-screen h-screen bg-white text-slate-800 flex flex-col font-sans overflow-hidden">
            <div className="flex-grow flex flex-col pt-8 pb-12 px-8 md:px-12 min-h-0">
                {/* Header */}
                <header className="text-center mb-10 flex-shrink-0">
                     <h1 className="text-5xl md:text-7xl font-extrabold text-slate-700 tracking-tight flex items-center justify-center gap-4">
                       <HotpotIcon />
                        อดใจรอสักครู่นะคะ
                       <HotpotIcon />
                    </h1>
                </header>
                
                {/* Content Area */}
                <main className="flex-grow flex min-h-0 gap-12">
                    {/* Left Column: In Progress */}
                    <section className="w-1/3 flex flex-col bg-red-50 rounded-3xl p-6 border-2 border-red-100">
                        <h2 className="text-4xl font-bold text-center text-slate-700 mb-6 pb-4 border-b-2 border-red-200 flex-shrink-0">
                           กำลังปรุงอาหาร
                        </h2>
                        <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pr-2">
                           {inProgressOrders.length > 0 ? (
                               inProgressOrders.map(order => (
                                    <InProgressQueueItem key={order.id} orderId={order.id} />
                               ))
                           ) : (
                               <div className="text-center text-slate-400 mt-10 italic text-2xl">ไม่มีคิวที่กำลังปรุง</div>
                           )}
                        </div>
                    </section>
                    
                    {/* Right Column: Ready for Pickup (Unified) */}
                    <section className="w-2/3 flex flex-col bg-green-50 rounded-3xl p-6 border-2 border-green-100">
                        <h2 className="text-4xl font-bold text-center text-slate-700 mb-6 pb-4 border-b-2 border-green-200 flex-shrink-0">
                           รับอาหารได้เลย
                        </h2>
                        <div className="flex-grow overflow-y-auto no-scrollbar pr-2">
                            <div className="flex flex-wrap gap-6 justify-center content-start">
                                {readyOrders.length > 0 ? (
                                    readyOrders.map(order => (
                                        <ReadyOrderCard key={order.id} order={order} />
                                    ))
                                ) : (
                                    <div className="w-full text-center text-slate-400 mt-10 italic text-2xl">ยังไม่มีคิวที่เสร็จแล้ว</div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};


export default QueueDisplayScreen;