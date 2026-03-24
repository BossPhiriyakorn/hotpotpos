
import React from 'react';
import type { Item } from '../../../types';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';

interface AddOnSelectionProps {
  addOns: Item[];
  selectedAddOns: Item[];
  onAdd: (addOn: Item) => void;
  onRemove: (addOn: Item) => void;
}

const AddOnSelection: React.FC<AddOnSelectionProps> = ({ addOns, selectedAddOns, onAdd, onRemove }) => {
  return (
    <section>
      {/* Header handled by parent */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16 pt-12 pb-6 px-2">
        {addOns.map(addOn => {
          const quantity = selectedAddOns.filter(a => a.id === addOn.id).length;
          const isSelected = quantity > 0;
          
          return (
            <div key={addOn.id} className="relative group select-none mt-2">
              <div className={`bg-[#BF0A30] rounded-[2rem] shadow-lg text-white flex flex-col pt-16 pb-4 px-4 relative transition-transform duration-200 h-64 group-hover:scale-[1.02] ${isSelected ? 'ring-4 ring-offset-2 ring-[#BF0A30]' : ''}`}>
                
                {/* Special Badge */}
                {addOn.isSpecial && (
                   <div className="absolute top-0 right-0 bg-[#FACC15] text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-[1.8rem] shadow-sm z-20">
                     พิเศษ
                   </div>
                 )}

                {/* Floating Image - Aligned Left */}
                <div className="absolute -top-12 left-4 w-32 h-32 rounded-full bg-white shadow-md z-10 p-1 flex items-center justify-center">
                   <img src={resolveMediaUrl(addOn.image)} alt={addOn.name} className="w-full h-full object-cover rounded-full bg-slate-100" />
                </div>
                
                {/* Content */}
                <div className="flex-grow w-full flex flex-col items-center text-center mt-4 space-y-1">
                   <h4 className="text-xl font-bold leading-tight break-words line-clamp-2">{addOn.name}</h4>
                    {addOn.description && (
                       <p className="text-xs text-red-100 line-clamp-2 px-2 leading-tight">{addOn.description}</p>
                     )}
                   <p className="text-lg font-bold text-red-50 mt-auto pb-1">+{addOn.price.toFixed(0)} บาท</p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 w-full mt-auto relative z-10">
                   <button 
                       onClick={() => onRemove(addOn)} 
                       disabled={quantity === 0} 
                       className="w-10 h-10 rounded-full bg-white/20 text-white text-2xl font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/30 backdrop-blur-sm"
                   >
                       -
                   </button>
                   <span className="text-3xl font-bold text-white tabular-nums min-w-[1.5rem] text-center">{quantity}</span>
                   <button 
                       onClick={() => onAdd(addOn)} 
                       className="w-10 h-10 rounded-full bg-white text-[#BF0A30] text-2xl font-bold flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                   >
                       +
                   </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AddOnSelection;
