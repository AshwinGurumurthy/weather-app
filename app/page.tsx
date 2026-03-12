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
  windSpeed: string;
  windDirection: string;
  humidity: number | null;
  feelsLike: number | null;
  isDaytime: boolean;
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
  isDaytime: boolean;
  windSpeed: string;
  windDirection: string;
}

interface HourlyForecast {
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  probabilityOfPrecipitation: number;
}

interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast: ForecastPeriod[];
  nightForecast: ForecastPeriod[];
  hourlyForecast: HourlyForecast[];
  lastUpdated: Date;
}

// Helpers
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

const getBackgroundGradient = (forecast: string, isDaytime: boolean): string => {
  if (!isDaytime) return 'from-indigo-950 via-blue-950 to-slate-900';
  const lower = forecast.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return 'from-gray-700 via-slate-600 to-gray-900';
  if (lower.includes('rain') || lower.includes('shower')) return 'from-slate-600 via-blue-700 to-slate-800';
  if (lower.includes('snow') || lower.includes('flurr') || lower.includes('sleet')) return 'from-blue-300 via-blue-500 to-indigo-600';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return 'from-gray-500 via-blue-500 to-gray-600';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'from-gray-500 via-blue-600 to-slate-700';
  if (lower.includes('partly')) return 'from-blue-400 via-sky-500 to-blue-600';
  return 'from-sky-400 via-blue-500 to-indigo-500';
};

const formatDay = (dateString: string): string => {
  const date = new Date(dateString);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatHour = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

const toC = (f: number) => Math.round((f - 32) * 5 / 9);

const NWS_HEADER = { 'User-Agent': 'SkyView Weather App (https://skyview.weather)' };

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [isCelsius, setIsCelsius] = useState(false);

  const displayTemp = (f: number) => isCelsius ? toC(f) : f;
  const tempUnit = isCelsius ? 'C' : 'F';

  const fetchWeatherData = useCallback(async (coords: Coordinates) => {
    setLoading(true);
    setError(null);
    setSelectedDayIndex(null);

    try {
      const pointsResponse = await fetch(
        `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`,
        { headers: NWS_HEADER }
      );

      if (!pointsResponse.ok) {
        throw new Error('Location not supported. SkyView uses the US National Weather Service and only covers US locations.');
      }

      const pointsData = await pointsResponse.json();
      const locationName = `${pointsData.properties.relativeLocation.properties.city}, ${pointsData.properties.relativeLocation.properties.state}`;

      const [forecastResponse, hourlyResponse] = await Promise.all([
        fetch(pointsData.properties.forecast, { headers: NWS_HEADER }),
        fetch(pointsData.properties.forecastHourly, { headers: NWS_HEADER }),
      ]);

      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast data');

      const forecastData = await forecastResponse.json();
      const periods: ForecastPeriod[] = forecastData.properties.periods;

      const currentPeriod = periods[0];

      // Extract hourly data and feels-like temperature
      let feelsLike: number | null = null;
      let hourlyForecast: HourlyForecast[] = [];

      if (hourlyResponse.ok) {
        const hourlyData = await hourlyResponse.json();
        const firstHour = hourlyData.properties.periods[0];

        // NWS returns apparentTemperature in Celsius; convert to °F
        if (firstHour?.apparentTemperature?.value != null) {
          feelsLike = Math.round(firstHour.apparentTemperature.value * 9 / 5 + 32);
        }

        hourlyForecast = hourlyData.properties.periods
          .slice(0, 156)
          .map((p: any) => ({
            startTime: p.startTime,
            temperature: p.temperature,
            temperatureUnit: p.temperatureUnit,
            shortForecast: p.shortForecast,
            windSpeed: p.windSpeed,
            windDirection: p.windDirection,
            probabilityOfPrecipitation: p.probabilityOfPrecipitation?.value || 0,
          }));
      }

      setWeatherData({
        location: locationName,
        current: {
          temperature: currentPeriod.temperature,
          temperatureUnit: currentPeriod.temperatureUnit,
          shortForecast: currentPeriod.shortForecast,
          windSpeed: currentPeriod.windSpeed,
          windDirection: currentPeriod.windDirection,
          humidity: (currentPeriod as any).relativeHumidity?.value ?? null,
          feelsLike,
          isDaytime: currentPeriod.isDaytime,
        },
        forecast: periods.filter(p => p.isDaytime).slice(0, 5),
        nightForecast: periods.filter(p => !p.isDaytime).slice(0, 5),
        hourlyForecast,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions or search for a city.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Please search for a city.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again or search for a city.');
            break;
          default:
            setError('Unable to get your location. Please search for a city.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchWeatherData]);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'SkyViewWeatherApp/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        const results: LocationResult[] = data
          .filter((item: any) => item.address && (item.address.city || item.address.town || item.address.village || item.address.county))
          .map((item: any) => ({
            name: item.address.city || item.address.town || item.address.village || item.address.county || item.display_name.split(',')[0],
            state: item.address.state || '',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }));
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchLocations(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLocation = (location: LocationResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    fetchWeatherData({ lat: location.lat, lon: location.lon });
  };

  const getHourlyForDay = (dayIndex: number) => {
    if (!weatherData?.hourlyForecast || !weatherData?.forecast[dayIndex]) return [];
    const dayStart = new Date(weatherData.forecast[dayIndex].startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return weatherData.hourlyForecast.filter(hour => {
      const t = new Date(hour.startTime);
      return t >= dayStart && t < dayEnd;
    });
  };

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const gradient = weatherData
    ? getBackgroundGradient(weatherData.current.shortForecast, weatherData.current.isDaytime)
    : 'from-blue-400 via-blue-500 to-purple-600';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} transition-all duration-1000 p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-1">
            SkyView
          </h1>
          <p className="text-blue-100 text-sm">Powered by National Weather Service · US Locations Only</p>
        </header>

        {/* Search + Controls */}
        <div className="relative mb-8">
          <div className="flex gap-2 justify-center flex-wrap">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search for a US city..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
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
              title="Use current location"
              className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-800"
            >
              <span>📍</span>
              <span className="hidden sm:inline">My Location</span>
            </button>

            <button
              onClick={() => setIsCelsius(c => !c)}
              title="Toggle temperature unit"
              className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors text-gray-800 font-semibold min-w-[56px]"
            >
              °{isCelsius ? 'F' : 'C'}
            </button>
          </div>
        </div>

        {/* Close search on outside click */}
        {showSearch && (
          <div className="fixed inset-0 z-0" onClick={() => setShowSearch(false)} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white text-lg">Fetching weather data...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-red-400/30">
            <p className="text-white text-lg mb-2">⚠️ {error}</p>
            <button
              onClick={getCurrentLocation}
              className="mt-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Welcome state */}
        {!weatherData && !loading && !error && (
          <div className="text-center py-16">
            <p className="text-7xl mb-4">🌤️</p>
            <p className="text-white text-xl mb-2 font-medium">Check the weather anywhere in the US</p>
            <p className="text-blue-100 text-sm">Search for a city or click My Location</p>
          </div>
        )}

        {/* Weather display */}
        {weatherData && !loading && (
          <div className="space-y-6">

            {/* Current weather */}
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">
                  📍 {weatherData.location}
                </h2>
                <p className="text-blue-100 mb-0.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-blue-200 text-xs mb-6">
                  Updated {weatherData.lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className="text-7xl md:text-8xl">
                    {getWeatherEmoji(weatherData.current.shortForecast, weatherData.current.isDaytime)}
                  </span>
                  <div className="text-left">
                    <p className="text-6xl md:text-7xl font-light text-white leading-none">
                      {displayTemp(weatherData.current.temperature)}°
                      <span className="text-3xl">{tempUnit}</span>
                    </p>
                    <p className="text-xl text-blue-100 mt-1">
                      {weatherData.current.shortForecast}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-4 md:gap-8 text-blue-100 flex-wrap text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <span>💨</span>
                    <span>{weatherData.current.windSpeed} {weatherData.current.windDirection}</span>
                  </div>
                  {weatherData.current.humidity != null && (
                    <div className="flex items-center gap-2">
                      <span>💧</span>
                      <span>{weatherData.current.humidity}% humidity</span>
                    </div>
                  )}
                  {weatherData.current.feelsLike != null && (
                    <div className="flex items-center gap-2">
                      <span>🌡️</span>
                      <span>Feels like {displayTemp(weatherData.current.feelsLike)}°{tempUnit}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5-Day forecast */}
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-1">5-Day Forecast</h3>
              <p className="text-blue-100 text-sm mb-4">Tap a day for hourly breakdown</p>
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                {weatherData.forecast.map((day, index) => {
                  const night = weatherData.nightForecast[index];
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDayIndex(selectedDayIndex === index ? null : index)}
                      className={`rounded-2xl p-3 md:p-4 text-center transition-all cursor-pointer ${
                        selectedDayIndex === index
                          ? 'bg-white/30 ring-2 ring-white shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <p className="text-blue-100 text-sm font-medium mb-0.5">
                        {index === 0 ? 'Today' : formatDay(day.startTime)}
                      </p>
                      <p className="text-blue-200 text-xs mb-2">{formatDate(day.startTime)}</p>
                      <p className="text-3xl md:text-4xl mb-2">
                        {getWeatherEmoji(day.shortForecast, true)}
                      </p>
                      <p className="text-xl font-semibold text-white">
                        {displayTemp(day.temperature)}°
                      </p>
                      {night && (
                        <p className="text-sm text-blue-300">
                          {displayTemp(night.temperature)}°
                        </p>
                      )}
                      <p className="text-xs text-blue-100 mt-1 hidden md:block truncate">
                        {day.shortForecast}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hourly forecast */}
            {selectedDayIndex !== null && (
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    Hourly — {selectedDayIndex === 0 ? 'Today' : formatDay(weatherData.forecast[selectedDayIndex].startTime)},{' '}
                    {formatDate(weatherData.forecast[selectedDayIndex].startTime)}
                  </h3>
                  <button
                    onClick={() => setSelectedDayIndex(null)}
                    className="text-white/70 hover:text-white text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                    {getHourlyForDay(selectedDayIndex).map((hour, index) => {
                      const hourNum = new Date(hour.startTime).getHours();
                      const isDayHour = hourNum >= 6 && hourNum < 20;
                      return (
                        <div
                          key={index}
                          className="bg-white/10 rounded-xl p-3 text-center min-w-[80px] hover:bg-white/20 transition-colors"
                        >
                          <p className="text-blue-100 text-xs mb-1">{formatHour(hour.startTime)}</p>
                          <p className="text-2xl mb-1">{getWeatherEmoji(hour.shortForecast, isDayHour)}</p>
                          <p className="text-xl font-semibold text-white mb-1">
                            {displayTemp(hour.temperature)}°
                          </p>
                          <p className="text-xs text-blue-200 truncate max-w-[80px]" title={hour.shortForecast}>
                            {hour.shortForecast}
                          </p>
                          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-blue-100 space-y-0.5">
                            <p>💨 {hour.windSpeed}</p>
                            {hour.probabilityOfPrecipitation > 0 && (
                              <p>🌧️ {hour.probabilityOfPrecipitation}%</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {getHourlyForDay(selectedDayIndex).length === 0 && (
                  <p className="text-center text-blue-100 py-4">No hourly data available for this day</p>
                )}
              </div>
            )}

            {/* Footer */}
            <footer className="text-center text-blue-100 text-sm py-4">
              <p>
                Data provided by the{' '}
                <a
                  href="https://www.weather.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline opacity-75 hover:opacity-100 transition-opacity"
                >
                  National Weather Service
                </a>
              </p>
              <p className="text-xs mt-1 opacity-60">US locations only · Free &amp; open data</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
