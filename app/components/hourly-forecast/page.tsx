'use client';

import { HourlyForecast as HourlyForecastType, ForecastPeriod } from '../../types/weather';
import { getWeatherEmoji, formatDay, formatDate, formatHour } from '../../utils/weather';

interface HourlyForecastProps {
  hourlyForecast: HourlyForecastType[];
  forecast: ForecastPeriod[];
  selectedDayIndex: number;
  onClose: () => void;
}

export default function HourlyForecast({ hourlyForecast, forecast, selectedDayIndex, onClose }: HourlyForecastProps) {
  // Get hourly forecast for a specific day
  const getHourlyForDay = () => {
    if (!hourlyForecast || !forecast[selectedDayIndex]) return [];
    
    const dayStart = new Date(forecast[selectedDayIndex].startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    return hourlyForecast.filter(hour => {
      const hourTime = new Date(hour.startTime);
      return hourTime >= dayStart && hourTime < dayEnd;
    });
  };

  const hourlyData = getHourlyForDay();

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">
          ⏰ Hourly Forecast - {selectedDayIndex === 0 ? 'Today' : formatDay(forecast[selectedDayIndex].startTime)}, {formatDate(forecast[selectedDayIndex].startTime)}
        </h3>
        <button 
          onClick={onClose}
          className="text-white/70 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
          {hourlyData.map((hour, index) => (
            <div 
              key={index}
              className="bg-white/10 rounded-xl p-3 text-center min-w-[80px] hover:bg-white/20 transition-colors"
            >
              <p className="text-blue-100 text-xs mb-1">
                {formatHour(hour.startTime)}
              </p>
              <p className="text-2xl mb-1">
                {getWeatherEmoji(hour.shortForecast, new Date(hour.startTime).getHours() >= 6 && new Date(hour.startTime).getHours() < 20)}
              </p>
              <p className="text-xl font-semibold text-white mb-1">
                {hour.temperature}°
              </p>
              <p className="text-xs text-blue-200 truncate max-w-[80px]" title={hour.shortForecast}>
                {hour.shortForecast}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-blue-100">
                <p>💨 {hour.windSpeed}</p>
                {hour.probabilityOfPrecipitation > 0 && (
                  <p>🌧️ {hour.probabilityOfPrecipitation}%</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {hourlyData.length === 0 && (
        <p className="text-center text-blue-100 py-4">
          No hourly data available for this day
        </p>
      )}
    </div>
  );
}
