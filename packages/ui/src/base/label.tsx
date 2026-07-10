import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label className={`block text-sm font-medium text-text-primary mb-1 ${className || ''}`} {...props}>
      {children}
    </label>
  );
}