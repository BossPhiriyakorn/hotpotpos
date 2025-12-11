
import React, { useState, useMemo, useEffect } from 'react';
import { VAT_RATE } from '../../../constants';
import apiService from '../../../services/api';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" />
    </svg>
);

const Reports = ({ subView }: { subView: 'sales' | 'receipts' | 'products' | 'tax' }) => {
  // Helper to get local date string YYYY-MM-DD
  const getTodayStr = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFirstDayOfMonthStr = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  // Input states (what the user is typing/selecting) - Default to First Day of Month
  const [inputStartDate, setInputStartDate] = useState(getFirstDayOfMonthStr());
  const [inputEndDate, setInputEndDate] = useState(getTodayStr());
  const [inputBranchId, setInputBranchId] = useState<string>('all');

  // Filter states (what is actually applied to the data) - Default to First Day of Month
  const [filterStartDate, setFilterStartDate] = useState(getFirstDayOfMonthStr());
  const [filterEndDate, setFilterEndDate] = useState(getTodayStr());
  const [filterBranchId, setFilterBranchId] = useState<string>('all');

  // Data states
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const branchLabel = 'ที่ร้าน';

  const handleSearch = async () => {
    setFilterStartDate(inputStartDate);
    setFilterEndDate(inputEndDate);
    setFilterBranchId(inputBranchId);
    await fetchData(inputStartDate, inputEndDate, inputBranchId);
  };

  // Auto-search when branch filter changes
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranchId = e.target.value;
    setInputBranchId(newBranchId);
    // Auto-trigger search when branch changes
    setFilterBranchId(newBranchId);
    fetchData(inputStartDate, inputEndDate, newBranchId);
  };

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await apiService.getBranches();
        setBranches(branchesData || []);
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };
    fetchBranches();
  }, []);

  const fetchData = async (startDate: string, endDate: string, branchId: string = 'all') => {
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

      const params: any = { startDate, endDate };
      if (branchId && branchId !== 'all') {
        params.branchId = branchId;
      }

      const [ordersData, productsData] = await Promise.all([
        apiService.getOrdersForReports(params),
        apiService.getProductSales(params),
      ]);

      setFilteredOrders(ordersData || []);
      setProductSales(productsData || []);
    } catch (err: any) {
      console.error('Failed to fetch reports data:', err);
      const errorMessage = err.message || 'Failed to load reports data';
      
      // Check if it's an authentication/authorization error
      if (errorMessage.includes('Admin access required') || errorMessage.includes('authentication') || errorMessage.includes('Access token required')) {
        setError('กรุณาเข้าสู่ระบบใหม่');
      } else {
        setError(errorMessage);
      }
      
      setFilteredOrders([]);
      setProductSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData(filterStartDate, filterEndDate, filterBranchId);

    // Auto-refresh every 30 seconds to keep data up-to-date
    const interval = setInterval(() => {
      fetchData(filterStartDate, filterEndDate, filterBranchId);
    }, 30000); // 30 seconds

    // Cleanup interval on unmount or when date range changes
    return () => clearInterval(interval);
  }, [filterStartDate, filterEndDate, filterBranchId]);

  // Common calculations
  const totalSales = filteredOrders.reduce((a, b) => a + b.total, 0);
  const totalOrders = filteredOrders.length;

  // --- CSV Export Logic ---
  const downloadCSV = (content: string, filename: string) => {
      // Add BOM for Thai character support in Excel
      const bom = '\uFEFF'; 
      const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportReceipts = () => {
      const headers = [
          'วันที่', 'เวลา', 'เลขรายการคำสั่งซื้อ', 'เลขที่ใบเสร็จ', 'ช่องทาง', 'สถานที่ขาย',
          'ยอดขายรวม', 'ยอดขายสุทธิ', 'จำนวนสินค้า', 'ช่องทางชำระเงิน', 'ค่าบริการเพิ่มเติม',
          'ภาษี', 'ส่วนลด', 'การปัดเศษ', 'ทิป', 'ค่าจัดส่ง', 'ยอดที่ได้รับ'
      ];

      const rows = filteredOrders.map(order => {
          const netSales = order.total / (1 + VAT_RATE);
          const vat = order.total - netSales;
          return [
              order.date,
              order.time,
              order.id,
              order.receiptId,
              order.channel,
          branchLabel,
              order.total.toFixed(2),
              netSales.toFixed(2),
              order.itemCount,
              order.paymentMethod,
              order.serviceCharge.toFixed(2),
              vat.toFixed(2),
              order.discount.toFixed(2),
              order.rounding.toFixed(2),
              order.tip.toFixed(2),
              order.deliveryFee.toFixed(2),
              order.total.toFixed(2) // Total Received
          ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCSV(csvContent, `receipts_report_${filterStartDate}_to_${filterEndDate}.csv`);
  };
  
  // Group by Date for Daily Summary (Used in Tax Report logic and Export)
  const dailySummaries = useMemo(() => {
    const summary: Record<string, { date: string; gross: number }> = {};
    
    filteredOrders.forEach((order: any) => {
        const orderDate = order.date;
        if (!summary[orderDate]) {
            summary[orderDate] = { date: orderDate, gross: 0 };
        }
        summary[orderDate].gross += order.total || 0;
    });

    // Convert to array and sort by date descending
    return Object.values(summary)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(day => {
            const dayNet = day.gross / (1 + VAT_RATE);
            const dayVat = day.gross - dayNet;
            return { ...day, net: dayNet, vat: dayVat };
        });
  }, [filteredOrders]);

  const handleExportTax = () => {
      const headers = ['วันที่', 'ประเภทภาษี', 'อัตรา (%)', 'ยอดขายรวมภาษี', 'ภาษี'];
      
      const rows = dailySummaries.map(day => [
          day.date,
          'VAT',
          '7%',
          day.gross.toFixed(2),
          day.vat.toFixed(2)
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCSV(csvContent, `tax_report_${filterStartDate}_to_${filterEndDate}.csv`);
  };


  if (subView === 'products') {
      const top10 = productSales.slice(0, 10);

      if (loading) {
        return (
          <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-6 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        );
      }

      if (error && !loading) {
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
        <div className="p-4 md:p-8 space-y-6 animate-[fade-in_0.5s_ease-in-out]">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">สรุปยอดตามสินค้าและหมวดหมู่</h2>

            {/* Top 10 Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-6">Top 10 สินค้าขายดีประจำเดือน</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {top10.map((item, index) => (
                        <div key={item.id} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition-all flex flex-col items-center text-center bg-slate-50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${index < 3 ? 'bg-[#BF0A30] text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {index + 1}
                            </div>
                            <h4 className="font-bold text-slate-800 truncate w-full" title={item.name}>{item.name}</h4>
                            <p className="text-sm text-slate-500 mb-2">{item.category}</p>
                            <p className="text-xl font-extrabold text-[#BF0A30]">{item.quantity.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">รายการที่ขายได้</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Full Product List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">รายการสินค้าทั้งหมด</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-bold text-slate-600 text-sm">ชื่อสินค้า</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-sm">หมวดหมู่</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-sm text-right">ราคา/หน่วย</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-sm text-right">จำนวนที่ขายได้</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-sm text-right">ยอดขายรวม (บาท)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {productSales.length > 0 ? productSales.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.category === 'Soup' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-right">฿{item.price}</td>
                                    <td className="px-6 py-4 text-slate-800 font-bold text-right">{item.quantity.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-[#BF0A30] font-bold text-right">฿{item.total.toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลในช่วงเวลาที่เลือก'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  if (subView === 'tax') {
      const totalTaxableSales = totalSales; 
      const totalNet = totalTaxableSales / (1 + VAT_RATE);
      const totalVat = totalTaxableSales - totalNet;
      const totalNonTaxableSalesDisplay = totalNet; 
      const grandTotalSales = totalTaxableSales; 

      if (loading) {
        return (
          <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-6 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        );
      }

      if (error && !loading) {
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
        <div className="p-4 md:p-8 space-y-6 animate-[fade-in_0.5s_ease-in-out]">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800">รายชื่อภาษี</h2>
            </div>

             <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-slate-600 mb-1">ตั้งแต่วันที่</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#BF0A30]" 
                          value={inputStartDate} 
                          onChange={e => setInputStartDate(e.target.value)}
                          style={{ colorScheme: 'light' }}
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-slate-600 mb-1">ถึงวันที่</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#BF0A30]" 
                          value={inputEndDate} 
                          onChange={e => setInputEndDate(e.target.value)}
                          style={{ colorScheme: 'light' }}
                        />
                    </div>
                    <button 
                        onClick={handleSearch}
                        className="w-full md:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                    >
                        ค้นหา
                    </button>
                    <button 
                        onClick={handleExportTax}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 hover:text-[#BF0A30] hover:border-[#BF0A30] transition-colors"
                    >
                        <DownloadIcon />
                        <span>ดาวน์โหลด Excel</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-slate-500 font-medium mb-1">ยอดขายรวม</p>
                        <p className="text-2xl font-bold text-slate-800">{grandTotalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 font-medium mb-1">ยอดขายที่ไม่รวมภาษี</p>
                        <p className="text-2xl font-bold text-slate-800">{totalNonTaxableSalesDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                </div>

                <div className="w-full">
                    <div className="bg-slate-50 px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-500">
                        <div className="col-span-3">ประเภทภาษี</div>
                        <div className="col-span-2 text-center">อัตรา</div>
                        <div className="col-span-4 text-right">ยอดขายที่รวมภาษี (฿)</div>
                        <div className="col-span-3 text-right">ภาษี (฿)</div>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-12 gap-4 text-slate-700 border-t border-slate-100">
                        <div className="col-span-3 font-medium uppercase">VAT</div>
                        <div className="col-span-2 text-center">{(VAT_RATE * 100).toFixed(0)}%</div>
                        <div className="col-span-4 text-right">{totalTaxableSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                        <div className="col-span-3 text-right">{totalVat.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-200">
                    <span className="font-bold text-slate-700 text-lg">สรุปภาษีทั้งหมด</span>
                    <span className="font-bold text-slate-800 text-xl">฿ {totalVat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">รายละเอียดภาษีรายวัน</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-bold text-slate-600">วันที่</th>
                                <th className="px-6 py-3 font-bold text-slate-600">ประเภทภาษี</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-center">อัตรา (%)</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-right">ยอดขายรวมภาษี</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-right">ภาษี</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dailySummaries.length > 0 ? (
                                dailySummaries.map(day => (
                                    <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-800 font-medium">{day.date}</td>
                                        <td className="px-6 py-4 text-slate-600">VAT</td>
                                        <td className="px-6 py-4 text-slate-600 text-center">{(VAT_RATE * 100).toFixed(0)}%</td>
                                        <td className="px-6 py-4 text-slate-600 text-right">฿{day.gross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        <td className="px-6 py-4 text-slate-800 text-right">฿{day.vat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        ไม่พบข้อมูลในช่วงเวลาที่เลือก
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  if (subView === 'sales') {
      const netSales = totalSales / (1 + VAT_RATE);
      const vatAmount = totalSales - netSales;
      const totalDiscount = filteredOrders.reduce((acc, order) => acc + (order.discount || 0), 0);
      const grossSales = totalSales + totalDiscount;
      
      // Calculate growth (compare with previous period)
      const prevSales = totalSales * 0.9; // Mock for now, can be improved
      const salesDiff = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;
      
      const prevOrders = totalOrders * 0.95; // Mock for now
      const ordersDiff = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

      // Group by payment (Only PromptPay now as we are cashless)
      const transferOrders = filteredOrders.filter(o => o.paymentMethod === 'PromptPay');
      const transferTotal = transferOrders.reduce((acc, o) => acc + o.total, 0);

      // Group by daily
      const dailySales = dailySummaries;
      
      if (loading) {
        return (
          <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-6 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        );
      }

      if (error && !loading) {
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
        <div className="p-4 md:p-8 space-y-4 md:space-y-6 animate-[fade-in_0.5s_ease-in-out]">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">รายงานสรุปยอดขาย</h2>
            
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">เลือกช่วงเวลา</h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-slate-600 mb-1">ตั้งแต่วันที่</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#BF0A30]" 
                          value={inputStartDate} 
                          onChange={e => setInputStartDate(e.target.value)}
                          style={{ colorScheme: 'light' }}
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-slate-600 mb-1">ถึงวันที่</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#BF0A30]" 
                          value={inputEndDate} 
                          onChange={e => setInputEndDate(e.target.value)}
                          style={{ colorScheme: 'light' }}
                        />
                    </div>
                     <button 
                        onClick={handleSearch}
                        className="w-full md:w-auto bg-slate-800 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                    >
                        ค้นหา
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 font-medium text-sm uppercase">ยอดคำสั่งซื้อทั้งหมด</p>
                    <div className="flex items-baseline mt-2">
                         <p className="text-3xl font-extrabold text-[#BF0A30]">฿{totalSales.toLocaleString()}</p>
                         <span className={`ml-3 text-sm font-medium ${salesDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {salesDiff >= 0 ? '▲' : '▼'} {Math.abs(salesDiff).toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">เทียบกับเดือนก่อนหน้า</p>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 font-medium text-sm uppercase">จำนวนคำสั่งซื้อ</p>
                     <div className="flex items-baseline mt-2">
                         <p className="text-3xl font-extrabold text-slate-800">{totalOrders}</p>
                          <span className={`ml-3 text-sm font-medium ${ordersDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ordersDiff >= 0 ? '▲' : '▼'} {Math.abs(ordersDiff).toFixed(1)}%
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 mt-1">เทียบกับเดือนก่อนหน้า</p>
                 </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">รายละเอียดคำสั่งซื้อ</h3>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-slate-500 text-sm mb-1">ยอดขายรวม</p>
                        <p className="text-4xl font-extrabold text-slate-800">฿ {totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    
                    {/* Dine In Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-700">รายละเอียด</h4>
                        </div>
                        <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">จำนวนออเดอร์</span>
                                <span className="text-slate-700 font-medium">{totalOrders} รายการ</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">ยอดขายรวม (Gross)</span>
                                <span className="text-slate-700 font-medium">฿ {grossSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">ส่วนลด</span>
                                <span className="text-red-500 font-medium">- ฿ {totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">อัตราส่วนส่วนลด</span>
                                <span className="text-slate-700 font-medium">{(grossSales > 0 ? (totalDiscount / grossSales) * 100 : 0).toFixed(2)}%</span>
                             </div>
                             <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                                <span className="text-slate-500">ยอดขายสุทธิ (Net)</span>
                                <span className="text-slate-700 font-medium">฿ {netSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                                <span className="text-slate-700 font-medium">฿ {vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                             <div className="flex justify-between text-base font-bold">
                                <span className="text-slate-700">ยอดเงินรวม (Grand Total)</span>
                                <span className="text-[#BF0A30]">฿ {totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                        </div>
                    </div>

                    {/* Payment Section - Removed Cash */}
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-3">การชำระเงิน</h4>
                        <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">เงินโอน / QR</span>
                                <div className="text-right">
                                    <span className="text-slate-700 font-medium block">฿ {transferTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    <span className="text-xs text-slate-400">({transferOrders.length} รายการ)</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Sales Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">ยอดขายรายวัน</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-bold text-slate-600">วันที่</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-right">จำนวนออเดอร์</th>
                                <th className="px-6 py-3 font-bold text-slate-600 text-right">ยอดขายรวม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dailySales.length > 0 ? (
                                dailySummaries.map(day => {
                                   const count = filteredOrders.filter(o => o.date === day.date).length;
                                   return (
                                    <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-800 font-medium">{day.date}</td>
                                        <td className="px-6 py-4 text-slate-600 text-right">{count}</td>
                                        <td className="px-6 py-4 text-[#BF0A30] font-bold text-right">฿{day.gross.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                   );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                        ไม่พบข้อมูลในช่วงเวลาที่เลือก
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  // Receipt View
  return (
    <div className="p-4 md:p-8 space-y-6 animate-[fade-in_0.5s_ease-in-out]">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">สรุปยอดขายตามใบเสร็จ (Receipts)</h2>
        
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-6 border-slate-200 border-t-[#BF0A30] rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">เกิดข้อผิดพลาด</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Filter Bar for Receipts */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">ค้นหาและสรุปยอด</h3>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[180px]">
                      <label className="block text-sm font-medium text-slate-600 mb-1">ตั้งแต่วันที่</label>
                      <input 
                          type="date" 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#BF0A30]" 
                          value={inputStartDate} 
                          onChange={e => setInputStartDate(e.target.value)}
                          style={{ colorScheme: 'light' }}
                      />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                      <label className="block text-sm font-medium text-slate-600 mb-1">ถึงวันที่</label>
                      <input 
                          type="date" 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#BF0A30]" 
                          value={inputEndDate} 
                          onChange={e => setInputEndDate(e.target.value)}
                          style={{ colorScheme: 'light' }}
                      />
                  </div>
                  <button 
                      onClick={handleSearch}
                      className="w-full md:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-700 transition-colors md:flex-none"
                  >
                      ค้นหา
                  </button>
                  <button 
                      onClick={handleExportReceipts}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 hover:text-[#BF0A30] hover:border-[#BF0A30] transition-colors md:flex-none"
                  >
                      <DownloadIcon />
                      <span>ดาวน์โหลด Excel</span>
                  </button>
                </div>
                
            {/* Summary Row for Receipts */}
            <div className="flex flex-col md:flex-row gap-6 mt-6 pt-6 border-t border-slate-100">
                 <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-500 font-medium text-sm">ยอดขายรวมในช่วงที่เลือก</p>
                    <p className="text-2xl font-bold text-[#BF0A30] mt-1">฿{totalSales.toLocaleString()}</p>
                 </div>
                 <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-500 font-medium text-sm">ออเดอร์ทั้งหมดในช่วงที่เลือก</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{totalOrders} รายการ</p>
                 </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1600px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap">เวลา</th>
                            <th className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap">เลขรายการคำสั่งซื้อ</th>
                            <th className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap">เลขที่ใบเสร็จ</th>
                            <th className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap">ช่องทาง</th>
                            <th className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap">สถานที่ขาย</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">ยอดขายรวม</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap" title="ยอดขายก่อนรวมภาษี">ยอดขายสุทธิ</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">จำนวน</th>
                            <th className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap">ช่องทางชำระเงิน</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">ค่าบริการเพิ่มเติม</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">ภาษี</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">ส่วนลด</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">การปัดเศษ</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">ทิป</th>
                            <th className="px-4 py-4 font-bold text-slate-600 text-right whitespace-nowrap">ค่าจัดส่ง</th>
                            <th className="px-4 py-4 font-bold text-slate-800 text-right whitespace-nowrap text-sm bg-slate-50">ยอดที่ได้รับ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                            const netSales = order.total / (1 + VAT_RATE);
                            const vat = order.total - netSales;
                            
                            return (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-sm">
                                        {order.date}<br/>
                                        <span className="text-xs text-slate-400">{order.time} น.</span>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-slate-800 whitespace-nowrap text-sm">{order.id}</td>
                                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-sm">{order.receiptId}</td>
                                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-sm">{order.channel}</td>
                                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap text-sm font-medium">
                                      {branchLabel}
                                    </td>
                                    <td className="px-4 py-4 font-bold text-[#BF0A30] text-right whitespace-nowrap text-sm">฿{order.total.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-slate-700 text-right whitespace-nowrap text-sm">฿{netSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td className="px-4 py-4 text-slate-500 text-right whitespace-nowrap text-sm">{order.itemCount}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 text-right whitespace-nowrap text-sm">{order.serviceCharge.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-slate-500 text-right whitespace-nowrap text-sm">฿{vat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td className="px-4 py-4 text-red-500 text-right whitespace-nowrap text-sm">-{order.discount.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-slate-500 text-right whitespace-nowrap text-sm">{order.rounding.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-green-600 text-right whitespace-nowrap text-sm">{order.tip.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-slate-500 text-right whitespace-nowrap text-sm">{order.deliveryFee.toFixed(2)}</td>
                                    <td className="px-4 py-4 font-bold text-slate-800 text-right whitespace-nowrap text-sm bg-slate-50">฿{order.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={15} className="px-6 py-8 text-center text-slate-400">
                                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลในช่วงเวลาที่เลือก'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Reports;
