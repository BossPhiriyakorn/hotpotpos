
import React from 'react';
import type { Soup } from '../../../types';
import { useSettings } from '../../../store/SettingsContext';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';
// Removed SectionHeader import to let parent handle the translated title

interface SoupSelectionProps {
  soups: Soup[];
  onSelect: (soup: Soup) => void;
  selectedSoup: Soup | null;
}

const SoupSelection: React.FC<SoupSelectionProps> = ({ soups, onSelect, selectedSoup }) => {
  const { layout } = useSettings();
  
  const handleSelectSoup = (soup: Soup) => {
    onSelect(soup);
  };

  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[layout.soupGridCols];

  return (
    <section>
       {/* Removed SectionHeader title="เลือกซุป" */}
       <div className={`grid ${gridClass} gap-x-6 gap-y-16 pt-10 pb-6 px-2`}>
        {soups.map(soup => {
          const isSelected = selectedSoup?.id === soup.id;
          const cardBgColor = soup.isSpecial ? 'bg-[#1e293b]' : 'bg-[#BF0A30]';
          const pillBgColor = soup.isSpecial ? 'bg-slate-600' : 'bg-white/20';
          
          return (
            <div 
              key={soup.id} 
              className="relative cursor-pointer group select-none"
              onClick={() => handleSelectSoup(soup)}
            >
              <div className={`${cardBgColor} rounded-[2rem] shadow-lg text-white flex flex-col pt-16 pb-4 px-4 relative transition-transform duration-200 group-hover:scale-[1.02] h-48 ${isSelected ? 'ring-4 ring-offset-2 ring-[#BF0A30]' : ''}`}>
                
                {soup.isSpecial && (
                  <div className="absolute top-0 right-0 bg-[#FACC15] text-slate-900 text-sm font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-[1.8rem] shadow-sm z-20">
                    พิเศษ
                  </div>
                )}

                <div 
                  className="absolute -top-12 left-2 w-32 h-32 rounded-full bg-slate-100 shadow-md z-10 p-1"
                >
                  <div 
                      className="w-full h-full rounded-full bg-cover bg-center" 
                      style={{ backgroundImage: `url(${resolveMediaUrl(soup.image)})` }} 
                  />
                </div>

                <div className="flex-grow w-full flex items-center justify-center px-1 relative z-10 mt-2">
                  <h4 className="text-xl md:text-2xl font-bold leading-tight drop-shadow-md text-center break-words">
                    {soup.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between w-full gap-3 mt-auto relative z-10">
                   <div className={`${pillBgColor} rounded-full px-4 py-2 flex-grow flex justify-center items-center backdrop-blur-sm`}>
                      <span className="text-xs font-medium text-white/95 whitespace-nowrap">
                        {soup.isSpicy ? 'เลือกระดับความเผ็ด' : 'ไม่เผ็ด'}
                      </span>
                   </div>

                   <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-full text-slate-900 shadow-sm transition-transform group-hover:scale-110">
                      {isSelected ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                   </div>
                </div>

              </div>
            </div>
          );
        })}
       </div>
    </section>
  );
};

export default SoupSelection;