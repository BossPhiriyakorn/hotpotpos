import React, { ReactNode } from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`bg-white text-slate-700 font-bold text-2xl py-4 px-10 rounded-xl border-2 border-slate-300 shadow-sm transition-all duration-200 ease-in-out transform hover:border-[#BF0A30] hover:text-[#BF0A30] hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:transform-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;