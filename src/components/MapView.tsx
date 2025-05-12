"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { Listing } from '@/generated/prisma';
import { ListingStatus } from '@/generated/prisma';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { PropertyInfoCard } from './property/PropertyInfoCard';
import { PropertyCard } from './property/PropertyCard';
import { FiltersPanel } from '@/components/filters/FiltersPanel';
import { MapControls } from './map/MapControls';

// Interface for MapView props
interface MapViewProps {
  properties: Listing[];
  onFilterChange?: (filters: Listing[]) => void;
}

// Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_SECRET_KEY || '';

// Add helper function to get status background color
const getStatusBackground = (status: ListingStatus, isAssumable: boolean, isFavorite: boolean): string => {
  if (isFavorite) return 'bg-neo-yellow';
  if (isAssumable) return 'bg-neo-green';
  switch (status) {
    case ListingStatus.PENDING:
      return 'bg-amber-300';
    case ListingStatus.SOLD:
      return 'bg-gray-400';
    default:
      return 'bg-neo-blue';
  }
};

// Helper functions
const formatPrice = (price: number | null) => {
  if (!price) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const calculateMonthlyPayment = (price: number): number => {
  return Math.round(price / 360);
};

const formatBathrooms = (bathrooms: any): string => {
  if (bathrooms === null || bathrooms === undefined) return '0';
  return Number(bathrooms).toString();
};

const getStatusColor = (status: ListingStatus): string => {
  switch (status) {
    case ListingStatus.ACTIVE:
      return 'text-neo-green';
    case ListingStatus.PENDING:
      return 'text-neo-yellow';
    case ListingStatus.SOLD:
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

const MapView: React.FC<MapViewProps> = ({ properties = [], onFilterChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const previousFilteredRef = useRef<Listing[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Listing | null>(null);
  const [hoveredProperty, setHoveredProperty] = useState<Listing | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    price: [number, number];
    listingAge: number;
    assumable: boolean;
    status: ListingStatus;
  }>({
    price: [200000, 1500000],
    listingAge: 120,
    assumable: false,
    status: ListingStatus.ACTIVE
  });
  const [filteredProperties, setFilteredProperties] = useState<Listing[]>(properties);
  const [showFilters, setShowFilters] = useState(false);
  const [showPropertyCards, setShowPropertyCards] = useState(true);
  const [displayedProperties, setDisplayedProperties] = useState<Listing[]>([]);

  // Memoize the filter function
  const filterProperties = useMemo(() => {
    if (!properties) return [];
    
    return properties.filter(property => {
      const listingAge = property.listedAt ? new Date().getTime() - new Date(property.listedAt).getTime() : 0;
      const daysOld = Math.floor(listingAge / (1000 * 60 * 60 * 24));
      const price = Number(property.price);
      
      return (
        (!filters.price[0] || price >= filters.price[0]) &&
        (!filters.price[1] || price <= filters.price[1]) &&
        (!filters.listingAge || daysOld <= filters.listingAge) &&
        (!filters.assumable || property.isAssumable) &&
        (property.status === ListingStatus.ACTIVE || property.status === ListingStatus.PENDING || property.status === ListingStatus.SOLD)
      );
    });
  }, [properties, filters]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('propertyFavorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // Apply filters whenever filters change or properties change
  useEffect(() => {
    if (!properties) {
      setFilteredProperties([]);
      setDisplayedProperties([]);
      onFilterChange?.([]);
      return;
    }

    const filtered = filterProperties;
    
    // Only update if the filtered results have changed
    if (JSON.stringify(filtered) !== JSON.stringify(previousFilteredRef.current)) {
      setFilteredProperties(filtered);
      previousFilteredRef.current = filtered;
      
      // Update displayed properties (top 4 by price)
      const topProperties = [...filtered]
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 4);
      setDisplayedProperties(topProperties);
      
      // Notify parent of filter changes
      onFilterChange?.(filtered);

      // Update markers if map is initialized
      if (map.current) {
        updateMapMarkers(filtered);
      }
    }
  }, [filterProperties, onFilterChange]);

  // Initialize Mapbox map when token is provided
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current) {
      console.log('Missing Mapbox token or container ref');
      return;
    }
    
    console.log('Initializing map with token:', MAPBOX_TOKEN);
    
    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-122.4194, 37.7749], // Default center (San Francisco)
        zoom: 11,
      });

      // Add navigation controls (zoom in/out)
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // When map is loaded
      map.current.on('load', () => {
        console.log('Map loaded, adding markers for properties:', properties);
        setMapLoaded(true);
        // Add markers for properties
        updateMapMarkers(properties);
        
        // Fit map to markers
        fitMapToMarkers();
      });
      
      // Cleanup function
      return () => {
        map.current?.remove();
        map.current = null;
      };
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      toast({
        title: "Map Error",
        description: "There was an error loading the map. Please check your Mapbox token in environment variables.",
        variant: "destructive",
      });
    }
  }, []); // Empty dependency array since this should only run once

  // Function to update map markers when filtered properties change
  const updateMapMarkers = (properties: Listing[]) => {
    if (!map.current) {
      console.log('Map not initialized, cannot update markers');
      return;
    }
    
    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    
    // Add new markers
    properties.forEach(property => {
      if (property.latitude == null || property.longitude == null) {
        console.log('Property missing coordinates:', property);
        return;
      }

      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'property-marker';
      
      const priceTag = document.createElement('div');
      priceTag.className = `text-xs font-bold py-1 px-2 border-4 border-neo-black cursor-pointer transition-all rounded-none shadow-neo ${
        property.id === selectedProperty?.id ? 'ring-4 ring-neo-red scale-125 z-50' : 
        property.id === hoveredProperty?.id ? 'scale-110' : ''
      } ${
        favorites.includes(property.id) ? 'bg-neo-yellow' : 
        property.isAssumable ? 'bg-neo-green' : 
        property.status === ListingStatus.PENDING ? 'bg-amber-300' : 
        property.status === ListingStatus.SOLD ? 'bg-gray-400' : 'bg-neo-blue'
      }`;
      
      // Format price as monthly payment
      const monthlyPayment = Math.round(Number(property.price) / 360);
      priceTag.textContent = `$${monthlyPayment}/mo`;
      
      markerEl.appendChild(priceTag);
      
      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom',
        offset: [0, -10]
      })
        .setLngLat([Number(property.longitude), Number(property.latitude)])
        .addTo(map.current!);
      
      // Add click event
      markerEl.addEventListener('click', () => {
        setSelectedProperty(property);
        setHoveredProperty(null);
        map.current?.flyTo({
          center: [Number(property.longitude), Number(property.latitude)],
          zoom: 14,
          duration: 1000,
        });
      });
      // Add hover events
      markerEl.addEventListener('mouseenter', () => {
        setHoveredProperty(property);
        priceTag.className += ' scale-110';
      });
      markerEl.addEventListener('mouseleave', () => {
        setHoveredProperty(null);
        priceTag.className = priceTag.className.replace(' scale-110', '');
      });
      // Store marker reference
      markersRef.current[property.id] = marker;
    });
  };

  // Fit map to markers
  const fitMapToMarkers = () => {
    if (!map.current || filteredProperties.length === 0) return;
    
    // Calculate bounds
    const bounds = new mapboxgl.LngLatBounds();
    
    filteredProperties.forEach(property => {
      bounds.extend([Number(property.longitude), Number(property.latitude)]);
    });
    
    // Fit map to bounds with padding
    map.current.fitBounds(bounds, {
      padding: 80,
      maxZoom: 15,
      duration: 1000,
    });
  };

  const handleMarkerClick = (property: Listing) => {
    setSelectedProperty(property);
    
    // If map is loaded, fly to the property
    if (map.current) {
      map.current.flyTo({
        center: [Number(property.longitude), Number(property.latitude)],
        zoom: 14,
        duration: 1000,
      });
    }
  };

  const handleToggleFavorite = (propertyId: string) => {
    const isFav = favorites.includes(propertyId);
    if (!isFav) {
      toast({
        title: "Added to Favorites",
        description: "Property has been added to your favorites.",
      });
      setFavorites(prev => [...prev, propertyId]);
      localStorage.setItem('propertyFavorites', JSON.stringify([...favorites, propertyId]));
    } else {
      toast({
        title: "Removed from Favorites",
        description: "Property has been removed from your favorites.",
      });
      setFavorites(prev => prev.filter(id => id !== propertyId));
      localStorage.setItem('propertyFavorites', JSON.stringify(favorites.filter(id => id !== propertyId)));
    }
    
    // Update markers to reflect new favorite status
    if (map.current) {
      updateMapMarkers(filteredProperties);
    }
  };
  
  const handleCloseDetails = () => {
    setSelectedProperty(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] bg-gray-50">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full border-4 border-neo-black bg-gray-100 shadow-lg"
      >
        {!mapLoaded && (
          <div className="flex items-center justify-center w-full h-full bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neo-primary border-t-transparent mb-4"></div>
              <p className="text-2xl font-bold text-gray-700">Loading Map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Property Info Card */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 z-30">
          <PropertyInfoCard
            property={selectedProperty}
            favorites={favorites}
            onClose={handleCloseDetails}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}

      {/* Property Cards */}
      {showPropertyCards && (
        <div className="absolute right-4 top-4 w-80 z-30 flex flex-col space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neo-black scrollbar-track-gray-100">
          {displayedProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedProperty?.id === property.id}
              favorites={favorites}
              onSelect={handleMarkerClick}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Filters Panel */}
      <div className="absolute top-4 left-4 z-30">
        <FiltersPanel
          showFilters={showFilters}
          filters={filters}
          filteredCount={filteredProperties.length}
          totalCount={properties.length}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onFilterChange={setFilters}
        />
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-30">
        <MapControls
          onResetView={fitMapToMarkers}
          showPropertyCards={showPropertyCards}
          onTogglePropertyCards={() => setShowPropertyCards(!showPropertyCards)}
        />
      </div>
    </div>
  );
};

export default MapView;