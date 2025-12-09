
import React from 'react';
import type { CookingStyleOption } from '../../../types';

interface CookingStyleSelectionProps {
  options: CookingStyleOption[];
  selectedStyle: CookingStyleOption | null;
  onSelect: (style: CookingStyleOption) => void;
}

const CookingStyleSelection: React.FC<CookingStyleSelectionProps> = ({ options, selectedStyle, onSelect }) => {
  return (
    <section>
      {/* Header handled by parent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-xl text-xl font-bold border-2 transition-all duration-200 min-h-[4rem] ${
              selectedStyle?.id === option.id
                ? 'bg-white text-[#BF0A30] border-[#BF0A30] shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:border-[#BF0A30] hover:text-[#BF0A30]'
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default CookingStyleSelection;