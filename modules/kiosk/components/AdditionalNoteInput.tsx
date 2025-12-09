
import React from 'react';

interface AdditionalNoteInputProps {
  note: string;
  onChange: (note: string) => void;
}

const AdditionalNoteInput: React.FC<AdditionalNoteInputProps> = ({ note, onChange }) => {
  return (
    <section>
      {/* Header handled by parent */}
      <div className="w-full">
        <textarea
          value={note}
          onChange={(e) => onChange(e.target.value)}
          placeholder="เช่น ไม่ใส่เม็ดพริกหม่าล่า"
          rows={4}
          className="w-full p-4 text-xl border-2 border-slate-300 rounded-xl focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none transition-colors text-slate-800 placeholder-slate-400 resize-none"
        />
      </div>
    </section>
  );
};

export default AdditionalNoteInput;