'use client';

import { useState } from 'react';
import { AIChatWidget } from './AIChatWidget';

interface GateBotBubbleProps {
  className?: string;
}

export function GateBotBubble({ className = '' }: GateBotBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isExpanded) {
    return (
      <div className={`fixed bottom-6 right-6 w-[400px] h-[600px] z-50 ${className}`}>
        <AIChatWidget
          botId="bot_1"
          botName="Klemen Penjaga Pintu"
          accessLevel={0}
          placeholder="Tanyakan apa saja tentang gereja..."
        />
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute -top-2 -right-2 bg-gray-600 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 ${className}`}>
      {/* Animated Bubble */}
      <button
        onClick={() => setIsExpanded(true)}
        className="relative group"
      >
        {/* Pulse animation */}
        <span className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></span>
        <span className="absolute inset-0 bg-blue-500 rounded-full animate-pulse"></span>
        
        {/* Main bubble */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110">
          <div className="text-center">
            <div className="text-4xl mb-1">🙋</div>
            <div className="text-sm font-semibold">Ada yang bisa saya bantu?</div>
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <p className="text-sm font-semibold">Klemen Penjaga Pintu</p>
          <p className="text-xs text-gray-300">Klik untuk bertanya</p>
          <div className="absolute bottom-0 right-6 w-2 h-2 bg-gray-900 transform rotate-45 translate-y-1/2"></div>
        </div>
      </button>
    </div>
  );
}