// packages/ui/src/features/CompanionModeChip.tsx
import React from 'react';
// Assuming Icon component is available at @paroki/ui/components/ui/Icon
// import Icon from '../components/ui/Icon'; 

type CompanionMode = 'Normal' | 'Grief' | 'Doubt' | 'Gratitude' | 'Preparation' | 'Emergency';

interface CompanionModeChipProps {
  currentMode: CompanionMode;
  setMode: (mode: CompanionMode) => void;
}

const modeColors: Record<CompanionMode, string> = {
  Normal: 'bg-blue-600 hover:bg-blue-700',
  Grief: 'bg-purple-600 hover:bg-purple-700',
  Doubt: 'bg-amber-600 hover:bg-amber-700',
  Gratitude: 'bg-gold-500 hover:bg-gold-600',
  Preparation: 'bg-teal-600 hover:bg-teal-700',
  Emergency: 'bg-red-600 hover:bg-red-700 pulse-animation', // pulse-animation will be defined in global.css
};

const modeIcons: Record<CompanionMode, string> = {
  Normal: 'liturgical-candle', // Placeholder icon
  Grief: 'heart', // Placeholder icon
  Doubt: 'question-circle', // Placeholder icon
  Gratitude: 'flower', // Placeholder icon
  Preparation: 'book', // Placeholder icon
  Emergency: 'warning-triangle', // Placeholder icon
};

const CompanionModeChip: React.FC<CompanionModeChipProps> = ({ currentMode, setMode }) => {
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className={`inline-flex justify-center items-center gap-x-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ${modeColors[currentMode]}`}
        id="menu-button"
        aria-expanded="true"
        aria-haspopup="true"
      >
        {/* <Icon name={modeIcons[currentMode]} className="w-5 h-5" /> */}
        {currentMode}
        <svg className="-mr-1 h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown for mode selection - initially hidden */}
      <div
        className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabIndex={-1}
      >
        <div className="py-1" role="none">
          {(Object.keys(modeColors) as CompanionMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`${mode === currentMode ? 'bg-gray-700 text-white' : 'text-gray-200'}
                block px-4 py-2 text-sm w-full text-left hover:bg-gray-700 hover:text-white`}
              role="menuitem"
              tabIndex={-1}
            >
              {/* <Icon name={modeIcons[mode]} className="w-4 h-4 mr-2 inline-block" /> */}
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanionModeChip;