'use client';

import { CurrentWeather as CurrentWeatherType } from '../../types/weather';
import { getWeatherEmoji } from '../../utils/weather';

interface CurrentWeatherProps {
  location: string;
  current: CurrentWeatherType;
}

export default function CurrentWeather({ location, current }: CurrentWeatherProps) {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">
          {location}
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
            {getWeatherEmoji(current.shortForecast)}
          </span>
          <div className="text-left">
            <p className="text-6xl md:text-7xl font-light text-white">
              {current.temperature}°
              <span className="text-3xl">{current.temperatureUnit}</span>
            </p>
            <p className="text-xl text-blue-100">
              {current.shortForecast}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-6 text-blue-100">
          <div className="flex items-center gap-2">
            <span>💨</span>
            <span>{current.windSpeed} {current.windDirection}</span>
          </div>
          {current.humidity && (
            <div className="flex items-center gap-2">
              <span>💧</span>
              <span>{current.humidity}% humidity</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
