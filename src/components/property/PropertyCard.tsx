"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartIcon, BedIcon, StarIcon } from 'lucide-react';
import type { Listing } from '@/generated/prisma';

interface PropertyCardProps {
  property: Listing;
  isSelected: boolean;
  favorites: string[];
  onSelect: (property: Listing) => void;
  onToggleFavorite: (propertyId: string) => void;
}

// Helper functions
const calculateMonthlyPayment = (price: number): number => {
  return Math.round(price / 360);
};

const getPropertyImage = (property: Listing) => {
  if (property.photoUrls && property.photoUrls.length > 0) {
    return property.photoUrls[0];
  }
  // Fallback to a default image if no photoUrls are available
  return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&h=200';
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSelected,
  favorites,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <Card 
      className={`neo-card text-neo-black cursor-pointer hover:border-neo-primary transition-colors ${
        isSelected ? 'border-4 border-neo-primary' : 'border-4 border-neo-black'
      }`}
      onClick={() => onSelect(property)}
    >
      <CardContent className="p-0">
        <div className="relative">
          {/* Property Image */}
          <div className="h-40 overflow-hidden">
            <img 
              src={getPropertyImage(property)} 
              alt={property.address} 
              className="w-full h-full object-cover" 
            />
          </div>
          
          {/* Favorite Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(property.id);
            }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white border-2 border-neo-black hover:bg-neo-primary"
          >
            <HeartIcon 
              className={`h-4 w-4 ${favorites.includes(property.id) ? 'fill-neo-red text-neo-red' : ''}`} 
            />
          </Button>
          
          {/* Status Badge */}
          {property.status !== 'ACTIVE' && (
            <div className="absolute top-2 left-2 bg-neo-black text-white px-2 py-1 text-xs font-bold">
              {property.status}
            </div>
          )}
          
          {/* Assumable Badge */}
          {property.isAssumable && (
            <div className="absolute bottom-2 left-2 bg-neo-green text-white px-2 py-1 text-xs font-bold border-2 border-black">
              ASSUMABLE
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-lg">${calculateMonthlyPayment(Number(property.price))}/month</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold">${Number(property.price).toLocaleString()}</div>
              <div className="text-sm">${Math.round(Number(property.price) * 0.05).toLocaleString()} down</div>
            </div>
          </div>
          
          <div className="mt-3 border-t-2 border-neo-black pt-2">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <BedIcon className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
              <div>
                <span>{property.bathrooms?.toString()} baths</span>
              </div>
              <div>
                <span>{property.squareFeet?.toLocaleString()} sqft</span>
              </div>
            </div>
            
            <p className="text-sm mt-2 truncate">{property.address}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 