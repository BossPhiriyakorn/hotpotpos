
import React from 'react';
import { useSettings } from '../../../store/SettingsContext';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const { shop } = useSettings();

  return (
    <div className="w-full h-full relative bg-white animate-[fade-in_1s_ease-in-out] overflow-y-auto">
      <div className="absolute inset-0 z-0 fixed">
         {/* Background pattern or image could go here */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-50 via-white to-white opacity-80" />
      </div>

      <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto p-8">
        <div className="mb-16 flex flex-col items-center">
          {shop.logo && (
            <div className="w-64 h-64 mb-10 rounded-full shadow-2xl overflow-hidden border-8 border-white bg-white flex-shrink-0">
               <img src={resolveMediaUrl(shop.logo)} alt="Shop Logo" className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-4xl font-semibold text-[#BF0A30] mb-2 break-words max-w-full">{shop.name}</p>
          <h1 className="text-8xl lg:text-9xl font-extrabold text-slate-800 tracking-tight leading-none mb-6 break-words max-w-full">
            {shop.welcomeTitle || 'ยินดีต้อนรับ'}
          </h1>
          <p className="text-3xl text-slate-500 break-words max-w-full">{shop.welcomeSubtitle || 'กดเพื่อเริ่มต้นสั่งอาหาร'}</p>
        </div>

        <button
          onClick={onStart}
          className="bg-[#BF0A30] text-white font-bold text-4xl py-8 px-24 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 hover:bg-[#a00828] animate-bounce-slow whitespace-nowrap"
          aria-label="เริ่มต้นสั่งอาหาร"
        >
          เริ่มต้นสั่งอาหาร
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
