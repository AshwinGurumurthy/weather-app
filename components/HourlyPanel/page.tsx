'use client';

import { HourlyForecast } from '@/app/types/weather';
import { getWeatherEmoji, formatHour, formatDay, formatDate, mmToInches } from '@/app/utils/weather';

interface HourlyPanelProps {
  hours: HourlyForecast[];
  dayStartTime: string;
  dayIndex: number;
  displayTemp: (f: number) => number;
  tempUnit: string;
  onClose: () => void;
}

export default function HourlyPanel({
  hours,
  dayStartTime,
  dayIndex,
  displayTemp,
  tempUnit,
  onClose,
}: HourlyPanelProps) {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">
          Hourly — {dayIndex === 0 ? 'Today' : formatDay(dayStartTime)},{' '}
          {formatDate(dayStartTime)}
        </h3>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
          {hours.map((hour, index) => {
            const hourNum = new Date(hour.startTime).getHours();
            const isDayHour = hourNum >= 6 && hourNum < 20;
            const precipIn = parseFloat(mmToInches(hour.precipitationMm));
            return (
              <div
                key={index}
                className="bg-white/10 rounded-xl p-3 text-center min-w-[80px] hover:bg-white/20 transition-colors"
              >
                <p className="text-blue-100 text-xs mb-1">{formatHour(hour.startTime)}</p>
                <p className="text-2xl mb-1">{getWeatherEmoji(hour.shortForecast, isDayHour)}</p>
                <p className="text-xl font-semibold text-white mb-0.5">
                  {displayTemp(hour.temperature)}°{tempUnit}
                </p>
                <p className="text-xs text-blue-200 truncate max-w-[80px]" title={hour.shortForecast}>
                  {hour.shortForecast}
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-blue-100 space-y-0.5">
                  <p>💨 {hour.windSpeed}</p>
                  {hour.probabilityOfPrecipitation > 0 && (
                    <p>🌧️ {hour.probabilityOfPrecipitation}%</p>
                  )}
                  {precipIn >= 0.01 && (
                    <p>💧 {precipIn.toFixed(2)}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hours.length === 0 && (
        <p className="text-center text-blue-100 py-4">No hourly data available for this day</p>
      )}
    </div>
  );
}
