'use client';

import React from 'react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  totalCount?: number;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  showValue = true,
  totalCount,
}: RatingStarsProps) {
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const handleClick = (value: number) => {
    if (interactive && onRate) {
      onRate(value);
    }
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className={`flex items-center ${sizeClasses[size]} ${interactive ? 'cursor-pointer select-none' : ''}`}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span
            key={`full-${i}`}
            className={`${interactive ? 'hover:scale-110 transition-transform' : ''}`}
            style={{ color: '#f59e0b' }}
            onClick={() => handleClick(i + 1)}
            onMouseEnter={() => interactive && setHoveredRating(i + 1)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          >
            ★
          </span>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <span
            className="relative inline-block"
            style={{ color: '#d1d5db' }}
            onClick={() => handleClick(fullStars + 0.5)}
            onMouseEnter={() => interactive && setHoveredRating(fullStars + 1)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          >
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%', color: '#f59e0b' }}>
              ★
            </span>
            ★
          </span>
        )}

        {/* Empty stars */}
        {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
          <span
            key={`empty-${i}`}
            className={`${interactive ? 'hover:scale-110 transition-transform' : ''}`}
            style={{ color: '#d1d5db' }}
            onClick={() => handleClick(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
            onMouseEnter={() => interactive && setHoveredRating(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          >
            ★
          </span>
        ))}
      </div>

      {showValue && (
        <span className="text-sm font-medium" style={{ color: '#8b7355' }}>
          {rating.toFixed(1)}
          {totalCount !== undefined && (
            <span className="text-xs ml-1">({totalCount})</span>
          )}
        </span>
      )}
    </div>
  );
}

// Interactive rating input component
interface RatingInputProps {
  onRate: (rating: number) => void;
  currentRating?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingInput({ onRate, currentRating = 0, size = 'lg' }: RatingInputProps) {
  const [selected, setSelected] = React.useState(currentRating);
  const [hovered, setHovered] = React.useState(0);

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const labels = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="transition-all duration-150 hover:scale-125 focus:outline-none"
            style={{
              color: star <= (hovered || selected) ? '#f59e0b' : '#d1d5db',
              transform: star <= (hovered || selected) ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={() => {
              setSelected(star);
              onRate(star);
            }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rating ${star}`}
          >
            ★
          </button>
        ))}
      </div>
      {hovered > 0 && (
        <span className="text-sm font-medium" style={{ color: '#8b7355' }}>
          {labels[hovered - 1]}
        </span>
      )}
      {selected > 0 && hovered === 0 && (
        <span className="text-sm font-medium" style={{ color: '#8b7355' }}>
          {labels[selected - 1]}
        </span>
      )}
    </div>
  );
}