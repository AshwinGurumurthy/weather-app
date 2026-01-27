'use client';

import { PrecipitationObservation } from '../../types/weather';
import { formatHour, formatDate, mmToInches } from '../../utils/weather';

interface PrecipitationHistoryProps {
  precipitationHistory: PrecipitationObservation[];
  totalPrecipitation48h: number;
  isVisible: boolean;
  onToggle: () => void;
}

export default function PrecipitationHistory({ 
  precipitationHistory, 
  totalPrecipitation48h, 
  isVisible, 
  onToggle 
}: PrecipitationHistoryProps) {
  // Get precipitation data for display
  const getPrecipitationData = () => {
    if (!precipitationHistory) return [];
    
    const sortedData = [...precipitationHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedData.map(obs => ({
      time: formatHour(obs.timestamp),
      date: formatDate(obs.timestamp),
      precipitation: obs.precipitation,
      description: obs.description
    }));
  };

  // Get max precipitation value
  const getMaxPrecipitation = () => {
    if (!precipitationHistory || precipitationHistory.length === 0) return 0;
    return Math.max(...precipitationHistory.map(h => h.precipitation));
  };

  const precipData = getPrecipitationData();
  const maxPrecip = getMaxPrecipitation();

  return (
    <>
      {/* Precipitation Toggle Button */}
      <div className="flex justify-center">
        <button
          onClick={onToggle}
          className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
            isVisible 
              ? 'bg-white text-blue-600' 
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          🌧️ {isVisible ? 'Hide' : 'Show'} Past 48-Hour Precipitation
          {totalPrecipitation48h > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              Total: {mmToInches(totalPrecipitation48h)}&quot;
            </span>
          )}
        </button>
      </div>

      {/* 48-Hour Precipitation History */}
      {isVisible && (
        <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-white mb-4">
            📊 Past 48-Hour Precipitation
          </h3>
          
          {/* Total Summary Card */}
          <div className="bg-white/10 rounded-2xl p-6 mb-6 text-center">
            <p className="text-blue-100 mb-2">Total Precipitation (Last 48 Hours)</p>
            <p className="text-5xl font-bold text-white mb-2">
              {mmToInches(totalPrecipitation48h)}&quot;
            </p>
            <p className="text-blue-200 text-sm">
              ({totalPrecipitation48h.toFixed(1)} mm)
            </p>
          </div>

          {precipData.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Chart */}
                  <div className="h-48 flex items-end gap-1 mb-2 bg-white/5 rounded-lg p-2">
                    {precipData.map((obs, index) => {
                      // If no precipitation at all, show equal small bars; otherwise scale by max
                      const heightPercent = maxPrecip > 0 
                        ? (obs.precipitation / maxPrecip) * 100 
                        : 5; // Show small bars when no precip
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center group relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {obs.date} {obs.time}<br/>
                            {obs.precipitation > 0 
                              ? `${mmToInches(obs.precipitation)}" (${obs.precipitation.toFixed(1)} mm)`
                              : 'No precipitation'
                            }<br/>
                            {obs.description || 'No description'}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className={`w-full rounded-t transition-all min-h-[4px] ${
                              obs.precipitation > 5 ? 'bg-blue-400' :
                              obs.precipitation > 2 ? 'bg-blue-300' :
                              obs.precipitation > 0 ? 'bg-blue-200' :
                              'bg-white/20'
                            }`}
                            style={{ height: `${Math.max(heightPercent, 3)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Time labels */}
                  <div className="flex justify-between text-xs text-blue-100 mt-2">
                    <span>48 hours ago</span>
                    <span>24 hours ago</span>
                    <span>Now</span>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <span>&gt;5mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-300 rounded"></div>
                  <span>2-5mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
                  <span>&lt;2mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white/10 rounded"></div>
                  <span>None</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-blue-100 text-sm">Observations</p>
                  <p className="text-2xl font-semibold text-white">
                    {precipitationHistory.length}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-blue-100 text-sm">Max Hourly</p>
                  <p className="text-2xl font-semibold text-white">
                    {mmToInches(maxPrecip)}&quot;
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-6xl mb-4">☀️</p>
              <p className="text-white text-lg">No precipitation recorded</p>
              <p className="text-blue-200 text-sm mt-2">
                No measurable precipitation in the past 48 hours
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
