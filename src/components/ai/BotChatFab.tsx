'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BotChatFabProps {
  botId: string;
  botName: string;
  icon?: string;
  color?: string;
  className?: string;
}

export function BotChatFab({
  botId,
  botName,
  icon = 'ðŸ’¬',
  color = 'bg-blue-600',
  className = ''
}: BotChatFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className={`fixed bottom-6 right-6 ${color} text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 ${className}`}
          aria-label={`Buka chat dengan ${botName}`}
        >
          <span className="text-2xl">{icon}</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Panel Header */}
          <div className={`flex items-center justify-between p-4 ${color} text-white rounded-t-lg`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <div>
                <h3 className="font-semibold">{botName}</h3>
                <p className="text-xs opacity-90">Asisten AI</p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Chat Content - Reuse AIChatWidget */}
          <div className="flex-1 overflow-hidden">
            {/* This would be replaced with actual AIChatWidget integration */}
            <div className="p-4 text-center text-gray-500">
              <p className="mb-2">Chat dengan {botName}</p>
              <p className="text-sm">Fitur chat akan segera tersedia</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}