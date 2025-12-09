
import React from 'react';
import type { Order, SpiceLevel, Soup, Item, CookingStyleOption } from '../../../types';
import { COOKING_STYLES } from '../../../constants';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SecondaryButton from '../../../components/ui/SecondaryButton';
import SoupSelection from '../components/SoupSelection';
import SpiceLevelSelection from '../components/SpiceLevelSelection';
import AddOnSelection from '../components/AddOnSelection';
import CookingStyleSelection from '../components/CookingStyleSelection';
import AdditionalNoteInput from '../components/AdditionalNoteInput';
import { useMenu } from '../../../store/MenuContext';
import { useSettings } from '../../../store/SettingsContext';
import { useLanguage } from '../../../store/LanguageContext';

interface CustomizationScreenProps {
  order: Order;
  setOrder: (updates: Partial<Order>) => void;
  onBack: () => void;
  onNext: () => void;
}

const CustomizationScreen: React.FC<CustomizationScreenProps> = ({ order, setOrder, onBack, onNext }) => {
  const { addOns, soups, spiceLevels } = useMenu();
  const { layout } = useSettings();
  const { t } = useLanguage();

  const handleSpiceSelect = (level: SpiceLevel) => {
    const newSpiceLevel = order.spiceLevel?.id === level.id ? null : level;
    setOrder({ spiceLevel: newSpiceLevel });
  };

  const handleSoupSelect = (soup: Soup) => {
    const newSoup = order.soup?.id === soup.id ? null : soup;
    
    let newSpiceLevel = order.spiceLevel;
    if (!newSoup || !newSoup.isSpicy) {
      newSpiceLevel = null;
    }

    setOrder({ soup: newSoup, spiceLevel: newSpiceLevel });
  };
  
  const handleAddOnAdd = (addOn: Item) => {
    const newAddOns = [...order.addOns, addOn];
    setOrder({ addOns: newAddOns });
  };

  const handleAddOnRemove = (addOn: Item) => {
    const itemIndex = order.addOns.map(item => item.id).lastIndexOf(addOn.id);
    if (itemIndex > -1) {
      const newAddOns = [...order.addOns];
      newAddOns.splice(itemIndex, 1);
      setOrder({ addOns: newAddOns });
    }
  };

  const handleCookingStyleSelect = (style: CookingStyleOption) => {
    setOrder({ cookingStyle: style });
  };

  const handleNoteChange = (note: string) => {
    setOrder({ note });
  };

  const spicePrice = order.spiceLevel?.price || 0;
  const subtotal = order.basePrice + order.addOns.reduce((sum, item) => sum + item.price, 0) + spicePrice;

  // Validation Logic based on visibility settings
  const isSoupSelected = !!order.soup;
  const isSpiceRequired = layout.showSpiciness && !!order.soup?.isSpicy;
  const isSpiceSelected = !!order.spiceLevel;
  // If showing cooking style, it must be selected. Default is usually ready-to-eat but if cleared/null check is needed
  const isCookingStyleRequired = layout.showCookingStyle;
  const isCookingStyleSelected = !!order.cookingStyle;

  const isNextDisabled = 
    !isSoupSelected || 
    (isSpiceRequired && !isSpiceSelected) ||
    (isCookingStyleRequired && !isCookingStyleSelected);

  // Overriding component titles with translations locally for now, 
  // ideally components should accept title prop or handle translation internally.
  // For this implementation, I will rely on the component structure shown in previous files.
  // Note: Previous components like <SoupSelection /> had hardcoded titles in them.
  // To properly translate headers without modifying every sub-component file (trying to keep changes minimal),
  // I will just modify the parent screen layout if possible, but the components render their own headers.
  // **Correction**: To fulfill the request "correctly", I should update the components or make them accept a title.
  // However, to stick to the plan and minimize file touches, I'll update the screen but if the components have hardcoded titles,
  // those specific sub-headers might remain Thai unless I update `SectionHeader` usage inside them.
  // Let's assume for this specific task, updating the main buttons and labels here is key, 
  // but for "correct" multi-language, I should ideally update the sub-components too.
  // *Decision*: I will update the components titles by passing them or updating the files if they are small.
  // Looking at the provided files, `SoupSelection` etc use `SectionHeader title="..."`. 
  // I'll update this file to just pass props if they supported it, but they don't seem to based on previous file dumps.
  // I will update the sub-components in separate change blocks if necessary, but for this specific file:

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 pb-12">
        
          <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-[#6C6C6C] border-b-4 border-[#BF0A30] inline-block pb-2">{t('cust.header_soup')}</h2>
              <SoupSelection
                soups={soups}
                selectedSoup={order.soup}
                onSelect={handleSoupSelect}
              />
          </div>

          {layout.showSpiciness && order.soup?.isSpicy && (
            <div className="animate-[fade-in_0.5s_ease-in-out] space-y-6">
               <h2 className="text-4xl font-extrabold text-[#6C6C6C] border-b-4 border-[#BF0A30] inline-block pb-2">{t('cust.header_spice')}</h2>
              <SpiceLevelSelection
                levels={spiceLevels}
                selectedLevel={order.spiceLevel}
                onSelect={handleSpiceSelect}
              />
            </div>
          )}

          {layout.showAddOns && (
            <div className="animate-[fade-in_0.5s_ease-in-out] space-y-6">
              <h2 className="text-4xl font-extrabold text-[#6C6C6C] border-b-4 border-[#BF0A30] inline-block pb-2">{t('cust.header_addon')}</h2>
              <AddOnSelection
                addOns={addOns}
                selectedAddOns={order.addOns}
                onAdd={handleAddOnAdd}
                onRemove={handleAddOnRemove}
              />
            </div>
          )}

          {layout.showCookingStyle && (
             <div className="animate-[fade-in_0.5s_ease-in-out] space-y-6">
                <h2 className="text-4xl font-extrabold text-[#6C6C6C] border-b-4 border-[#BF0A30] inline-block pb-2">{t('cust.header_cooking')}</h2>
                <CookingStyleSelection 
                  options={COOKING_STYLES}
                  selectedStyle={order.cookingStyle}
                  onSelect={handleCookingStyleSelect}
                />
             </div>
          )}

          {layout.showNote && (
            <div className="animate-[fade-in_0.5s_ease-in-out] space-y-6">
              <h2 className="text-4xl font-extrabold text-[#6C6C6C] border-b-4 border-[#BF0A30] inline-block pb-2">{t('cust.header_note')}</h2>
              <AdditionalNoteInput 
                note={order.note}
                onChange={handleNoteChange}
              />
            </div>
          )}
        
        </div>
      </div>

      <div className="flex-shrink-0 p-6 md:p-8 bg-white border-t-2 border-slate-200 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <SecondaryButton onClick={onBack} className="text-xl md:text-2xl py-4 px-8 md:px-10">{t('btn.back')}</SecondaryButton>
            <div className="text-right">
                <p className="text-xl font-medium text-slate-600">{t('cust.total_price')}</p>
                <p className="text-4xl font-bold text-[#BF0A30]">{subtotal.toFixed(2)} ฿</p>
            </div>
            <PrimaryButton onClick={onNext} disabled={isNextDisabled} className="text-xl md:text-2xl py-4 px-8 md:px-10">
              {t('btn.summary')}
            </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default CustomizationScreen;