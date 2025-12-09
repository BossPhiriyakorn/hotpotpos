
import React from 'react';
import { useSettings } from '../../store/SettingsContext';

const Header: React.FC = () => {
  const { shop } = useSettings();
  
  return (
    <header className="w-full bg-white p-6 border-b-2 border-slate-100 flex justify-center items-center gap-4">
      {shop.logo && (
        <img src={shop.logo} alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm" />
      )}
      <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">{shop.name}</h1>
    </header>
  );
};

export default Header;
