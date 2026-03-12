'use client';

import { AQIData } from '@/app/types/weather';

interface AQICardProps {
  aqi: AQIData;
}

function getAQILevel(value: number) {
  if (value <= 50)  return { label: 'Good',                          color: 'text-green-300',  bar: 'bg-green-400',   emoji: '😊' };
  if (value <= 100) return { label: 'Moderate',                      color: 'text-yellow-300', bar: 'bg-yellow-400',  emoji: '😐' };
  if (value <= 150) return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-300', bar: 'bg-orange-400',  emoji: '😷' };
  if (value <= 200) return { label: 'Unhealthy',                      color: 'text-red-300',    bar: 'bg-red-400',     emoji: '🤢' };
  if (value <= 300) return { label: 'Very Unhealthy',                 color: 'text-purple-300', bar: 'bg-purple-400',  emoji: '☠️' };
  return             { label: 'Hazardous',                            color: 'text-rose-300',   bar: 'bg-rose-600',    emoji: '☠️' };
}

export default function AQICard({ aqi }: AQICardProps) {
  const level = getAQILevel(aqi.usAqi);
  const barWidth = Math.min((aqi.usAqi / 300) * 100, 100);

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-4">Air Quality</h3>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-4xl font-bold ${level.color}`}>{aqi.usAqi}</p>
          <p className={`text-sm font-medium mt-0.5 ${level.color}`}>{level.label}</p>
        </div>
        <span className="text-4xl">{level.emoji}</span>
      </div>

      <div className="w-full h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full ${level.bar} transition-all duration-700`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {aqi.pm25 != null && (
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">PM2.5</p>
            <p className="text-white font-medium">{aqi.pm25.toFixed(1)} <span className="text-blue-300 font-normal">µg/m³</span></p>
          </div>
        )}
        {aqi.pm10 != null && (
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">PM10</p>
            <p className="text-white font-medium">{aqi.pm10.toFixed(1)} <span className="text-blue-300 font-normal">µg/m³</span></p>
          </div>
        )}
        {aqi.ozone != null && (
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">Ozone (O₃)</p>
            <p className="text-white font-medium">{aqi.ozone.toFixed(1)} <span className="text-blue-300 font-normal">µg/m³</span></p>
          </div>
        )}
        {aqi.no2 != null && (
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">NO₂</p>
            <p className="text-white font-medium">{aqi.no2.toFixed(1)} <span className="text-blue-300 font-normal">µg/m³</span></p>
          </div>
        )}
      </div>

      <p className="text-xs text-blue-200 mt-3 text-center opacity-70">
        US AQI · Source: Copernicus CAMS via Open-Meteo
      </p>
    </div>
  );
}
