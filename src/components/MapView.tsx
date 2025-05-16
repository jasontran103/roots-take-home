"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { Listing } from '@/generated/prisma';
import { ListingStatus } from '@/generated/prisma';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ViewportBounds } from '@/services/listing.service';
import debounce from 'lodash.debounce';

import { toggleFavorite, isFavorite } from '@/utils/localStorageUtils';
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
      return 'text-neo-gray';
    default:
      return 'text-neo-primary';
  }
};

const MapView: React.FC<MapViewProps> = ({ properties = [], onFilterChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const previousFilteredRef = useRef<Listing[]>([]);
  const moveEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastViewportRef = useRef<ViewportBounds | null>(null);
  const loadedPropertiesRef = useRef<Set<string>>(new Set());
  const fetchedBoundsRef = useRef<ViewportBounds[]>([]);
  const isMovingRef = useRef(false);
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
    price: [100000, 1500000],
    listingAge: 120,
    assumable: false,
    status: ListingStatus.ACTIVE
  });
  const [filteredProperties, setFilteredProperties] = useState<Listing[]>(properties);
  const [showFilters, setShowFilters] = useState(false);
  const [showPropertyCards, setShowPropertyCards] = useState(true);
  const [displayedProperties, setDisplayedProperties] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Add new state for map center
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

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

  // Helper function to check if bounds are similar
  const isSimilarBounds = (bounds1: ViewportBounds, bounds2: ViewportBounds): boolean => {
    const threshold = 0.1; // About 10km
    return (
      Math.abs(bounds1.north - bounds2.north) < threshold &&
      Math.abs(bounds1.south - bounds2.south) < threshold &&
      Math.abs(bounds1.east - bounds2.east) < threshold &&
      Math.abs(bounds1.west - bounds2.west) < threshold
    );
  };

  // Helper function to check if bounds have been fetched
  const hasFetchedBounds = (bounds: ViewportBounds): boolean => {
    return fetchedBoundsRef.current.some(b => isSimilarBounds(b, bounds));
  };

  // Debounced fetch function
  const debouncedFetch = useRef(
    debounce(async (viewport: ViewportBounds) => {
      if (isLoading || !hasMore || isMovingRef.current) return;
      if (hasFetchedBounds(viewport)) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/listings?viewport=${JSON.stringify(viewport)}&page=1&limit=50`);
        if (!response.ok) throw new Error('Failed to fetch listings');
        
        const data = await response.json();
        const newListings = data.listings.filter((listing: Listing) => !loadedPropertiesRef.current.has(listing.id));
        
        if (newListings.length === 0) {
          setHasMore(false);
          return;
        }
        
        // Add to fetched bounds
        fetchedBoundsRef.current.push(viewport);
        
        // Add new property IDs to the loaded set
        newListings.forEach((listing: Listing) => loadedPropertiesRef.current.add(listing.id));
        
        // Update state with new listings
        setFilteredProperties(prev => {
          // Create a Map to deduplicate properties by ID
          const uniqueProperties = new Map();
          [...prev, ...newListings].forEach(property => {
            uniqueProperties.set(property.id, property);
          });
          return Array.from(uniqueProperties.values());
        });
        
        setDisplayedProperties(prev => {
          // Create a Map to deduplicate properties by ID
          const uniqueProperties = new Map();
          [...prev, ...newListings].forEach(property => {
            uniqueProperties.set(property.id, property);
          });
          return Array.from(uniqueProperties.values());
        });
        
        setHasMore(newListings.length === 50);
        setPage(1);
        lastViewportRef.current = viewport;

        // Add markers for new listings
        if (map.current && newListings.length > 0) {
          newListings.forEach((property: Listing) => {
            if (property.latitude == null || property.longitude == null) return;
            if (markersRef.current[property.id]) return;

            // Create and add marker
            const markerEl = document.createElement('div');
            markerEl.className = 'property-marker';
            
            const priceTag = document.createElement('div');
            priceTag.className = `text-xs font-bold py-1 px-2 border-4 border-neo-black cursor-pointer transition-all rounded-none shadow-neo ${
              property.id === selectedProperty?.id ? 'ring-4 ring-neo-red scale-125 z-50' : 
              property.id === hoveredProperty?.id ? 'scale-110' : ''
            } ${
              isFavorite(property.id) ? 'bg-neo-yellow' : 
              property.isAssumable ? 'bg-neo-green' : 
              property.status === ListingStatus.PENDING ? 'bg-amber-300' : 
              property.status === ListingStatus.SOLD ? 'bg-gray-400' : 'bg-neo-primary'
            }`;
            
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
            
            markersRef.current[property.id] = marker;
          });
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Error Loading Listings",
          description: "Failed to load property listings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 500)
  ).current;

  // Initialize Mapbox map when token is provided
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error('Missing Mapbox token');
      toast({
        title: "Map Error",
        description: "Mapbox token is missing. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }
    
    if (!mapContainerRef.current) {
      console.error('Missing map container ref');
      return;
    }
    
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
        console.log('Map loaded successfully');
        setMapLoaded(true);
        
        // Get initial viewport and fetch listings
        const bounds = map.current?.getBounds();
        if (bounds) {
          const viewport = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          };
          debouncedFetch(viewport);
        }
      });

      // Add movestart event listener
      map.current.on('movestart', () => {
        isMovingRef.current = true;
      });

      // Add moveend event listener
      map.current.on('moveend', () => {
        isMovingRef.current = false;
        const bounds = map.current?.getBounds();
        if (bounds) {
          const viewport = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          };
          debouncedFetch(viewport);
        }
      });

      // Add error handler
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        toast({
          title: "Map Error",
          description: "There was an error loading the map. Please check the console for details.",
          variant: "destructive",
        });
      });
      
      // Cleanup function
      return () => {
        debouncedFetch.cancel();
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
  }, [debouncedFetch]);

  // Update useEffect to handle filters without reloading
  useEffect(() => {
    if (!filteredProperties) {
      setDisplayedProperties([]);
      onFilterChange?.([]);
      return;
    }

    const filtered = filterProperties;
    
    // Only update if the filtered results have changed
    if (JSON.stringify(filtered) !== JSON.stringify(previousFilteredRef.current)) {
      setFilteredProperties(filtered);
      previousFilteredRef.current = filtered;
      setDisplayedProperties(filtered);
      onFilterChange?.(filtered);
    }
  }, [filterProperties, onFilterChange]);

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
    const isFav = toggleFavorite(propertyId);
    if (isFav) {
      toast({
        title: "Added to Favorites",
        description: "Property has been added to your favorites.",
      });
      setFavorites(prev => [...prev, propertyId]);
    } else {
      toast({
        title: "Removed from Favorites",
        description: "Property has been removed from your favorites.",
      });
      setFavorites(prev => prev.filter(id => id !== propertyId));
    }
    
    // Update markers to reflect new favorite status
    if (map.current) {
      debouncedFetch(lastViewportRef.current!);
    }
  };
  
  const handleCloseDetails = () => {
    setSelectedProperty(null);
  };

  return (
    <div className="relative overflow-hidden w-full h-[calc(100vh-6rem)] bg-gray-50">

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
          {Array.from(new Set(displayedProperties.map(p => p.id))).map(propertyId => {
            const property = displayedProperties.find(p => p.id === propertyId);
            if (!property) return null;
            return (
              <PropertyCard
                key={`property-${propertyId}`}
                property={property}
                isSelected={selectedProperty?.id === propertyId}
                favorites={favorites}
                onSelect={handleMarkerClick}
                onToggleFavorite={handleToggleFavorite}
              />
            );
          })}
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
          onResetView={() => {
            if (map.current) {
              map.current.flyTo({
                center: [-122.4194, 37.7749],
                zoom: 11,
                duration: 1000,
              });
            }
          }}
          showPropertyCards={showPropertyCards}
          onTogglePropertyCards={() => setShowPropertyCards(!showPropertyCards)}
        />
      </div>
    </div>
  );
};

export default MapView;