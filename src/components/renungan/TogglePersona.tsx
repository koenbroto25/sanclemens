'use client';

import { useState } from 'react';

interface TogglePersonaProps {
  value: 'ignas' | 'anton';
  onChange: (persona: 'ignas' | 'anton') => void;
}

export default function TogglePersona({ value, onChange }: TogglePersonaProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="inline-flex items-center bg-white rounded-full shadow-md p-1 border border-gray-200">
      <button
        onClick={() => onChange('ignas')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          value === 'ignas'
            ? 'bg-gold text-white shadow-sm'
            : isHovered
            ? 'text-gray-700 hover:text-gold'
            : 'text-gray-500'
        }`}
      >
        Bruder Ignas
      </button>
      <button
        onClick={() => onChange('anton')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          value === 'anton'
            ? 'bg-gold text-white shadow-sm'
            : isHovered
            ? 'text-gray-700 hover:text-gold'
            : 'text-gray-500'
        }`}
      >
        Pater Anton
      </button>
    </div>
  );
}