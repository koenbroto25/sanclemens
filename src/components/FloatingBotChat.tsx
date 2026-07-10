'use client';

import React from 'react';

const FloatingBotChat = () => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button 
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gold-500 text-primary-500 shadow-lg animate-pulse-slow transition-all duration-300 ease-in-out group"
        title="Tanya Bot Paroki"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"></path></svg>
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-cream-100 text-xs font-inter rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          Tanya Bot Paroki
        </span>
      </button>
      {/* Add pulse animation */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(200, 169, 110, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(200, 169, 110, 0);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default FloatingBotChat;
