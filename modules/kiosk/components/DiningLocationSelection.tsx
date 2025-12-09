import React from 'react';
import type { DiningLocationOption } from '../../../types';
import SectionHeader from '../../../components/ui/SectionHeader';

interface DiningLocationSelectionProps {
  locations: DiningLocationOption[];
  selectedLocation: DiningLocationOption | null;
  onSelect: (location: DiningLocationOption) => void;
}

const DiningLocationSelection: React.FC<DiningLocationSelectionProps> = ({ locations, selectedLocation, onSelect }) => {
  return (
    <section>
      <SectionHeader title="สถานที่ทาน" />
      <div className="grid grid-cols-2 gap-4">
        {locations.map(location => (
          <button
            key={location.id}
            onClick={() => onSelect(location)}
            className={`w-full p-4 rounded-xl text-xl font-bold border-2 transition-all duration-200 ${
              selectedLocation?.id === location.id
                ? 'bg-[#BF0A30] text-white border-[#BF0A30] shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:border-[#BF0A30]'
            }`}
          >
            {location.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default DiningLocationSelection;