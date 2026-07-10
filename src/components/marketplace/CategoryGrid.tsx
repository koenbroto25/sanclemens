import React from 'react';

interface CategoryGridProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
  selectedCategory?: string;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onSelectCategory,
  selectedCategory,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`pk-card flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200
            ${selectedCategory === category ? 'bg-pk-primary text-white scale-105' : 'bg-pk-surface hover:bg-pk-background'}
            ${selectedCategory === category ? 'border-pk-primary' : 'border-pk-border'}
          `}
        >
          {/* Placeholder for category icon, you might replace this with actual SVG/Image components */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
            ${selectedCategory === category ? 'bg-white text-pk-primary' : 'bg-pk-background text-pk-secondary'}
          `}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Dummy icon - replace with specific icons per category */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2m7-7h.01"></path>
            </svg>
          </div>
          <span className={`text-sm font-medium ${selectedCategory === category ? 'text-white' : 'text-pk-text'}`}>
            {category}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryGrid;