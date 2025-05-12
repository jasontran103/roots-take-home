
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  HomeIcon, 
  Building2Icon,
  TreesIcon,
  Bath,
  HeartIcon,
  LandPlotIcon,
  DollarSignIcon,
  FilterIcon
} from 'lucide-react';

export type CategoryType = 'all' | 'house' | 'apartment' | 'land' | 'pool' | 'favorite' | 'rural' | 'assumable';

interface CategoryFilterProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', icon: <FilterIcon />, label: 'All' },
    { id: 'house', icon: <HomeIcon />, label: 'Houses' },
    { id: 'apartment', icon: <Building2Icon />, label: 'Apartments' },
    { id: 'rural', icon: <TreesIcon />, label: 'Rural' },
    { id: 'pool', icon: <Bath />, label: 'Pool' },
    { id: 'land', icon: <LandPlotIcon />, label: 'Land' },
    { id: 'assumable', icon: <DollarSignIcon />, label: 'Assumable' },
    { id: 'favorite', icon: <HeartIcon />, label: 'Favorites' },
    { id: 'filters', icon: <FilterIcon />, label: 'Filters' },
  ];

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-2 space-x-2">
        {categories.map((category: { id: string; icon: React.ReactNode; label: string }) => (
          <Button
            key={category.id}
            onClick={() => category.id === 'filters' ? null : onCategoryChange(category.id as CategoryType)}
            className={`neo-button text-neo-black whitespace-nowrap flex items-center gap-2 px-4 transition-all
              ${activeCategory === category.id ? 'bg-neo-primary' : 'bg-white'}`}
            size="sm"
          >
            <span className="h-4 w-4">{category.icon}</span>
            <span>{category.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;