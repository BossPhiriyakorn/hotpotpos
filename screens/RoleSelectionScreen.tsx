
import React from 'react';
import { AppRole } from '../types';

interface RoleSelectionScreenProps {
  onSelectRole: (role: AppRole) => void;
  availableRoles: AppRole[];
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole, availableRoles }) => {
  
  const getRoleConfig = (role: AppRole) => {
    switch (role) {
      case AppRole.Kiosk:
        return {
          label: 'KIOSK',
          // Storefront / Kiosk Icon
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
               <path d="M12 2C10.34 2 9 3.34 9 5V7H5C3.34 7 2 8.34 2 10V14C2 15.1 2.9 16 4 16H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V16H20C21.1 16 22 15.1 22 14V10C22 8.34 20.66 7 19 7H15V5C15 3.34 13.66 2 12 2ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V7H11V5ZM5 9H19C19.55 9 20 9.45 20 10V14H19V20H17V16H7V20H5V14H4V10C4 9.45 4.45 9 5 9ZM7 11H9V13H7V11ZM11 11H13V13H11V11ZM15 11H17V13H15V11Z"/>
            </svg>
          )
        };
      case AppRole.Kitchen:
        return {
          label: 'KITCHEN',
          // Chef Hat Icon
          icon: (
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM9 20H15V22H9V20ZM12 4C13.66 4 15 5.34 15 7H9C9 5.34 10.34 4 12 4Z"/>
             </svg>
          )
        };
      case AppRole.QueueDisplay:
        return {
          label: 'QUEUE',
          // People Group Icon
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
               <path d="M16 11C17.66 11 19 9.66 19 8C19 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"/>
            </svg>
          )
        };
      default:
        return null;
    }
  };

  // Only display roles that have configuration
  const displayRoles = availableRoles.filter(role => getRoleConfig(role) !== null);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-[fade-in_0.5s_ease-in-out]">
      <h1 className="text-3xl md:text-5xl font-bold text-black mb-16 text-center tracking-tight">
        ยินดีต้อนรับสู่ระบบจัดการร้าน
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {displayRoles.map((role) => {
          const config = getRoleConfig(role);
          if (!config) return null;
          
          return (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              className="bg-white border border-slate-400 rounded-lg p-10 flex flex-col items-center justify-center gap-6 hover:border-[#BF0A30] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group w-full aspect-[1.4/1]"
            >
              <div className="text-[#BF0A30] w-20 h-20 md:w-24 md:h-24 group-hover:scale-110 transition-transform duration-300">
                 {config.icon}
              </div>
              <span className="text-3xl md:text-5xl font-extrabold text-black uppercase tracking-tight">
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
