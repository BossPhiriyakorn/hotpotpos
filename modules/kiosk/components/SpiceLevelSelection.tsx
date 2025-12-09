
import React from 'react';
import type { SpiceLevel } from '../../../types';

interface SpiceLevelSelectionProps {
  levels: SpiceLevel[];
  selectedLevel: SpiceLevel | null;
  onSelect: (level: SpiceLevel) => void;
}

const SpiceLevelSelection: React.FC<SpiceLevelSelectionProps> = ({ levels, selectedLevel, onSelect }) => {
  return (
    <section>
      {/* Header handled by parent */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {levels.map(level => (
          <button
            key={level.id}
            onClick={() => onSelect(level)}
            className={`w-full p-4 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-200 min-h-[5rem] ${
              selectedLevel?.id === level.id
                ? 'bg-[#BF0A30] text-white border-[#BF0A30] shadow-md transform scale-105'
                : 'bg-white text-slate-700 border-slate-300 hover:border-[#BF0A30]'
            }`}
          >
            <span className="text-xl font-bold">{level.name}</span>
            {level.price && level.price > 0 && (
                <span className={`text-sm mt-1 font-medium ${selectedLevel?.id === level.id ? 'text-red-100' : 'text-[#BF0A30]'}`}>
                    +{level.price} บาท
                </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

export default SpiceLevelSelection;