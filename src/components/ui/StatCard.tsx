import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 text-center">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {/* Assuming primary color is defined in globals.css or tailwind config */}
        <div className="border-b border-b-2 border-primary pb-1"></div>
      </div>
      <div className="flex items-center justify-center">
        <span className="text-4xl font-bold text-primary">{value}</span>
        <div className="text-sm text-text-secondary mt-1">{subtitle}</div>
      </div>
    </div>
  );
};

export default StatCard;