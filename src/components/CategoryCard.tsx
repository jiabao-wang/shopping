// components/CategoryCard.tsx (简化的组件，确保固定大小、无描述)
'use client';

import type { Category } from '@prisma/client';

interface CategoryCardProps {
  category: Category;
  onClick: (id: string) => void;
  isSelected: boolean;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  onClick, 
  isSelected, 
  className = "flex-shrink-0 w-20 h-24 md:w-24 md:h-28" 
}) => {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={`
        ${className}
        flex flex-col items-center p-2 rounded-lg transition-all
        ${isSelected 
          ? 'bg-blue-100 border-2 border-blue-500 shadow-md' 
          : 'bg-white hover:bg-gray-100 border border-gray-200'
        }
        overflow-hidden
      `}
    >
      <img
        src={category.image || '/placeholder-category.jpg'}
        alt={category.name}
        className="w-full h-3/4 object-cover rounded-md mb-1"
      />
      <span className="text-xs font-medium text-center truncate px-1">
        {category.name}
      </span>
    </button>
  );
};