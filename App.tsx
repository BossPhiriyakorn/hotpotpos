
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppRole } from './types';
import { MenuProvider } from './store/MenuContext';
import { SettingsProvider } from './store/SettingsContext';
import { LanguageProvider } from './store/LanguageContext';

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

  const handleLoginSuccess = (userType: 'standard' | 'admin') => {
    setUser({ type: userType });
    if (userType === 'admin') {
      setRole(AppRole.Admin);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRole(AppRole.None);
  };
  
  const resetToRoleSelection = () => {
    setRole(AppRole.None);
  };

  const Content = () => {
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