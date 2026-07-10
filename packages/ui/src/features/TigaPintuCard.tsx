import React from 'react';
interface TigaPintuCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}
const TigaPintuCard: React.FC<TigaPintuCardProps> = ({ title, description, icon, onClick, className, children }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow ${className || ''}`} onClick={onClick}>
    {icon && <div className="mb-3">{icon}</div>}
    {title && <h3 className="font-semibold text-lg mb-2">{title}</h3>}
    {description && <p className="text-sm text-gray-600">{description}</p>}
    {children}
  </div>
);
export default TigaPintuCard;