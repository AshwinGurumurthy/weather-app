'use client';

import { CurrentWeather as CurrentWeatherType } from '@/app/types/weather';
import { getWeatherEmoji } from '@/app/utils/weather';

interface CurrentWeatherProps {
  location: string;
  current: CurrentWeatherType;
  displayTemp: (f: number) => number;
  tempUnit: string;
  lastUpdated: Date;
}

export default function CurrentWeather({
  location,
  current,
  displayTemp,
  tempUnit,
  lastUpdated,
}: CurrentWeatherProps) {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">
          📍 {location}
        </h2>
        <p className="text-blue-100 mb-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-blue-200 text-xs mb-6">
          Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-7xl md:text-8xl">
            {getWeatherEmoji(current.shortForecast, current.isDaytime)}
          </span>
          <div className="text-left">
            <p className="text-6xl md:text-7xl font-light text-white leading-none">
              {displayTemp(current.temperature)}°
              <span className="text-3xl">{tempUnit}</span>
            </p>
            <p className="text-xl text-blue-100 mt-1">{current.shortForecast}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4 md:gap-8 text-blue-100 flex-wrap text-sm md:text-base">
          <div className="flex items-center gap-2">
            <span>💨</span>
            <span>{current.windSpeed} {current.windDirection}</span>
          </div>
          {current.humidity != null && (
            <div className="flex items-center gap-2">
              <span>💧</span>
              <span>{current.humidity}% humidity</span>
            </div>
          )}
          {current.feelsLike != null && (
            <div className="flex items-center gap-2">
              <span>🌡️</span>
              <span>Feels like {displayTemp(current.feelsLike)}°{tempUnit}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
