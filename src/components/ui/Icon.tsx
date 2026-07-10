'use client';
import React from 'react';
import { icons } from '../../assets/icons';

interface IconProps {
  name: string;
  className?: string;
  size?: string;
  color?: string;
  strokeWidth?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, className = '', size = '24px', color = 'currentColor', strokeWidth = '2', style }: IconProps) {
  const innerHtml = icons[name];
  if (!innerHtml) {
    console.warn(`Icon "${name}" not found in icons registry`);
    return null;
  }

  // Determine viewBox based on icon type
  const isCrossLogo = name === 'logo';
  const viewBox = isCrossLogo ? '0 0 36 36' : '0 0 24 24';

  return (
    <svg
      className={className}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, color, display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: innerHtml }}
    />
  );
}

export default Icon;
