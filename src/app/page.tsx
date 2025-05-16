"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import MapView from "@/components/MapView";
import CategoryFilters, { CategoryType } from "@/components/layout/CategoryFilter";
import type { Listing } from "@/generated/prisma";

export default function Home() {
  const [properties, setProperties] = useState<Listing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/listings?page=1&limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }
      const data = await response.json();
      setProperties(data.listings);
      setFilteredProperties(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleFilterChange = (filtered: Listing[]) => {
    setFilteredProperties(filtered);
  };

  return (
    <Layout>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">Loading...</div>
            <p>Getting property data ready</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex w-full">
          <MapView
            properties={properties}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}
      {error && (
        <div className="text-red-500 font-semibold mt-8">Error: {error}</div>
      )}
    </Layout>
  );
}
