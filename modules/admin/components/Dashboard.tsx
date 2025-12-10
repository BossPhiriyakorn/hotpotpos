
import React, { useState, useMemo, useEffect, useRef } from 'react';
import apiService from '../../../services/api';

// --- Custom Icons for Dashboard ---

const WalletIcon = () => (
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#BF0A30]">
             <path d="M21 7.5c0-.414-.336-.75-.75-.75H5.25c-.414 0-.75.336-.75.75v10.5c0 .414.336.75.75.75h15c.414 0 .75-.336.75-.75V7.5z" opacity="0.3"/>
             <path fillRule="evenodd" d="M19.5 6h-15A2.25 2.25 0 002.25 8.25v9A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0019.5 6zm-2.25 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
    </div>
);

const OrderListIcon = () => (
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-10 h-10 text-orange-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    </div>
);

const GreenArrowUp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
        <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
    </svg>
);

const Dashboard = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [ordersGrowth, setOrdersGrowth] = useState(0);
  const [chartData, setChartData] = useState<Array<{ fullDate: string; day: string; sales: number; orders: number }>>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  const currentDate = new Date();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const dateRange = `${firstDay.getDate()} ${currentDate.toLocaleDateString('th-TH', { month: 'short' })} - ${currentDate.getDate()} ${currentDate.toLocaleDateString('th-TH', { month: 'short' })}`;

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('กรุณาเข้าสู่ระบบ');
          setLoading(false);
          return;
        }

        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = currentDate.toISOString().split('T')[0];

        const summary: any = await apiService.getDashboardSummary({ startDate, endDate });

        setTotalRevenue(summary?.totalRevenue || 0);
        setTotalOrders(summary?.totalOrders || 0);
        setRevenueGrowth(summary?.revenueGrowth || 0);
        setOrdersGrowth(summary?.ordersGrowth || 0);
        setChartData(summary?.chartData || []);
        setRecentOrders(summary?.recentOrders || []);
        setTopItems(summary?.topProducts || []);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        const errorMessage = err.message || 'Failed to load dashboard data';
        
        // Check if it's an authentication/authorization error
        if (errorMessage.includes('Admin access required') || errorMessage.includes('authentication') || errorMessage.includes('Access token required')) {
          setError('กรุณาเข้าสู่ระบบใหม่');
        } else {
          setError(errorMessage);
        }
        
        // Set defaults
        setTotalRevenue(0);
        setTotalOrders(0);
        setRevenueGrowth(0);
        setOrdersGrowth(0);
        setChartData([]);
        setRecentOrders([]);
        setTopItems([]);
      } finally {
        setLoading(false);
    }
    };

    // Initial fetch
    fetchDashboardData();

    // Auto-refresh every 30 seconds to keep data up-to-date
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const maxSales = Math.max(...chartData.map(d => d.sales), 1);
  const maxOrders = Math.max(...chartData.map(d => d.orders), 1);

  // Calculate tooltip position when hoveredIndex changes
  useEffect(() => {
    const updateTooltipPosition = () => {
      if (hoveredIndex !== null && barRefs.current[hoveredIndex]) {
        const barElement = barRefs.current[hoveredIndex];
        if (barElement) {
          const rect = barElement.getBoundingClientRect();
          const tooltipWidth = 200; // Approximate tooltip width
          const tooltipHeight = 80; // Approximate tooltip height
          const spacing = 12; // Space between bar and tooltip
          
          // Calculate position: above the bar, centered horizontally
          let left = rect.left + (rect.width / 2);
          let top = rect.top - tooltipHeight - spacing;
          
          // Ensure tooltip doesn't go off screen horizontally
          const viewportWidth = window.innerWidth;
          const minLeft = 10;
          const maxLeft = viewportWidth - tooltipWidth - 10;
          left = Math.max(minLeft, Math.min(left, maxLeft));
          
          // Ensure tooltip doesn't go off screen vertically (if too high, show below)
          const viewportHeight = window.innerHeight;
          if (top < 10) {
            top = rect.bottom + spacing; // Show below bar instead
          }
          
          setTooltipPosition({ top, left });
        }
      } else {
        setTooltipPosition(null);
      }
    };

    updateTooltipPosition();

    // Update position on resize and scroll
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);
    
    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [hoveredIndex]);

  const tableOrders = useMemo(() => {
      return recentOrders.slice(0, 8); 
  }, [recentOrders]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-8 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">เกิดข้อผิดพลาด</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-[fade-in_0.5s_ease-in-out]">
      
      {/* Stats Cards - Redesigned to match request */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Revenue */}
        <div className="bg-white p-4 md:p-5 lg:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-[240px] min-w-0">
           <div className="flex justify-between items-start mb-2 md:mb-3 flex-shrink-0">
              <h3 className="text-slate-600 font-bold text-sm md:text-base lg:text-lg truncate flex-1 mr-2">ยอดขายรวมเดือนนี้</h3>
              <div className="flex-shrink-0">
              <WalletIcon />
              </div>
           </div>
           
           <div className="flex-1 flex items-center justify-center min-h-0 px-2 w-full">
              <p className="text-4xl sm:text-5xl md:text-5xl lg:text-5xl xl:text-5xl font-bold text-[#BF0A30] tracking-tight leading-[1.1] text-center w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                {totalRevenue.toLocaleString()}
              </p>
           </div>

           <div className="mt-auto flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                 <div className="bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                    <span className="text-green-700 text-xs font-bold">▲ {revenueGrowth.toFixed(1)}%</span>
                 </div>
                 <span className="text-slate-500 text-xs md:text-sm whitespace-nowrap">จากเดือนก่อน</span>
              </div>
              <p className="text-xs text-slate-400 truncate">ช่วงวันที่: {dateRange}</p>
           </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white p-4 md:p-5 lg:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-[240px] min-w-0">
           <div className="flex justify-between items-start mb-2 md:mb-3 flex-shrink-0">
              <h3 className="text-slate-600 font-bold text-sm md:text-base lg:text-lg truncate flex-1 mr-2">ออเดอร์ทั้งหมด</h3>
              <div className="flex-shrink-0">
              <OrderListIcon />
              </div>
           </div>
           
           <div className="flex-1 flex items-center justify-center min-h-0 px-2 w-full">
              <p className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-6xl font-bold text-orange-400 tracking-tight leading-[1.1] text-center w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                {totalOrders}
              </p>
           </div>

           <div className="mt-auto flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                 <div className="bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                    <span className="text-green-700 text-xs font-bold">▲ {ordersGrowth.toFixed(1)}%</span>
                 </div>
                 <span className="text-slate-500 text-xs md:text-sm whitespace-nowrap">จากเดือนก่อน</span>
              </div>
              <p className="text-xs text-slate-400 truncate">ช่วงวันที่: {dateRange}</p>
           </div>
        </div>

        {/* Card 3: Top 3 Items */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-[240px] flex flex-col min-w-0 overflow-hidden">
            <h3 className="text-slate-600 font-bold text-sm md:text-base lg:text-lg mb-3 md:mb-4 truncate flex-shrink-0">สินค้าขายดี ( TOP 3 )</h3>
            <div className="flex-1 flex flex-col justify-between py-2 gap-2 min-h-0 overflow-hidden">
                {topItems.slice(0, 3).map((item, idx) => (
                    <div key={item.rank || item.id || idx} className="flex items-center justify-between gap-2 min-w-0 flex-shrink-0">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 overflow-hidden">
                            <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-500 font-medium text-xs md:text-sm lg:text-base bg-white flex-shrink-0">
                                {item.rank || (idx + 1)}
                            </div>
                            <span className="font-medium text-slate-700 text-xs md:text-sm lg:text-base truncate min-w-0 overflow-hidden text-ellipsis">{item.name}</span>
                        </div>
                        <div className="flex-shrink-0">
                        <GreenArrowUp />
                        </div>
                    </div>
                ))}
                {topItems.length === 0 && (
                    <div className="text-slate-400 text-xs md:text-sm italic text-center py-4">ยังไม่มีข้อมูล</div>
                )}
            </div>
        </div>
      </div>

      {/* Weekly Chart Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-2 gap-2">
            <div>
                <h3 className="text-xl font-bold text-slate-700">สถิติยอดขายและออเดอร์รายสัปดาห์</h3>
            </div>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#BF0A30] rounded-full"></span>
                    <span className="text-slate-500">ยอดขาย (บาท)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span className="text-slate-500">จำนวนออเดอร์</span>
                </div>
            </div>
        </div>
        
        <div className="w-full overflow-x-auto pb-2">
            <div className="h-72 relative min-w-[500px]" 
                 onMouseLeave={() => {
                   setHoveredIndex(null);
                   setTooltipPosition(null);
                 }}
                 onTouchStart={(e) => {
                   // Clear hover on touch start to prevent sticky tooltips
                   if (hoveredIndex !== null) {
                     setHoveredIndex(null);
                     setTooltipPosition(null);
                   }
                 }}>
                
                {/* Tooltip - Fixed positioning outside container */}
                {hoveredIndex !== null && chartData[hoveredIndex] && tooltipPosition && (
                    <div 
                        className="fixed z-50 pointer-events-none transition-all duration-200 ease-out flex flex-col items-center"
                        style={{ 
                            left: `${tooltipPosition.left}px`,
                            top: `${tooltipPosition.top}px`,
                            transform: 'translateX(-50%)',
                            maxWidth: '90vw'
                        }}
                    >
                        <div className="bg-slate-800/95 backdrop-blur-sm text-white text-xs rounded-lg py-2 px-3 shadow-xl mb-1">
                            <div className="font-bold mb-1 border-b border-slate-600 pb-1 text-center whitespace-nowrap">
                                {chartData[hoveredIndex].day} ({chartData[hoveredIndex].fullDate})
                            </div>
                            <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    <div className="w-2 h-2 bg-[#BF0A30] rounded-full shadow-[0_0_4px_#BF0A30] flex-shrink-0"></div>
                                    <span className="font-medium">฿{chartData[hoveredIndex].sales.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_4px_orange] flex-shrink-0"></div>
                                    <span className="font-medium">{chartData[hoveredIndex].orders} ออเดอร์</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800/95"></div>
                    </div>
                )}

                {/* Bars */}
                <div className="w-full h-full grid grid-cols-7 gap-2 items-end pt-14 pb-6 px-2">
                    {chartData.map((item, index) => {
                        return (
                            <div 
                                key={index} 
                                ref={(el) => {
                                    barRefs.current[index] = el;
                                }}
                                className="flex flex-col items-center h-full justify-end group cursor-pointer relative transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => {
                                    // Only clear on mouse leave if not on mobile
                                    if (window.innerWidth >= 768) {
                                        setHoveredIndex(null);
                                        setTooltipPosition(null);
                                    }
                                }}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    // Toggle tooltip on touch
                                    setHoveredIndex(hoveredIndex === index ? null : index);
                                }}
                            >
                                <div className="w-full rounded-t-lg relative flex items-end justify-center gap-1 overflow-hidden h-full transition-all px-0.5 md:px-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200">
                                    <div 
                                        style={{ height: `${(item.sales / maxSales) * 100}%` }} 
                                        className={`flex-1 w-full bg-[#BF0A30] rounded-t-sm transition-all duration-300 ease-out ${hoveredIndex === index ? 'bg-red-700' : ''}`}
                                    >
                                    </div>
                                    <div 
                                        style={{ height: `${(item.orders / maxOrders) * 100}%` }} 
                                        className={`flex-1 w-full bg-orange-500 rounded-t-sm transition-all duration-300 ease-out ${hoveredIndex === index ? 'bg-orange-600' : ''}`}
                                    >
                                    </div>
                                </div>

                                <div className="absolute -bottom-6 left-0 w-full text-center">
                                    <p className={`text-xs md:text-sm font-bold truncate transition-colors ${hoveredIndex === index ? 'text-[#BF0A30]' : 'text-slate-600'}`}>
                                        {item.day}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">
            รายการออเดอร์ล่าสุด
          </h3>
          <span className="text-xs text-slate-400">{tableOrders.length} รายการ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-medium whitespace-nowrap">รหัสออเดอร์</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">วันที่ / เวลา</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">สถานที่ขาย</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">จำนวนสินค้า</th>
                <th className="px-6 py-3 font-medium whitespace-nowrap">การชำระเงิน</th>
                <th className="px-6 py-3 font-medium text-right whitespace-nowrap">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableOrders.length > 0 ? (
                  tableOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{order.id}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {order.date} <span className="text-xs text-slate-400">({order.time})</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap font-medium">
                        {order.branchName || 'ไม่ระบุสาขา'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{order.itemCount} รายการ</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700 whitespace-nowrap">฿{order.total.toLocaleString()}</td>
                    </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                          ไม่มีรายการออเดอร์สำหรับวันที่เลือก
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-center">
                <button className="text-[#BF0A30] font-medium text-sm hover:underline">ดูรายการทั้งหมด</button>
            </div>
      </div>
    </div>
  );
};

export default Dashboard;
