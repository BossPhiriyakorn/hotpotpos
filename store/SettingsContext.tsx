
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

// Types
export interface ShopSettings {
  name: string;
  logo: string | null; // Data URL or path
  memberQrCode: string | null; // QR Code for member points
  paymentQrCode: string | null; // QR Code for payment (PromptPay, etc.)
  welcomeTitle: string;
  welcomeSubtitle: string;
  tareWeight: number; // น้ำหนักภาชนะ (กรัม) - สำหรับหักลบ
  minWeight: number; // น้ำหนักขั้นต่ำ (กรัม) - จำกัดน้ำหนักขั้นต่ำ
}

export interface AuthSettings {
  adminUser: string;
  adminPass: string;
  kioskUser: string;
  kioskPass: string;
}

export interface LayoutSettings {
  soupGridCols: 2 | 3 | 4;
  showSpiciness: boolean;
  showAddOns: boolean;
  showCookingStyle: boolean;
  showNote: boolean;
}

export interface AccessLog {
  id: number;
  timestamp: string;
  userType: string;
  status: 'success' | 'failed';
  details?: string;
}

interface SettingsContextType {
  shop: ShopSettings;
  auth: AuthSettings;
  layout: LayoutSettings;
  logs: AccessLog[];
  updateShop: (settings: Partial<ShopSettings>) => void;
  updateAuth: (settings: Partial<AuthSettings>) => void;
  updateLayout: (settings: Partial<LayoutSettings>) => void;
  addLog: (log: Omit<AccessLog, 'id' | 'timestamp'>) => void;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SHOP: ShopSettings = {
  name: 'หม่าล่าแซ่อู๋',
  logo: null,
  memberQrCode: null,
  paymentQrCode: null,
  welcomeTitle: 'ยินดีต้อนรับ',
  welcomeSubtitle: 'กดเพื่อเริ่มต้นสั่งอาหาร',
  tareWeight: 250, // Default 250 กรัม
  minWeight: 300, // Default 300 กรัม
};

const DEFAULT_AUTH: AuthSettings = {
  adminUser: 'admin',
  adminPass: 'admin123',
  kioskUser: 'user',
  kioskPass: 'user123',
};

const DEFAULT_LAYOUT: LayoutSettings = {
  soupGridCols: 3, // Default mobile/tablet friendly
  showSpiciness: true,
  showAddOns: true,
  showCookingStyle: true,
  showNote: true,
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [shop, setShop] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('mala_shop_settings');
    return saved ? { ...DEFAULT_SHOP, ...JSON.parse(saved) } : DEFAULT_SHOP;
  });

  const [auth, setAuth] = useState<AuthSettings>(() => {
    const saved = localStorage.getItem('mala_auth_settings');
    return saved ? { ...DEFAULT_AUTH, ...JSON.parse(saved) } : DEFAULT_AUTH;
  });

  const [layout, setLayout] = useState<LayoutSettings>(() => {
    const saved = localStorage.getItem('mala_layout_settings');
    return saved ? { ...DEFAULT_LAYOUT, ...JSON.parse(saved) } : DEFAULT_LAYOUT;
  });

  const [logs, setLogs] = useState<AccessLog[]>(() => {
    const saved = localStorage.getItem('mala_access_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Load settings from database on mount
  useEffect(() => {
    const loadSettingsFromDatabase = async () => {
      try {
        // getSettings is now a public route, so we can call it without token check
        const settings = await apiService.getSettings();
        
        if (settings) {
          // Map database settings to shop settings
          const shopSettings: Partial<ShopSettings> = {
            name: settings.shop_name || shop.name,
            logo: settings.logo || shop.logo,
            memberQrCode: settings.member_qr_code || shop.memberQrCode,
            paymentQrCode: settings.payment_qr_code || shop.paymentQrCode,
            welcomeTitle: settings.welcome_title || shop.welcomeTitle,
            welcomeSubtitle: settings.welcome_subtitle || shop.welcomeSubtitle,
            tareWeight: settings.tare_weight !== undefined ? Number(settings.tare_weight) : shop.tareWeight,
            minWeight: settings.min_weight !== undefined ? Number(settings.min_weight) : shop.minWeight,
          };
          
          const layoutSettings: Partial<LayoutSettings> = {
            soupGridCols: settings.soup_grid_cols || layout.soupGridCols,
            showSpiciness: settings.show_spiciness !== undefined ? settings.show_spiciness : layout.showSpiciness,
            showAddOns: settings.show_addons !== undefined ? settings.show_addons : layout.showAddOns,
            showCookingStyle: settings.show_cooking_style !== undefined ? settings.show_cooking_style : layout.showCookingStyle,
            showNote: settings.show_note !== undefined ? settings.show_note : layout.showNote,
          };

          setShop(prev => ({ ...prev, ...shopSettings }));
          setLayout(prev => ({ ...prev, ...layoutSettings }));
        }
      } catch (error) {
        // Silently fail - use localStorage defaults
        console.log('Could not load settings from database, using localStorage defaults');
      }
    };

    // Initial load
    loadSettingsFromDatabase();

    // Auto-refresh every 2 minutes to keep settings up-to-date
    // This ensures Kiosk always has the latest settings (logo, QR codes, etc.)
    const interval = setInterval(() => {
      loadSettingsFromDatabase();
    }, 120000); // 2 minutes (120 seconds)

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []); // Only run once on mount

  // Persistence Effects
  useEffect(() => { localStorage.setItem('mala_shop_settings', JSON.stringify(shop)); }, [shop]);
  useEffect(() => { localStorage.setItem('mala_auth_settings', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('mala_layout_settings', JSON.stringify(layout)); }, [layout]);
  useEffect(() => { localStorage.setItem('mala_access_logs', JSON.stringify(logs)); }, [logs]);

  // Update Functions
  const updateShop = (updates: Partial<ShopSettings>) => setShop(prev => ({ ...prev, ...updates }));
  const updateAuth = (updates: Partial<AuthSettings>) => setAuth(prev => ({ ...prev, ...updates }));
  const updateLayout = (updates: Partial<LayoutSettings>) => setLayout(prev => ({ ...prev, ...updates }));
  
  const addLog = (logData: Omit<AccessLog, 'id' | 'timestamp'>) => {
    const newLog: AccessLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('th-TH'),
      ...logData
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const refreshSettings = async () => {
    try {
      // getSettings is now a public route, so we can call it without token check
      const settings = await apiService.getSettings();
      
      if (settings) {
        const shopSettings: Partial<ShopSettings> = {
          name: settings.shop_name || shop.name,
          logo: settings.logo || shop.logo,
          memberQrCode: settings.member_qr_code || shop.memberQrCode,
          paymentQrCode: settings.payment_qr_code || shop.paymentQrCode,
          welcomeTitle: settings.welcome_title || shop.welcomeTitle,
          welcomeSubtitle: settings.welcome_subtitle || shop.welcomeSubtitle,
          tareWeight: settings.tare_weight !== undefined ? Number(settings.tare_weight) : shop.tareWeight,
          minWeight: settings.min_weight !== undefined ? Number(settings.min_weight) : shop.minWeight,
        };
        
        const layoutSettings: Partial<LayoutSettings> = {
          soupGridCols: settings.soup_grid_cols || layout.soupGridCols,
          showSpiciness: settings.show_spiciness !== undefined ? settings.show_spiciness : layout.showSpiciness,
          showAddOns: settings.show_addons !== undefined ? settings.show_addons : layout.showAddOns,
          showCookingStyle: settings.show_cooking_style !== undefined ? settings.show_cooking_style : layout.showCookingStyle,
          showNote: settings.show_note !== undefined ? settings.show_note : layout.showNote,
        };

        setShop(prev => ({ ...prev, ...shopSettings }));
        setLayout(prev => ({ ...prev, ...layoutSettings }));
      }
    } catch (error) {
      // Silently fail - use existing localStorage values
      console.log('Failed to refresh settings (using cached values):', error);
    }
  };

  return (
    <SettingsContext.Provider value={{
      shop, auth, layout, logs,
      updateShop, updateAuth, updateLayout, addLog, refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
