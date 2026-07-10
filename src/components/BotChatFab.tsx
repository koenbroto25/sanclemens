'use client';

import { useState } from 'react';

const BotChatFab = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    console.log('Bot FAB clicked! (Chat widget will appear in Phase 1.9)');
  };

  return (
    <div
      id="botFab"
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gold shadow-lg cursor-pointer transition-all duration-300 hover:scale-110"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 text-xs text-white bg-gray-800 rounded transition-opacity duration-300 whitespace-nowrap ${showTooltip ? 'opacity-100' : 'opacity-0'}`}
      >
        Tanya Bot Paroki
      </span>
    </div>
  );
};

export default BotChatFab;
