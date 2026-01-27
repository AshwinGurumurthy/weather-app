'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Coordinates {
  lat: number;
  lon: number;
}

interface LocationResult {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

interface CurrentWeather {
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  icon: string;
  windSpeed: string;
  windDirection: string;
  humidity: number | null;
}

interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
  isDaytime: boolean;
  windSpeed: string;
  windDirection: string;
}

interface PrecipitationObservation {
  timestamp: string;
  precipitation: number; // in mm
  description: string;
}

interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast: ForecastPeriod[];
  precipitationHistory: PrecipitationObservation[];
  totalPrecipitation48h: number;
}

// Weather icon mapping
const getWeatherEmoji = (forecast: string, isDaytime: boolean = true): string => {
  const lower = forecast.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return '⛈️';
  if (lower.includes('rain') && lower.includes('snow')) return '🌨️';
  if (lower.includes('rain') || lower.includes('shower')) return '🌧️';
  if (lower.includes('snow') || lower.includes('flurr')) return '❄️';
  if (lower.includes('sleet') || lower.includes('ice') || lower.includes('freez')) return '🌨️';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return '🌫️';
  if (lower.includes('cloud') || lower.includes('overcast')) return isDaytime ? '⛅' : '☁️';
  if (lower.includes('partly') || lower.includes('mostly sunny')) return isDaytime ? '🌤️' : '☁️';
  if (lower.includes('clear') || lower.includes('sunny')) return isDaytime ? '☀️' : '🌙';
  if (lower.includes('wind')) return '💨';
  return isDaytime ? '☀️' : '🌙';
};

// Format date for display
const formatDay = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatHour = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrecipitation, setShowPrecipitation] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch weather data from NWS API
  const fetchWeatherData = useCallback(async (coords: Coordinates) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get the grid point from coordinates
      const pointsResponse = await fetch(
        `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`,
        { headers: { 'User-Agent': 'WeatherApp (contact@example.com)' } }
      );

      if (!pointsResponse.ok) {
        throw new Error('Location not supported by NWS (US locations only)');
      }

      const pointsData = await pointsResponse.json();
      const locationName = `${pointsData.properties.relativeLocation.properties.city}, ${pointsData.properties.relativeLocation.properties.state}`;

      // Step 2: Fetch forecast and observation stations in parallel
      const [forecastResponse, stationsResponse] = await Promise.all([
        fetch(pointsData.properties.forecast, {
          headers: { 'User-Agent': 'WeatherApp (contact@example.com)' }
        }),
        fetch(pointsData.properties.observationStations, {
          headers: { 'User-Agent': 'WeatherApp (contact@example.com)' }
        })
      ]);

      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const forecastData = await forecastResponse.json();
      
      // Get observation station and fetch historical data
      let precipitationHistory: PrecipitationObservation[] = [];
      let totalPrecipitation48h = 0;
      
      if (stationsResponse.ok) {
        const stationsData = await stationsResponse.json();
        const stationId = stationsData.features?.[0]?.properties?.stationIdentifier;
        
        if (stationId) {
          // Fetch observations from the past 48 hours
          const now = new Date();
          const past48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          
          const observationsResponse = await fetch(
            `https://api.weather.gov/stations/${stationId}/observations?start=${past48h.toISOString()}&end=${now.toISOString()}`,
            { headers: { 'User-Agent': 'WeatherApp (contact@example.com)' } }
          );
          
          if (observationsResponse.ok) {
            const observationsData = await observationsResponse.json();
            
            // Process observations to extract precipitation data
            precipitationHistory = observationsData.features
              ?.filter((obs: any) => obs.properties?.precipitationLastHour?.value !== null)
              ?.map((obs: any) => ({
                timestamp: obs.properties.timestamp,
                precipitation: obs.properties.precipitationLastHour?.value || 0,
                description: obs.properties.textDescription || ''
              })) || [];
            
            // Calculate total precipitation
            totalPrecipitation48h = precipitationHistory.reduce(
              (sum: number, obs: PrecipitationObservation) => sum + (obs.precipitation || 0),
              0
            );
          }
        }
      }

      // Process current weather from the first forecast period
      const currentPeriod = forecastData.properties.periods[0];
      const current: CurrentWeather = {
        temperature: currentPeriod.temperature,
        temperatureUnit: currentPeriod.temperatureUnit,
        shortForecast: currentPeriod.shortForecast,
        icon: currentPeriod.icon,
        windSpeed: currentPeriod.windSpeed,
        windDirection: currentPeriod.windDirection,
        humidity: currentPeriod.relativeHumidity?.value || null
      };

      // Process 5-day forecast (get day periods only)
      const forecast: ForecastPeriod[] = forecastData.properties.periods
        .filter((p: ForecastPeriod) => p.isDaytime)
        .slice(0, 5);

      setWeatherData({
        location: locationName,
        current,
        forecast,
        precipitationHistory,
        totalPrecipitation48h
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => {
        setError('Unable to get your location. Please search for a city.');
        setLoading(false);
      }
    );
  }, [fetchWeatherData]);

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

  // Handle search input
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
    fetchWeatherData({ lat: location.lat, lon: location.lon });
  };

  // Get precipitation history data for display
  const getPrecipitationData = () => {
    if (!weatherData?.precipitationHistory) return [];
    
    // Group by 6-hour periods for better visualization
    const sortedData = [...weatherData.precipitationHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedData.map(obs => ({
      time: formatHour(obs.timestamp),
      date: formatDate(obs.timestamp),
      precipitation: obs.precipitation,
      description: obs.description
    }));
  };

  // Convert mm to inches
  const mmToInches = (mm: number) => (mm * 0.0393701).toFixed(2);

  // Get max precipitation value
  const getMaxPrecipitation = () => {
    if (!weatherData?.precipitationHistory || weatherData.precipitationHistory.length === 0) return 0;
    return Math.max(...weatherData.precipitationHistory.map(h => h.precipitation));
  };

  // Load weather on mount using geolocation
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🌤️ Weather
          </h1>
          <p className="text-blue-100">Powered by National Weather Service</p>
        </header>

        {/* Search Section */}
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
              onClick={getCurrentLocation}
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Loading weather data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <p className="text-white text-lg">⚠️ {error}</p>
            <button
              onClick={getCurrentLocation}
              className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Weather Display */}
        {weatherData && !loading && (
          <div className="space-y-6">
            {/* Current Weather Card */}
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">
                  {weatherData.location}
                </h2>
                <p className="text-blue-100 mb-6">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="text-7xl md:text-8xl">
                    {getWeatherEmoji(weatherData.current.shortForecast)}
                  </span>
                  <div className="text-left">
                    <p className="text-6xl md:text-7xl font-light text-white">
                      {weatherData.current.temperature}°
                      <span className="text-3xl">{weatherData.current.temperatureUnit}</span>
                    </p>
                    <p className="text-xl text-blue-100">
                      {weatherData.current.shortForecast}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <span>💨</span>
                    <span>{weatherData.current.windSpeed} {weatherData.current.windDirection}</span>
                  </div>
                  {weatherData.current.humidity && (
                    <div className="flex items-center gap-2">
                      <span>💧</span>
                      <span>{weatherData.current.humidity}% humidity</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-4">5-Day Forecast</h3>
              <div className="grid grid-cols-5 gap-2 md:gap-4">
                {weatherData.forecast.map((day, index) => (
                  <div 
                    key={index}
                    className="bg-white/10 rounded-2xl p-3 md:p-4 text-center hover:bg-white/20 transition-colors"
                  >
                    <p className="text-blue-100 text-sm mb-2">
                      {index === 0 ? 'Today' : formatDay(day.startTime)}
                    </p>
                    <p className="text-3xl md:text-4xl mb-2">
                      {getWeatherEmoji(day.shortForecast, true)}
                    </p>
                    <p className="text-2xl font-semibold text-white">
                      {day.temperature}°
                    </p>
                    <p className="text-xs text-blue-100 mt-1 hidden md:block truncate">
                      {day.shortForecast}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Precipitation Toggle Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowPrecipitation(!showPrecipitation)}
                className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
                  showPrecipitation 
                    ? 'bg-white text-blue-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                🌧️ {showPrecipitation ? 'Hide' : 'Show'} 48-Hour Precipitation
                {getMaxPrecipitation() > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    Max: {getMaxPrecipitation()}%
                  </span>
                )}
              </button>
            </div>

            {/* 48-Hour Precipitation Chart */}
            {showPrecipitation && (
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-white mb-4">
                  48-Hour Precipitation Probability
                </h3>
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Chart */}
                    <div className="h-48 flex items-end gap-1 mb-2">
                      {getPrecipitationData().map((hour, index) => (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center group relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {hour.date} {hour.time}<br/>
                            {hour.probability}% chance<br/>
                            {hour.forecast}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className={`w-full rounded-t transition-all ${
                              hour.probability > 60 ? 'bg-blue-400' :
                              hour.probability > 30 ? 'bg-blue-300' :
                              hour.probability > 0 ? 'bg-blue-200' :
                              'bg-white/20'
                            }`}
                            style={{ height: `${Math.max(hour.probability, 2)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Time labels */}
                    <div className="flex gap-1 text-xs text-blue-100">
                      {getPrecipitationData().filter((_, i) => i % 6 === 0).map((hour, index) => (
                        <div 
                          key={index} 
                          className="flex-1"
                          style={{ marginLeft: index === 0 ? 0 : 'calc(20% - 1rem)' }}
                        >
                          {hour.time}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span>&gt;60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-300 rounded"></div>
                    <span>31-60%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-200 rounded"></div>
                    <span>1-30%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/20 rounded"></div>
                    <span>0%</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 p-4 bg-white/10 rounded-xl">
                  <p className="text-white text-center">
                    <span className="font-semibold">Next 48 Hours:</span>{' '}
                    {weatherData.hourlyForecast.filter(h => h.probabilityOfPrecipitation > 30).length} hours 
                    with &gt;30% precipitation chance
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <footer className="text-center text-blue-100 text-sm py-4">
              <p>Data provided by the National Weather Service (NWS)</p>
              <p className="text-xs mt-1 opacity-75">US locations only</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
