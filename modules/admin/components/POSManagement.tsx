import React, { useState, useRef } from 'react';
import { useMenu } from '../../../store/MenuContext';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';
import apiService from '../../../services/api';

const isDriveMenuUploadEnabled = () =>
  String(import.meta.env.VITE_GOOGLE_DRIVE_ENABLED || '').toLowerCase() === 'true';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const POSManagement = () => {
  const [activeTab, setActiveTab] = useState<'addons' | 'soup' | 'spice'>('addons');
  
  // Use shared state from MenuContext
  const { 
      addOns: items, 
      soups, 
      spiceLevels: spices,
      addAddOn, updateAddOn, deleteAddOn,
      addSoup, updateSoup, deleteSoup,
      addSpiceLevel, updateSpiceLevel, deleteSpiceLevel
  } = useMenu();
  
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalCategory, setModalCategory] = useState<'addons' | 'soup' | 'spice'>('addons');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** ไฟล์ที่เลือก — อัปโหลดจริงตอนกดบันทึก (ไม่เก็บ base64 ใน state) */
  const pendingImageFileRef = useRef<File | null>(null);
  const imageBlobUrlRef = useRef<string | null>(null);

  const resetImageDraft = () => {
    if (imageBlobUrlRef.current) {
      URL.revokeObjectURL(imageBlobUrlRef.current);
      imageBlobUrlRef.current = null;
    }
    pendingImageFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeModal = () => {
    resetImageDraft();
    setEditingItem(null);
  };

  const handleEdit = (item: any, type: 'addons' | 'soup' | 'spice') => {
    resetImageDraft();
    setEditingItem({ ...item });
    setModalCategory(type);
  };

  const handleAddNew = () => {
    resetImageDraft();
    setEditingItem({ id: null, name: '', price: 0, image: '', description: '', isSpecial: false });
    setModalCategory(activeTab);
  };

  const handleDelete = () => {
    if (!editingItem || !editingItem.id) return;
    resetImageDraft();
    if (modalCategory === 'addons') {
      void deleteAddOn(editingItem.id);
    } else if (modalCategory === 'soup') {
      void deleteSoup(editingItem.id);
    } else {
      void deleteSpiceLevel(editingItem.id);
    }
    setEditingItem(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageBlobUrlRef.current) {
      URL.revokeObjectURL(imageBlobUrlRef.current);
      imageBlobUrlRef.current = null;
    }
    pendingImageFileRef.current = file;
    const url = URL.createObjectURL(file);
    imageBlobUrlRef.current = url;
    setEditingItem((prev: any) => (prev ? { ...prev, image: url } : null));
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || isSaving) return;

    const isNew = editingItem.id === null;
    let newId: number | string;
    if (isNew) {
      newId = modalCategory === 'addons' ? Date.now() : Date.now().toString();
    } else {
      newId = editingItem.id;
    }

    let imageValue =
      typeof editingItem.image === 'string' ? editingItem.image.trim() : '';
    const pendingFile = pendingImageFileRef.current;

    if (modalCategory !== 'spice') {
      if (pendingFile) {
        if (isDriveMenuUploadEnabled()) {
          setIsSaving(true);
          try {
            const { imageRef } = await apiService.uploadDriveImage(pendingFile);
            imageValue = imageRef;
            pendingImageFileRef.current = null;
            if (imageBlobUrlRef.current) {
              URL.revokeObjectURL(imageBlobUrlRef.current);
              imageBlobUrlRef.current = null;
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
          } catch (err) {
            setIsSaving(false);
            alert(err instanceof Error ? err.message : 'อัปโหลดรูปไป Google Drive ไม่สำเร็จ');
            return;
          }
        } else {
          setIsSaving(true);
          try {
            imageValue = await fileToDataUrl(pendingFile);
          } catch (err) {
            setIsSaving(false);
            alert(err instanceof Error ? err.message : 'อ่านรูปไม่สำเร็จ');
            return;
          }
          pendingImageFileRef.current = null;
          if (imageBlobUrlRef.current) {
            URL.revokeObjectURL(imageBlobUrlRef.current);
            imageBlobUrlRef.current = null;
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } else if (imageValue.startsWith('blob:')) {
        imageValue = '';
      }

      if (!imageValue) {
        imageValue = '/assets/addons/shabu_placeholder.png';
      }
    }

    const finalItem = {
      ...editingItem,
      id: newId,
      image:
        modalCategory === 'spice'
          ? undefined
          : imageValue || '/assets/addons/shabu_placeholder.png',
    };

    setIsSaving(true);
    try {
      if (modalCategory === 'addons') {
        if (isNew) await addAddOn(finalItem);
        else await updateAddOn(finalItem);
      } else if (modalCategory === 'soup') {
        if (isNew) await addSoup(finalItem);
        else await updateSoup(finalItem);
      } else {
        if (isNew) await addSpiceLevel(finalItem);
        else await updateSpiceLevel(finalItem);
      }

      resetImageDraft();
      setEditingItem(null);
      if (modalCategory !== activeTab) setActiveTab(modalCategory);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Preview Component ---
  const renderPreview = () => {
      if (!editingItem) return null;

      return (
          <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center h-full border border-slate-200">
              <h4 className="text-slate-500 font-bold mb-8 uppercase tracking-wider text-sm">ตัวอย่างแสดงหน้าเครื่อง (Preview)</h4>
              
              {/* Scale down slightly to fit */}
              <div className="transform scale-90 origin-top">
                  {modalCategory === 'addons' && (
                       <div className="w-56 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mx-auto mt-4">
                           {/* Image Part */}
                           <div className="w-full h-32 bg-white p-2 flex items-center justify-center relative">
                               <img 
                                   src={editingItem.image ? resolveMediaUrl(editingItem.image) : '/assets/addons/shabu_placeholder.png'} 
                                   alt={editingItem.name || 'Preview'} 
                                   className="max-w-full max-h-full object-contain" 
                               />
                               {editingItem.isSpecial && (
                                   <div className="absolute top-1 right-1 bg-yellow-400 p-1 rounded-full shadow-sm z-10">
                                       <StarIcon />
                                   </div>
                               )}
                           </div>
                           
                           {/* Content Part */}
                           <div className="p-3 text-center">
                               <h4 className="font-semibold text-slate-800 text-base leading-tight break-words h-10 flex items-center justify-center">
                                   {editingItem.name || 'ชื่อรายการ'}
                               </h4>
                               <p className="font-bold text-lg text-slate-700 mt-1">
                                   +{Number(editingItem.price || 0).toFixed(0)} บาท
                               </p>
                           </div>
                           
                           {/* Controls Part */}
                           <div className="border-t border-slate-200 p-3 flex items-center justify-center gap-4">
                               <button 
                                   type="button"
                                   className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xl font-bold flex items-center justify-center transition-colors hover:bg-slate-300"
                                   disabled
                               >
                                   -
                               </button>
                               <span className="text-2xl font-bold text-slate-800 tabular-nums min-w-[1.5rem] text-center">
                                   0
                               </span>
                               <button 
                                   type="button"
                                   className="w-9 h-9 rounded-full bg-[#BF0A30] text-white text-xl font-bold flex items-center justify-center transition-colors hover:bg-[#a00828] shadow-sm"
                               >
                                   +
                               </button>
                           </div>
                       </div>
                  )}

                  {modalCategory === 'soup' && (
                    <div className="relative w-56 cursor-default mx-auto mt-12">
                        <div className={`relative ${editingItem.isSpecial ? 'bg-[#1e293b]' : 'bg-[#BF0A30]'} rounded-[2rem] shadow-lg text-white flex flex-col pt-16 pb-4 px-4 h-48`}>
                            {editingItem.isSpecial && (
                                <div className="absolute top-0 right-0 bg-[#FACC15] text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[1.8rem] shadow-sm z-20">
                                    พิเศษ
                                </div>
                            )}
                            <div className="absolute -top-12 left-2 w-32 h-32 rounded-full bg-slate-100 shadow-md z-10 p-1">
                                <div 
                                    className="w-full h-full rounded-full bg-cover bg-center bg-slate-100" 
                                    style={{ backgroundImage: `url(${editingItem.image ? resolveMediaUrl(editingItem.image) : '/assets/soups/original.png'})` }} 
                                />
                            </div>
                            <div className="flex-grow w-full flex items-center justify-center px-1 relative z-10 mt-2">
                                <h4 className="text-xl md:text-2xl font-bold leading-tight drop-shadow-md text-center break-words">
                                    {editingItem.name || 'ชื่อน้ำซุป'}
                                </h4>
                            </div>
                            <div className="flex items-center justify-between w-full gap-3 mt-auto relative z-10">
                                <div className={`${editingItem.isSpecial ? 'bg-slate-600' : 'bg-white/20'} rounded-full px-4 py-2 flex-grow flex justify-center items-center backdrop-blur-sm`}>
                                    <span className="text-xs font-medium text-white/95 whitespace-nowrap">
                                        {editingItem.isSpicy ? 'เลือกระดับความเผ็ด' : 'ไม่เผ็ด'}
                                    </span>
                                </div>
                                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-full text-slate-900 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {modalCategory === 'spice' && (
                      <div className="w-56 p-4 rounded-xl flex flex-col items-center justify-center border-2 border-slate-300 bg-white text-slate-700 text-center mx-auto shadow-sm min-h-[5rem]">
                          <span className="text-xl font-bold">{editingItem.name || 'ระดับความเผ็ด'}</span>
                          {editingItem.price > 0 && (
                              <span className="text-[#BF0A30] text-sm mt-1">+{editingItem.price} บาท</span>
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderGrid = (data: any[], type: 'addons' | 'soup' | 'spice') => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex p-4 gap-4">
             {type !== 'spice' && (
                <div className="w-20 h-20 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border border-slate-200 relative">
                    <img src={item.image ? resolveMediaUrl(item.image) : 'https://placehold.co/100'} alt={item.name} className="w-full h-full object-cover" />
                    {item.isSpecial && (
                        <div className="absolute top-0 right-0 bg-yellow-400 p-1 rounded-bl-md shadow-sm">
                            <StarIcon />
                        </div>
                    )}
                </div>
             )}
             <div className="flex-grow flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1">
                    <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                    {item.isSpecial && type === 'spice' && <StarIcon />}
                </div>
                {type === 'addons' && <p className="text-[#BF0A30] font-semibold text-sm">฿{item.price}</p>}
                {type === 'spice' && item.price > 0 && <p className="text-[#BF0A30] font-semibold text-sm">+{item.price} บาท</p>}
                {item.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>}
             </div>
             <button 
                onClick={() => handleEdit(item, type)} 
                className="p-2 text-slate-400 hover:text-[#BF0A30] hover:bg-red-50 rounded-lg transition-colors self-start"
                title="แก้ไข"
             >
                <EditIcon />
             </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-[fade-in_0.5s_ease-in-out]">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">จัดการเมนู POS</h2>
            <button 
                onClick={handleAddNew}
                className="bg-[#BF0A30] text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-[#a00828] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
                <span className="text-xl leading-none font-light">+</span> เพิ่มรายการใหม่
            </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 mb-4 overflow-x-auto">
             <button 
                onClick={() => setActiveTab('addons')}
                className={`px-4 md:px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'addons' ? 'border-[#BF0A30] text-[#BF0A30]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                ของเพิ่มเติม (Add-ons)
             </button>
             <button 
                onClick={() => setActiveTab('soup')}
                className={`px-4 md:px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'soup' ? 'border-[#BF0A30] text-[#BF0A30]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                น้ำซุป (Soups)
             </button>
             <button 
                onClick={() => setActiveTab('spice')}
                className={`px-4 md:px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'spice' ? 'border-[#BF0A30] text-[#BF0A30]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                ระดับความเผ็ด (Spice)
             </button>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar pb-20">
            {activeTab === 'addons' && renderGrid(items, 'addons')}
            {activeTab === 'soup' && renderGrid(soups, 'soup')}
            {activeTab === 'spice' && renderGrid(spices, 'spice')}
        </div>

        {/* Edit/Add Modal Overlay */}
        {editingItem && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 animate-[scale-in_0.2s_ease-out] flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">
                            {editingItem.id ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
                        </h3>
                        <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            {/* Left Column: Form */}
                            <form id="pos-form" onSubmit={handleSave} className="space-y-4">
                                {/* Category Dropdown (Requested Feature) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่ (Category)</label>
                                    <div className="relative">
                                        <select 
                                            value={modalCategory}
                                            onChange={(e) => setModalCategory(e.target.value as any)}
                                            className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-[#BF0A30] focus:border-transparent outline-none cursor-pointer"
                                        >
                                            <option value="addons">ของเพิ่มเติม (Add-ons)</option>
                                            <option value="soup">น้ำซุป (Soups)</option>
                                            <option value="spice">ระดับความเผ็ด (Spice)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรายการ <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={editingItem.name} 
                                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                        placeholder="เช่น เนื้อวัว, ต้มยำน้ำข้น"
                                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#BF0A30] focus:border-transparent outline-none"
                                    />
                                </div>

                                {/* Special Menu Checkbox (General) */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isSpecial"
                                        checked={editingItem.isSpecial || false}
                                        onChange={(e) => setEditingItem({ ...editingItem, isSpecial: e.target.checked })}
                                        className="w-5 h-5 text-[#BF0A30] border-slate-300 rounded focus:ring-[#BF0A30] cursor-pointer"
                                    />
                                    <label htmlFor="isSpecial" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                                        ตั้งเป็นเมนูแนะนำ / พิเศษ (Special Menu) <StarIcon />
                                    </label>
                                </div>

                                {/* Soup Specific: Spicy Checkbox */}
                                {modalCategory === 'soup' && (
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isSpicy"
                                            checked={editingItem.isSpicy || false}
                                            onChange={(e) => setEditingItem({ ...editingItem, isSpicy: e.target.checked })}
                                            className="w-5 h-5 text-red-500 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                                        />
                                        <label htmlFor="isSpicy" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
                                            เป็นน้ำซุปเผ็ด (ต้องเลือกระดับความเผ็ด)
                                        </label>
                                    </div>
                                )}
                                
                                {modalCategory === 'addons' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท) <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                required
                                                value={editingItem.price} 
                                                onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#BF0A30] focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
                                            <textarea 
                                                rows={2}
                                                value={editingItem.description || ''} 
                                                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#BF0A30] focus:border-transparent outline-none resize-none"
                                            />
                                        </div>
                                    </>
                                )}

                                {modalCategory === 'spice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">ราคาเพิ่ม (บาท)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={editingItem.price || 0} 
                                            onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#BF0A30] focus:border-transparent outline-none"
                                        />
                                    </div>
                                )}
                                
                                {modalCategory !== 'spice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">รูปภาพสินค้า</label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                            {editingItem.image ? (
                                                <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                                                    <img 
                                                        src={resolveMediaUrl(editingItem.image)} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-contain bg-white" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileUpload}
                                                            className="bg-white text-slate-800 px-3 py-1.5 rounded-md text-sm font-bold hover:bg-slate-100"
                                                        >
                                                            เปลี่ยนรูป
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                              resetImageDraft();
                                                              setEditingItem((prev: any) =>
                                                                prev ? { ...prev, image: '' } : null
                                                              );
                                                            }}
                                                            className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-bold hover:bg-red-700"
                                                        >
                                                            ลบ
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <UploadIcon />
                                                    <p className="text-sm text-slate-500 mb-4">รองรับไฟล์ภาพ JPG, PNG</p>
                                                    <button
                                                        type="button"
                                                        onClick={triggerFileUpload}
                                                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 hover:text-[#BF0A30] hover:border-[#BF0A30] transition-colors"
                                                    >
                                                        เลือกรูปภาพ
                                                    </button>
                                                </div>
                                            )}
                                            <input 
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>

                            {/* Right Column: Live Preview */}
                            <div className="flex flex-col">
                                {renderPreview()}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-4">
                        {editingItem.id ? (
                            <button 
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                            >
                                <TrashIcon /> <span className="ml-1">ลบรายการ</span>
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={closeModal} 
                                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                                disabled={isSaving}
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="submit"
                                form="pos-form"
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-[#BF0A30] text-white font-bold rounded-lg hover:bg-[#a00828] shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                            >
                                {isSaving ? 'กำลังบันทึก…' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default POSManagement;
