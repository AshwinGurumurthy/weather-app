'use client';

import { ForecastPeriod } from '@/app/types/weather';
import { getWeatherEmoji, formatDay, formatDate } from '@/app/utils/weather';

interface ForecastGridProps {
  forecast: ForecastPeriod[];
  nightForecast: ForecastPeriod[];
  selectedDayIndex: number | null;
  onSelectDay: (index: number | null) => void;
  displayTemp: (f: number) => number;
}

export default function ForecastGrid({
  forecast,
  nightForecast,
  selectedDayIndex,
  onSelectDay,
  displayTemp,
}: ForecastGridProps) {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-1">5-Day Forecast</h3>
      <p className="text-blue-100 text-sm mb-4">Tap a day for hourly breakdown</p>
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {forecast.map((day, index) => {
          const night = nightForecast[index];
          return (
            <button
              key={index}
              onClick={() => onSelectDay(selectedDayIndex === index ? null : index)}
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
  );
}
