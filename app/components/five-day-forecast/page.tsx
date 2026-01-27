'use client';

import { ForecastPeriod } from '../../types/weather';
import { getWeatherEmoji, formatDay } from '../../utils/weather';

interface FiveDayForecastProps {
  forecast: ForecastPeriod[];
  selectedDayIndex: number | null;
  onDaySelect: (index: number | null) => void;
}

export default function FiveDayForecast({ forecast, selectedDayIndex, onDaySelect }: FiveDayForecastProps) {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-2">5-Day Forecast</h3>
      <p className="text-blue-100 text-sm mb-4">Click a day for hourly details</p>
      <div className="grid grid-cols-5 gap-2 md:gap-4">
        {forecast.map((day, index) => (
          <button 
            key={index}
            onClick={() => onDaySelect(selectedDayIndex === index ? null : index)}
            className={`rounded-2xl p-3 md:p-4 text-center transition-all cursor-pointer ${
              selectedDayIndex === index 
                ? 'bg-white/30 ring-2 ring-white' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
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
          </button>
        ))}
      </div>
    </div>
  );
}
