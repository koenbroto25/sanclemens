'use client';

import { AIChatWidget } from './AIChatWidget';

interface PasarKasihBotWidgetProps {
  className?: string;
}

export function PasarKasihBotWidget({ className = '' }: PasarKasihBotWidgetProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pasar Kasih</h2>
        <p className="text-gray-600">
          Temukan usaha umat dan peluang kerja di Paroki Santo Klemens
        </p>
      </div>

      {/* Chat Widget */}
      <AIChatWidget
        botId="bot_7"
        botName="Bot Klemen Kerja (Pasar Kasih)"
        accessLevel={0}
        placeholder="Cari usaha, lowongan kerja, atau talenta..."
        className="h-[500px]"
      />
    </div>
  );
}