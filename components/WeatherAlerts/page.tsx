'use client';

import { useState } from 'react';
import { WeatherAlert } from '@/app/types/weather';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
}

function getSeverityStyle(severity: string) {
  switch (severity.toLowerCase()) {
    case 'extreme':
      return { bg: 'bg-red-600/40 border-red-400/60', text: 'text-red-100', badge: 'bg-red-500', icon: '🚨' };
    case 'severe':
      return { bg: 'bg-orange-500/30 border-orange-400/50', text: 'text-orange-100', badge: 'bg-orange-500', icon: '⚠️' };
    case 'moderate':
      return { bg: 'bg-yellow-500/20 border-yellow-400/40', text: 'text-yellow-100', badge: 'bg-yellow-500', icon: '⚡' };
    default:
      return { bg: 'bg-blue-500/20 border-blue-400/30', text: 'text-blue-100', badge: 'bg-blue-500', icon: 'ℹ️' };
  }
}

export default function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const style = getSeverityStyle(alert.severity);
        const isOpen = expanded === alert.id;
        return (
          <div key={alert.id} className={`${style.bg} border backdrop-blur-sm rounded-2xl overflow-hidden`}>
            <button
              onClick={() => setExpanded(isOpen ? null : alert.id)}
              className="w-full px-5 py-4 flex items-start gap-3 text-left"
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge} text-white uppercase tracking-wide`}>
                    {alert.severity}
                  </span>
                  <p className={`font-semibold ${style.text}`}>{alert.event}</p>
                </div>
                <p className={`text-sm mt-0.5 opacity-80 ${style.text} truncate`}>{alert.areaDesc}</p>
              </div>
              <span className={`text-lg flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${style.text}`}>▾</span>
            </button>
            {isOpen && (
              <div className={`px-5 pb-4 text-sm ${style.text} space-y-2`}>
                {alert.headline && <p className="font-medium">{alert.headline}</p>}
                <p className="opacity-80 whitespace-pre-line text-xs leading-relaxed">
                  {alert.description.length > 800 ? alert.description.slice(0, 800) + '…' : alert.description}
                </p>
                <div className="flex gap-4 text-xs opacity-60 pt-1 flex-wrap">
                  {alert.onset && <span>Onset: {new Date(alert.onset).toLocaleString()}</span>}
                  {alert.expires && <span>Expires: {new Date(alert.expires).toLocaleString()}</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
