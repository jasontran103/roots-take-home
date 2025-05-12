"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartIcon, XIcon, BedDoubleIcon, StarIcon } from 'lucide-react';
import type { Listing } from '@/generated/prisma';

interface PropertyInfoCardProps {
  property: Listing;
  favorites: string[];
  onClose: () => void;
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

const formatBathrooms = (bathrooms: any): string => {
  if (bathrooms === null || bathrooms === undefined) return '0';
  return Number(bathrooms).toString();
};

export const PropertyInfoCard: React.FC<PropertyInfoCardProps> = ({
  property,
  favorites,
  onClose,
  onToggleFavorite,
}) => {
  return (
    <Card className="neo-card text-neo-black absolute bottom-4 left-4 w-96 z-20 bg-white">
      <CardContent className="p-0">
        {/* Property Header */}
        <div className="relative">
          <div className="h-56 overflow-hidden">
            <img 
              src={getPropertyImage(property)} 
              alt={property.address} 
              className="w-full object-cover" 
            />
          </div>
          
          <div className="absolute top-4 right-4 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onToggleFavorite(property.id)}
              className="h-10 w-10 rounded-full bg-white border-2 border-neo-black hover:bg-neo-primary"
            >
              <HeartIcon 
                className={`h-5 w-5 ${favorites.includes(property.id) ? 'fill-neo-red text-neo-red' : ''}`} 
              />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white border-2 border-neo-black hover:bg-neo-primary"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Property Details */}
        <div className="p-5 border-t-4 border-neo-black">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-xl">{property.address}</h3>
          </div>
          
          <div className="mb-3">
            <p className="text-sm">{property.city}, {property.state}</p>
          </div>
          
          <div className="border-t-2 border-b-2 border-neo-black py-3 mb-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <BedDoubleIcon className="h-5 w-5" /> 
                <span>{property.bedrooms} beds</span>
              </div>
              <div className="flex gap-2 items-center">
                <span>{formatBathrooms(property.bathrooms)} baths</span>
              </div>
              <div>
                <span>{property.squareFeet?.toLocaleString()} sq ft</span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="font-bold text-2xl mb-1">${Number(property.price).toLocaleString()}</div>
            <div className="flex justify-between items-center">
              <span className="text-lg">${calculateMonthlyPayment(Number(property.price))}/month</span>
              <span className="text-sm bg-neo-primary px-3 py-1 border-2 border-neo-black font-bold">
                {property.status}
              </span>
            </div>
          </div>
          
          {property.isAssumable && (
            <div className="mt-3 p-3 bg-white border-4 border-neo-green mb-4">
              <p className="font-bold text-neo-green">Assumable Mortgage Available</p>
              <div className="flex justify-between text-sm mt-1">
                <p>Rate: {property.assumableDesirabilityScore?.toFixed(2)}%</p>
                <p>${calculateMonthlyPayment(Number(property.price) * 0.8)}/mo</p>
              </div>
              <p className="text-sm">Balance: ${Math.round(Number(property.price) * 0.8).toLocaleString()}</p>
            </div>
          )}
          
          <Button className="neo-button-primary w-full">
            Contact Agent
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 