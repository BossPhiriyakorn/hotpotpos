
import React, { useState, useCallback, useMemo } from 'react';
import { AppScreen, Order } from '../../types';
import { PRICE_PER_100G, VAT_RATE, COOKING_STYLES } from '../../constants';
import { useScale } from '../../hooks/useScale';

import WelcomeScreen from './screens/WelcomeScreen';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import WeighingScreen from './screens/WeighingScreen';
import CustomizationScreen from './screens/CustomizationScreen';
import SummaryScreen from './screens/SummaryScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';
import MemberScanScreen from './screens/MemberScanScreen';
import LineNotificationScreen from './screens/LineNotificationScreen';
import ProgressBar from './components/ProgressBar';
import Header from '../../components/ui/Header';

const initialOrderState: Order = {
  id: undefined,
  weight: 0,
  pricePer100g: PRICE_PER_100G,
  basePrice: 0,
  spiceLevel: null,
  soup: null,
  addOns: [],
  totalPrice: 0,
  vat: 0,
  queueNumber: 0,
  diningLocation: null,
  tableNumber: null,
  cookingStyle: COOKING_STYLES[0], // Default to ReadyToEat
  note: '',
};

const KioskApp: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.Welcome);
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  // Move useScale here to maintain connection state across screen changes
  const { weightKg, isConnected, connect } = useScale();

  const updateOrder = useCallback((updates: Partial<Order>) => {
    setOrder(prevOrder => {
      const newOrder = { ...prevOrder, ...updates };
      
      const addOnsPrice = newOrder.addOns.reduce((sum, item) => sum + item.price, 0);
      const spicePrice = newOrder.spiceLevel?.price || 0;
      const subtotal = newOrder.basePrice + addOnsPrice + spicePrice;
      const vat = subtotal * VAT_RATE;
      const totalPrice = subtotal + vat;

      return {
        ...newOrder,
        totalPrice,
        vat
      };
    });
  }, []);

  const navigateTo = useCallback((newScreen: AppScreen) => {
    setDirection(newScreen > screen ? 'forward' : 'backward');
    setScreen(newScreen);
  }, [screen]);

  const resetOrder = useCallback(() => {
    setOrder(initialOrderState);
    navigateTo(AppScreen.Welcome);
  }, [navigateTo]);
  
  const screenContent = useMemo(() => {
    switch (screen) {
      case AppScreen.Welcome:
        return <WelcomeScreen onStart={() => navigateTo(AppScreen.LanguageSelection)} />;
      case AppScreen.LanguageSelection:
        return <LanguageSelectionScreen onNext={() => navigateTo(AppScreen.Weighing)} />;
      case AppScreen.Weighing:
        return <WeighingScreen 
          order={order} 
          setOrder={updateOrder} 
          onNext={() => navigateTo(AppScreen.Customize)}
          weightKg={weightKg}
          isConnected={isConnected}
          connect={connect}
        />;
      case AppScreen.Customize:
        return <CustomizationScreen order={order} setOrder={updateOrder} onBack={() => navigateTo(AppScreen.Weighing)} onNext={() => navigateTo(AppScreen.Summary)} />;
      case AppScreen.Summary:
        return <SummaryScreen 
            order={order} 
            onBack={() => navigateTo(AppScreen.Customize)} 
            onPaymentSuccess={(queueNumber, orderId) => {
                if (orderId) {
                  updateOrder({ queueNumber, id: orderId });
                } else {
                  updateOrder({ queueNumber });
                }
                navigateTo(AppScreen.PaymentSuccess);
            }} 
        />;
      case AppScreen.PaymentSuccess:
        return <PaymentSuccessScreen order={order} onNext={() => navigateTo(AppScreen.MemberScan)} />;
      case AppScreen.MemberScan:
        return <MemberScanScreen 
          order={order}
          onNoNotification={resetOrder}
          onRequestNotification={() => navigateTo(AppScreen.LineNotification)}
        />;
      case AppScreen.LineNotification:
        return <LineNotificationScreen 
          order={order}
          onBack={() => navigateTo(AppScreen.MemberScan)}
          onFinish={resetOrder}
        />;
      default:
        return <WelcomeScreen onStart={() => navigateTo(AppScreen.LanguageSelection)} />;
    }
  }, [screen, order, navigateTo, resetOrder, updateOrder, weightKg, isConnected, connect]);

  const animationClass = direction === 'forward' ? 'animate-[slide-in-right_0.5s_ease-in-out]' : 'animate-[slide-in-left_0.5s_ease-in-out]';

  return (
    <div className="bg-slate-50 w-full h-screen overflow-hidden flex flex-col relative">
        {screen !== AppScreen.Welcome && screen !== AppScreen.LanguageSelection && (
          <Header />
        )}
        {screen > AppScreen.LanguageSelection && (
          <ProgressBar currentStep={screen} />
        )}
        {/* Main Content Area - Fixed Flex Grow */}
        <main key={screen} className={`flex-1 relative overflow-hidden flex flex-col bg-white ${animationClass}`}>
          {screenContent}
        </main>
    </div>
  );
};

export default KioskApp;