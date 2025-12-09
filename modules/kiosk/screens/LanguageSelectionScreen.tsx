import React from 'react';
import { useLanguage, Language } from '../../../store/LanguageContext';

interface LanguageSelectionScreenProps {
  onNext: () => void;
}

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({ onNext }) => {
  const { setLanguage, t } = useLanguage();

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    onNext();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white p-8 animate-[fade-in_0.5s_ease-in-out]">
      <h1 className="text-5xl font-extrabold text-slate-800 mb-12">{t('lang.select')}</h1>
      
      <div className="flex flex-col gap-6 w-full max-w-md">
        <button
          onClick={() => handleSelectLanguage('th')}
          className="bg-white border-2 border-slate-200 hover:border-[#BF0A30] hover:bg-red-50 text-slate-800 font-bold text-3xl py-8 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group"
        >
          <span className="text-4xl">🇹🇭</span>
          <span className="group-hover:text-[#BF0A30]">ภาษาไทย</span>
        </button>

        <button
          onClick={() => handleSelectLanguage('en')}
          className="bg-white border-2 border-slate-200 hover:border-[#BF0A30] hover:bg-red-50 text-slate-800 font-bold text-3xl py-8 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group"
        >
          <span className="text-4xl">🇬🇧</span>
          <span className="group-hover:text-[#BF0A30]">English</span>
        </button>

        <button
          onClick={() => handleSelectLanguage('cn')}
          className="bg-white border-2 border-slate-200 hover:border-[#BF0A30] hover:bg-red-50 text-slate-800 font-bold text-3xl py-8 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group"
        >
          <span className="text-4xl">🇨🇳</span>
          <span className="group-hover:text-[#BF0A30]">中文</span>
        </button>
      </div>
    </div>
  );
};

export default LanguageSelectionScreen;
