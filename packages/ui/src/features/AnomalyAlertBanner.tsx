import React from 'react';
import { Button } from '../base/button'; // Adjust path as necessary for your Button component

interface AnomalyAlertBannerProps {
  message: string;
  onReviewClick: () => void;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const AnomalyAlertBanner: React.FC<AnomalyAlertBannerProps> = ({
  message,
  onReviewClick,
  severity = 'high',
}) => {
  const bgColor = {
    low: 'bg-yellow-50',
    medium: 'bg-orange-50',
    high: 'bg-red-50',
    critical: 'bg-red-100',
  }[severity];

  const borderColor = {
    low: 'border-yellow-500',
    medium: 'border-orange-500',
    high: 'border-red-500',
    critical: 'border-red-700',
  }[severity];

  const textColor = {
    low: 'text-yellow-800',
    medium: 'text-orange-800',
    high: 'text-red-800',
    critical: 'text-red-900',
  }[severity];

  const icon = {
    low: '⚠️',
    medium: '🚨',
    high: '🚨',
    critical: '🔥🚨',
  }[severity];

  return (
    <div className={`p-4 rounded-md border-l-4 ${borderColor} ${bgColor} flex items-center justify-between shadow-sm`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <p className={`font-semibold ${textColor}`}>Anomali Terdeteksi!</p>
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
      </div>
      <Button variant="destructive" onClick={onReviewClick}>
        Periksa
      </Button>
    </div>
  );
};

export { AnomalyAlertBanner };