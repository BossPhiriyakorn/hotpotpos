import React from 'react';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <div className="relative inline-block mb-6">
      <h2 className="text-4xl font-extrabold text-[#6C6C6C]">{title}</h2>
      <div className="absolute -bottom-3 left-0 w-full h-1.5 bg-[#BF0A30] rounded-full" />
    </div>
  );
};

export default SectionHeader;