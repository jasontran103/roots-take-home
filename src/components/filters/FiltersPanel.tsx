"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterIcon } from 'lucide-react';
import { ListingStatus } from '@/generated/prisma';

interface FiltersPanelProps {
  showFilters: boolean;
  filters: {
    price: [number, number];
    listingAge: number;
    assumable: boolean;
    status: ListingStatus;
  };
  filteredCount: number;
  totalCount: number;
  onToggleFilters: () => void;
  onFilterChange: (filters: {
    price: [number, number];
    listingAge: number;
    assumable: boolean;
    status: ListingStatus;
  }) => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showFilters,
  filters,
  filteredCount,
  totalCount,
  onToggleFilters,
  onFilterChange,
}) => {
  return (
    <div className="text-neo-black absolute top-4 left-4 z-20">
      <Button 
        onClick={onToggleFilters} 
        className="neo-button-primary mb-2 border-4 border-neo-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        <FilterIcon className="mr-2 h-4 w-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>
      
      {showFilters && (
        <Card className="neo-card w-72">
          <CardContent className="p-4">
            <h3 className="font-bold text-xl border-b-4 border-neo-black pb-2 mb-4">Filters</h3>
            
            <div className="space-y-6">
              <div>
                <label className="font-bold block mb-2">Price Range</label>
                <Slider 
                  defaultValue={filters.price}
                  min={200000}
                  max={1500000}
                  step={50000}
                  onValueChange={(value) => onFilterChange({...filters, price: value as [number, number]})}
                  className="mt-6"
                />
                <div className="flex justify-between mt-2">
                  <span>${filters.price[0].toLocaleString()}</span>
                  <span>${filters.price[1].toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <label className="font-bold block mb-2">Listing Age (Max Days)</label>
                <Slider 
                  defaultValue={[filters.listingAge]}
                  min={1}
                  max={120}
                  step={1}
                  onValueChange={(value) => onFilterChange({...filters, listingAge: value[0]})}
                />
                <div className="flex justify-end mt-2">
                  <span>Up to {filters.listingAge} days old</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="assumable-checkbox"
                    checked={filters.assumable}
                    onChange={() => onFilterChange({...filters, assumable: !filters.assumable})}
                    className="neo-input h-5 w-5"
                  />
                  <label htmlFor="assumable-checkbox" className="font-bold ml-2">Show Assumable Only</label>
                </div>
              </div>
              
              <div>
                <label className="font-bold block mb-2">Status</label>
                <Tabs defaultValue={filters.status} onValueChange={(value) => onFilterChange({...filters, status: value as ListingStatus})}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="ALL">All</TabsTrigger>
                    <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                    <TabsTrigger value="PENDING">Pending</TabsTrigger>
                    <TabsTrigger value="SOLD">Sold</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCount} of {totalCount} properties
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 