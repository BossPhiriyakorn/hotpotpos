import React from 'react';
import SectionHeader from '../../../components/ui/SectionHeader';

interface TableSelectionProps {
  totalTables: number;
  selectedTable: number | null;
  onSelect: (tableNumber: number) => void;
}

const TableSelection: React.FC<TableSelectionProps> = ({ totalTables, selectedTable, onSelect }) => {
  const tables = Array.from({ length: totalTables }, (_, i) => i + 1);

  return (
    <section>
      <SectionHeader title="เลือกโต๊ะ" />
      <div className="grid grid-cols-8 gap-4 py-4">
        {tables.map(tableNumber => (
          <button
            key={tableNumber}
            onClick={() => onSelect(tableNumber)}
            className={`w-full aspect-square rounded-xl text-3xl font-bold border-2 transition-all duration-200 flex items-center justify-center ${
              selectedTable === tableNumber
                ? 'bg-[#BF0A30] text-white border-[#BF0A30] shadow-md scale-105'
                : 'bg-white text-slate-700 border-slate-300 hover:border-[#BF0A30]'
            }`}
          >
            {tableNumber}
          </button>
        ))}
      </div>
    </section>
  );
};

export default TableSelection;