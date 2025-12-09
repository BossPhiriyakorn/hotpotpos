
import React, { useState, useEffect } from 'react';
import type { KitchenOrder, KitchenOrderStatus } from '../../types';
import SecondaryButton from '../../components/ui/SecondaryButton';
import apiService from '../../services/api';


const OrderCard: React.FC<{ order: KitchenOrder & { orderId?: number }; onUpdateStatus: (orderId: number, status: KitchenOrderStatus) => void; onRemove: (orderId: number) => void; }> = ({ order, onUpdateStatus, onRemove }) => {
  const statusStyles = {
    queued: {
      number: 'text-[#BF0A30]',
      border: 'border-4 border-[#BF0A30]',
    },
    'in-progress': {
      number: 'text-green-500',
      border: 'border-4 border-green-500',
    },
    done: {
      number: 'text-slate-600',
      border: 'border-4 border-slate-300',
    },
  };

  const currentStyle = statusStyles[order.status];

  // Badge Color for Cooking Style
  const getCookingStyleBadge = (style: string) => {
      switch(style) {
          case 'แยกน้ำซุป': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'ยังไม่ต้ม': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
  };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-md flex flex-col min-h-[250px] ${currentStyle.border}`}>
      <div className="flex justify-between items-start mb-2">
        <p className={`text-4xl font-extrabold ${currentStyle.number}`}>{order.id}</p>
        <span className={`text-sm font-bold px-2 py-1 rounded border ${getCookingStyleBadge(order.cookingStyle)}`}>
              {order.cookingStyle}
        </span>
      </div>

      <ul className="space-y-1.5 text-slate-700 text-lg flex-grow mb-3 divide-y divide-slate-100">
        {order.items.map((item, index) => (
          <li key={index} className="flex justify-between pt-1">
            <span className="truncate pr-2 font-medium">{item.name}</span>
            <span className="font-bold tabular-nums flex-shrink-0 text-slate-900">x{item.quantity}</span>
          </li>
        ))}
      </ul>

      {/* Note Section */}
      {order.note && (
          <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg">
              <span className="text-xs font-bold text-red-400 uppercase">หมายเหตุ:</span>
              <p className="text-red-600 font-bold text-sm">{order.note}</p>
          </div>
      )}

      <div className="mt-auto pt-2">
        {order.status === 'queued' && (
          <button
            onClick={() => onUpdateStatus(order.orderId || order.id, 'in-progress')}
            className="w-full bg-[#BF0A30] text-white font-bold py-2.5 px-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105 shadow-md"
          >
            เริ่มปรุง
          </button>
        )}
        {order.status === 'in-progress' && (
          <button
            onClick={() => onUpdateStatus(order.orderId || order.id, 'done')}
            className="w-full bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105 shadow-md"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            เสร็จแล้ว
          </button>
        )}
        {order.status === 'done' && (
           <button
            onClick={() => onRemove(order.orderId || order.id)}
            className="w-full bg-slate-200 text-slate-500 font-bold py-2.5 px-4 rounded-lg text-lg cursor-default hover:bg-slate-300 transition-colors"
          >
            รับอาหารแล้ว
          </button>
        )}
      </div>
    </div>
  );
};

const KitchenColumn: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
    <div className="flex flex-col h-full bg-transparent">
        <div className={`flex-shrink-0 pb-2 mb-4 border-b-4 ${color}`}>
            <h2 className="text-xl font-bold text-slate-700 tracking-wide">{title}</h2>
        </div>
        <div className="relative flex-grow">
            <div className="absolute inset-0 overflow-y-auto space-y-4 pr-2 -mr-2 no-scrollbar">
                {children}
            </div>
        </div>
    </div>
);

interface KitchenScreenProps {
    onBack: () => void;
}

const KitchenScreen: React.FC<KitchenScreenProps> = ({ onBack }) => {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const kitchenOrders = await apiService.getKitchenOrders();
            
            // Transform API data to KitchenOrder format
            // Use queue_number for display, but keep database id for API calls
            const transformedOrders: KitchenOrder[] = kitchenOrders.map((order: any) => ({
                id: order.queue_number || order.id, // Display queue_number
                orderId: order.id, // Keep database ID for API calls
                status: (order.status || 'queued') as KitchenOrderStatus,
                items: order.items || [],
                diningType: order.dining_location === 'DINE_IN' ? 'dine-in' : 'takeaway',
                cookingStyle: order.cooking_style || 'พร้อมทาน',
                note: order.note || '',
            }));

            setOrders(transformedOrders);
        } catch (error) {
            console.error('Failed to fetch kitchen orders:', error);
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

    const handleUpdateStatus = async (orderId: number, newStatus: KitchenOrderStatus) => {
        try {
            // Map frontend status to backend status
            const backendStatusMap: Record<KitchenOrderStatus, string> = {
                'queued': 'queued',
                'in-progress': 'in-progress',
                'done': 'done',
            };
            
            const backendStatus = backendStatusMap[newStatus] || newStatus;
            await apiService.updateKitchenStatus(orderId, backendStatus);
            
            // Update local state - match by orderId (database ID) or id (queue_number)
            setOrders(prevOrders => prevOrders.map(o => 
                (o as any).orderId === orderId || o.id === orderId 
                    ? { ...o, status: newStatus } 
                    : o
            ));
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('ไม่สามารถอัพเดทสถานะได้ กรุณาลองอีกครั้ง');
        }
    };

    const handleRemoveOrder = async (orderId: number) => {
        try {
            // Update order status to 'completed' in database
            // orderId should be the database ID, not queue_number
            await apiService.updateOrderStatus(orderId, 'completed');
            
            // Remove from local state - match by orderId (database ID) or id (queue_number)
            setOrders(prevOrders => {
                const filtered = prevOrders.filter(o => 
                    (o as any).orderId !== orderId && o.id !== orderId
                );
                return filtered;
            });
            
            // Refresh orders to ensure sync with backend
            await fetchOrders();
        } catch (error: any) {
            console.error('Failed to complete order:', error);
            console.error('Error details:', error.message);
            alert(`ไม่สามารถอัพเดทสถานะได้: ${error.message || 'กรุณาลองอีกครั้ง'}`);
        }
    };
    
    const queuedOrders = orders.filter(o => o.status === 'queued').sort((a, b) => a.id - b.id);
    const inProgressOrders = orders.filter(o => o.status === 'in-progress');
    const doneOrders = orders.filter(o => o.status === 'done');

    return (
        <div className="bg-slate-100 h-screen w-full flex flex-col p-4 md:p-6 font-sans">
            <header className="flex-shrink-0 flex justify-between items-center pb-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">ครัวหม่าล่า</h1>
                </div>
                <SecondaryButton onClick={onBack} className="text-lg py-2 px-6">
                    กลับหน้าหลัก
                </SecondaryButton>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 flex-grow min-h-0">
                <KitchenColumn title="รอคิว (Queued)" color="border-red-400">
                    {queuedOrders.length > 0 ? (
                        queuedOrders.map(order => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onRemove={handleRemoveOrder} />
                        ))
                    ) : (
                      <div className="text-center text-slate-400 pt-8 italic">ไม่มีออเดอร์ในคิว</div>
                    )}
                </KitchenColumn>
                <KitchenColumn title="กำลังปรุง (In Progress)" color="border-green-400">
                     {inProgressOrders.map(order => (
                        <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onRemove={handleRemoveOrder} />
                    ))}
                </KitchenColumn>
                <KitchenColumn title="เสร็จแล้ว (Ready)" color="border-slate-300">
                     {doneOrders.map(order => (
                        <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onRemove={handleRemoveOrder} />
                    ))}
                </KitchenColumn>
            </main>
        </div>
    );
};

export default KitchenScreen;
    