import React, { ReactNode } from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`bg-[#BF0A30] text-white font-bold text-2xl py-4 px-10 rounded-xl shadow-md transition-all duration-200 ease-in-out transform hover:bg-[#ab092a] active:bg-[#960825] hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;