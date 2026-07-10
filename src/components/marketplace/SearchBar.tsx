import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilter: (category: string | null) => void;
  placeholder?: string;
  categories: string[];
  selectedCategory?: string | null;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilter,
  placeholder = "Cari produk, jasa, atau lowongan...",
  categories,
  selectedCategory = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (category: string | null) => {
    onFilter(category);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 relative" ref={dropdownRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pk-input flex-grow"
      />
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="pk-btn-secondary flex items-center justify-center gap-2 min-w-[120px]"
        >
          {selectedCategory || 'Semua Kategori'}
          <svg className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {isDropdownOpen && (
          <div className="absolute top-full sm:right-0 mt-2 w-full sm:w-48 bg-pk-surface border border-pk-border rounded-md shadow-lg z-10">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`block w-full text-left px-4 py-2 text-sm ${!selectedCategory ? 'bg-pk-background font-semibold' : 'hover:bg-pk-background'}`}
            >
              Semua Kategori
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`block w-full text-left px-4 py-2 text-sm ${selectedCategory === category ? 'bg-pk-background font-semibold' : 'hover:bg-pk-background'}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;