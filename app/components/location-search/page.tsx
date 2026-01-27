'use client';

import { useState, useEffect } from 'react';
import { LocationResult } from '../../types/weather';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number) => void;
  onGetCurrentLocation: () => void;
}

export default function LocationSearch({ onLocationSelect, onGetCurrentLocation }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Search for locations using Nominatim
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'WeatherApp' } }
      );

      if (response.ok) {
        const data = await response.json();
        const results: LocationResult[] = data
          .filter((item: any) => item.address && (item.address.city || item.address.town || item.address.village || item.address.county))
          .map((item: any) => ({
            name: item.address.city || item.address.town || item.address.village || item.address.county || item.display_name.split(',')[0],
            state: item.address.state || '',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }));
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a location from search results
  const selectLocation = (location: LocationResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    onLocationSelect(location.lat, location.lon);
  };

  return (
    <>
      <div className="relative mb-8">
        <div className="flex gap-2 justify-center flex-wrap">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Search Results Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-10">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(result)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium text-gray-800">{result.name}</span>
                    <span className="text-gray-500">, {result.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onGetCurrentLocation}
            className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-800"
          >
            <span>📍</span>
            <span className="hidden sm:inline">Current Location</span>
          </button>
        </div>
      </div>

      {/* Click outside to close search */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowSearch(false)}
        />
      )}
    </>
  );
}
