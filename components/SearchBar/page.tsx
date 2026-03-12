'use client';

import { LocationResult } from '@/app/types/weather';

interface SearchBarProps {
  searchQuery: string;
  onQueryChange: (q: string) => void;
  searchResults: LocationResult[];
  searchLoading: boolean;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  onSelectLocation: (l: LocationResult) => void;
  onGetLocation: () => void;
  isCelsius: boolean;
  onToggleUnit: () => void;
}

export default function SearchBar({
  searchQuery,
  onQueryChange,
  searchResults,
  searchLoading,
  showSearch,
  setShowSearch,
  onSelectLocation,
  onGetLocation,
  isCelsius,
  onToggleUnit,
}: SearchBarProps) {
  return (
    <div className="relative mb-8">
      <div className="flex gap-2 justify-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search for a US city..."
            value={searchQuery}
            onChange={(e) => { onQueryChange(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-10">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => onSelectLocation(result)}
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
          onClick={onGetLocation}
          title="Use current location"
          className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-800"
        >
          <span>📍</span>
          <span className="hidden sm:inline">My Location</span>
        </button>

        <button
          onClick={onToggleUnit}
          title="Toggle temperature unit"
          className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors text-gray-800 font-semibold min-w-[56px]"
        >
          °{isCelsius ? 'F' : 'C'}
        </button>
      </div>

      {showSearch && (
        <div className="fixed inset-0 z-0" onClick={() => setShowSearch(false)} />
      )}
    </div>
  );
}
