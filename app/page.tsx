'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coordinates, LocationResult, WeatherData } from './types/weather';
import { getBackgroundGradient, toC, NWS_HEADER } from './utils/weather';
import SearchBar from '@/components/SearchBar/page';
import CurrentWeather from '@/components/CurrentWeather/page';
import ForecastGrid from '@/components/ForecastGrid/page';
import HourlyPanel from '@/components/HourlyPanel/page';

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
      const periods = forecastData.properties.periods;
      const currentPeriod = periods[0];

      let feelsLike: number | null = null;
      let hourlyForecast = [];

      if (hourlyResponse.ok) {
        const hourlyData = await hourlyResponse.json();
        const firstHour = hourlyData.properties.periods[0];

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
          humidity: currentPeriod.relativeHumidity?.value ?? null,
          feelsLike,
          isDaytime: currentPeriod.isDaytime,
        },
        forecast: periods.filter((p: any) => p.isDaytime).slice(0, 5),
        nightForecast: periods.filter((p: any) => !p.isDaytime).slice(0, 5),
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
    if (query.length < 2) { setSearchResults([]); return; }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'SkyViewWeatherApp/1.0' } }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(
          data
            .filter((item: any) => item.address && (item.address.city || item.address.town || item.address.village || item.address.county))
            .map((item: any) => ({
              name: item.address.city || item.address.town || item.address.village || item.address.county || item.display_name.split(',')[0],
              state: item.address.state || '',
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            }))
        );
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) searchLocations(searchQuery); }, 300);
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
    return weatherData.hourlyForecast.filter(h => {
      const t = new Date(h.startTime);
      return t >= dayStart && t < dayEnd;
    });
  };

  useEffect(() => { getCurrentLocation(); }, [getCurrentLocation]);

  const gradient = weatherData
    ? getBackgroundGradient(weatherData.current.shortForecast, weatherData.current.isDaytime)
    : 'from-blue-400 via-blue-500 to-purple-600';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} transition-all duration-1000 p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto">

        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-1">SkyView</h1>
          <p className="text-blue-100 text-sm">Powered by National Weather Service · US Locations Only</p>
        </header>

        <SearchBar
          searchQuery={searchQuery}
          onQueryChange={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          onSelectLocation={selectLocation}
          onGetLocation={getCurrentLocation}
          isCelsius={isCelsius}
          onToggleUnit={() => setIsCelsius(c => !c)}
        />

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white text-lg">Fetching weather data...</p>
          </div>
        )}

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

        {!weatherData && !loading && !error && (
          <div className="text-center py-16">
            <p className="text-7xl mb-4">🌤️</p>
            <p className="text-white text-xl mb-2 font-medium">Check the weather anywhere in the US</p>
            <p className="text-blue-100 text-sm">Search for a city or click My Location</p>
          </div>
        )}

        {weatherData && !loading && (
          <div className="space-y-6">
            <CurrentWeather
              location={weatherData.location}
              current={weatherData.current}
              displayTemp={displayTemp}
              tempUnit={tempUnit}
              lastUpdated={weatherData.lastUpdated}
            />

            <ForecastGrid
              forecast={weatherData.forecast}
              nightForecast={weatherData.nightForecast}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={setSelectedDayIndex}
              displayTemp={displayTemp}
            />

            {selectedDayIndex !== null && (
              <HourlyPanel
                hours={getHourlyForDay(selectedDayIndex)}
                dayStartTime={weatherData.forecast[selectedDayIndex].startTime}
                dayIndex={selectedDayIndex}
                displayTemp={displayTemp}
                tempUnit={tempUnit}
                onClose={() => setSelectedDayIndex(null)}
              />
            )}

            <footer className="text-center text-blue-100 text-sm py-4">
              <p>
                Data provided by the{' '}
                <a href="https://www.weather.gov" target="_blank" rel="noopener noreferrer" className="underline opacity-75 hover:opacity-100 transition-opacity">
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
