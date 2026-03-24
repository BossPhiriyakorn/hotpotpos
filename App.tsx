
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppRole } from './types';
import { MenuProvider } from './store/MenuContext';
import { SettingsProvider } from './store/SettingsContext';
import { LanguageProvider } from './store/LanguageContext';
import apiService from './services/api';

import LoginScreen from './modules/auth/LoginScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import KioskApp from './modules/kiosk/KioskApp';
import KitchenScreen from './modules/kitchen/KitchenScreen';
import QueueDisplayScreen from './modules/queue/QueueDisplayScreen';
import AdminScreen from './modules/admin/AdminScreen';
import LineConnectScreen from './modules/line/LineConnectScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<{ type: 'standard' | 'admin' } | null>(null);
  const [role, setRole] = useState<AppRole>(AppRole.None);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiService.isAuthenticated()) {
        if (!cancelled) setAuthChecked(true);
        return;
      }
      try {
        const me = await apiService.getCurrentUser();
        if (cancelled) return;
        const userType = me.userType === 'admin' ? 'admin' : 'standard';
        setUser({ type: userType });
        localStorage.setItem(
          'auth_user',
          JSON.stringify({
            id: me.id,
            username: me.username,
            userType: me.userType,
            branchId: me.branchId,
            branchName: me.branchName,
            branchCode: me.branchCode,
          })
        );
      } catch {
        if (!cancelled) apiService.logout();
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (userType: 'standard' | 'admin') => {
    setUser({ type: userType });
    if (userType === 'admin') {
      setRole(AppRole.Admin);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    setRole(AppRole.None);
  };
  
  const resetToRoleSelection = () => {
    setRole(AppRole.None);
  };

  const Content = () => {
    if (!authChecked) {
      return (
        <div className="w-screen h-screen bg-[#BF0A30] flex items-center justify-center">
          <p className="text-white text-lg font-medium">กำลังโหลด...</p>
        </div>
      );
    }
    if (!user) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    // Admin user journey
    if (user.type === 'admin') {
      return <AdminScreen onBack={handleLogout} />;
    }

    // Standard user journey
    switch (role) {
      case AppRole.None:
        return (
          <RoleSelectionScreen
            onSelectRole={setRole}
            availableRoles={[
              AppRole.Kiosk,
              AppRole.Kitchen,
              AppRole.QueueDisplay,
            ]}
          />
        );

      case AppRole.Kiosk:
        return <KioskApp key="kiosk" />;

      case AppRole.Kitchen:
        return <KitchenScreen onBack={resetToRoleSelection} />;

      case AppRole.QueueDisplay:
        return <QueueDisplayScreen onBack={resetToRoleSelection} />;
        
      default:
        return (
          <RoleSelectionScreen
            onSelectRole={setRole}
            availableRoles={[
              AppRole.Kiosk,
              AppRole.Kitchen,
              AppRole.QueueDisplay,
            ]}
          />
        );
    }
  };

  return (
    <BrowserRouter>
      <SettingsProvider>
        <LanguageProvider>
          <MenuProvider>
            <Routes>
              {/* LINE Connect Route - Public route for QR Code scanning */}
              <Route path="/line/connect" element={<LineConnectScreen />} />
              {/* Root and all other routes */}
              <Route path="/" element={<Content />} />
              <Route path="*" element={<Content />} />
            </Routes>
          </MenuProvider>
        </LanguageProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
};

export default App;