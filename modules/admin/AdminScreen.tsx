
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import POSManagement from './components/POSManagement';
import Reports from './components/Reports';
import Settings from './components/Settings';
// User/Branch management hidden (single-branch mode)

// --- Icons (Solid Variants for Bolder Look) ---
const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
    </svg>
);

const MenuIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
     </svg>
);

const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- Main Admin Screen Layout ---
interface AdminScreenProps {
    onBack: () => void;
}

type AdminView = 'dashboard' | 'pos' | 'report_sales' | 'report_receipts' | 'report_products' | 'report_tax' | 'settings';

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [reportsOpen, setReportsOpen] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (view: AdminView) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  // Logic: Selected = Red BG, White Text, Black Icon
  // Logic: Unselected = Transparent BG, Black Text, Black Icon
  const getMenuClass = (isActive: boolean) => {
    return isActive 
        ? 'bg-[#BF0A30] text-white shadow-md' 
        : 'text-black hover:bg-slate-50'; // Unselected text is black/slate-900
  };

  // Logic: Icons are always black as per request "Icon สีดำ" (for both states implicitly or explicitly)
  // But typically "Selected" usually implies specific styling. 
  // Based on the prompt: "เมื่อเลือกเมนูไหน... Icon สีดำ" (When selected... Icon Black).
  // "เมนูไหนไม่ได้เลือกเป็นตัวหนังสือสีดำตามปกติ" (Unselected... Text Black).
  // I will make icons black in ALL states to match the visual weight of the image provided.
  const iconClass = "text-black";

  const getSubMenuClass = (isActive: boolean) => {
      return isActive
        ? 'bg-[#BF0A30] text-white font-semibold shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50';
  }

  return (
    <div className="w-screen h-screen flex bg-slate-100 overflow-hidden font-sans text-slate-800">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden animate-[fade-in_0.2s_ease-out]"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* 1. Sidebar */}
      <aside className={`
          bg-white flex flex-col flex-shrink-0 border-r border-slate-200
          fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <div className="p-8 pb-4 flex justify-between items-center bg-white">
            <div>
                <h1 className="text-4xl font-extrabold text-[#BF0A30] tracking-tight leading-none">Admin</h1>
                {/* <p className="text-xs text-slate-400 mt-1">Management System v1.1</p> */}
            </div>
            {/* Mobile Close Button */}
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-600"
            >
                <CloseIcon />
            </button>
         </div>

         <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-0 space-y-2">
            <div className="px-4">
                <button 
                    onClick={() => handleNavigate('dashboard')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors border border-transparent ${getMenuClass(currentView === 'dashboard')}`}
                >
                    <div className={iconClass}>
                        <DashboardIcon />
                    </div>
                    <span className="ml-4 font-semibold text-lg">แดรชบอร์ด</span>
                </button>
            </div>

            <div className="px-4">
                <button 
                    onClick={() => handleNavigate('pos')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors border border-transparent ${getMenuClass(currentView === 'pos')}`}
                >
                    <div className={iconClass}>
                        <MenuIcon />
                    </div>
                    <span className="ml-4 font-semibold text-lg">จัดการเมนู POS</span>
                </button>
            </div>

            {/* Reports Group */}
            <div className="px-4">
                 <button 
                    onClick={() => setReportsOpen(!reportsOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors border border-transparent text-black hover:bg-slate-50`}
                >
                    <div className="flex items-center">
                        <div className={iconClass}>
                             <ReportIcon />
                        </div>
                        <span className="ml-4 font-semibold text-lg">รายงาน</span>
                    </div>
                    <div className={`transform transition-transform text-slate-400 ${reportsOpen ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon />
                    </div>
                </button>
                {reportsOpen && (
                    <div className="pl-6 pr-2 space-y-1 mt-1 animate-[slide-down_0.2s_ease-out]">
                        <button 
                            onClick={() => handleNavigate('report_sales')}
                            className={`w-full text-left px-4 pl-10 py-2.5 text-base rounded-md transition-colors ${getSubMenuClass(currentView === 'report_sales')}`}
                        >
                            สรุปยอดขาย
                        </button>
                         <button 
                            onClick={() => handleNavigate('report_receipts')}
                            className={`w-full text-left px-4 pl-10 py-2.5 text-base rounded-md transition-colors ${getSubMenuClass(currentView === 'report_receipts')}`}
                        >
                            สรุปยอดขายตามใบเสร็จ
                        </button>
                         <button 
                            onClick={() => handleNavigate('report_products')}
                            className={`w-full text-left px-4 pl-10 py-2.5 text-base rounded-md transition-colors ${getSubMenuClass(currentView === 'report_products')}`}
                        >
                            สรุปยอดตามสินค้า
                        </button>
                         <button 
                            onClick={() => handleNavigate('report_tax')}
                            className={`w-full text-left px-4 pl-10 py-2.5 text-base rounded-md transition-colors ${getSubMenuClass(currentView === 'report_tax')}`}
                        >
                            รายงานภาษี
                        </button>
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="px-4 pt-2">
                <button 
                    onClick={() => handleNavigate('settings')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors border border-transparent ${getMenuClass(currentView === 'settings')}`}
                >
                    <div className={iconClass}>
                        <SettingsIcon />
                    </div>
                    <span className="ml-4 font-semibold text-lg">ตั้งค่าระบบ</span>
                </button>
            </div>
         </nav>

         <div className="p-6 border-t border-slate-100 bg-white">
             <button 
                onClick={onBack}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-slate-200 rounded-xl text-base font-bold text-slate-600 hover:bg-white hover:text-[#BF0A30] hover:border-[#BF0A30] transition-colors shadow-sm uppercase tracking-wide"
             >
                ออกจากระบบ
             </button>
         </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Header mobile simplified */}
         <header className="bg-white border-b border-slate-200 p-4 shadow-sm flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="text-slate-700">
                    <HamburgerIcon />
                </button>
                <span className="font-bold text-xl text-[#BF0A30]">Admin</span>
            </div>
            <button onClick={onBack} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                Logout
            </button>
         </header>

         <div className="flex-1 overflow-y-auto">
             {currentView === 'dashboard' && <Dashboard />}
             {currentView === 'pos' && <POSManagement />}
             {currentView === 'report_sales' && <Reports subView="sales" />}
             {currentView === 'report_receipts' && <Reports subView="receipts" />}
             {currentView === 'report_products' && <Reports subView="products" />}
             {currentView === 'report_tax' && <Reports subView="tax" />}
             {currentView === 'settings' && <Settings />}
         </div>
      </main>

    </div>
  );
};

export default AdminScreen;
