'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

interface WeatherMapProps {
  lat: number;
  lon: number;
}

type MapMode = 'precipitation' | 'satellite';

export default function WeatherMap({ lat, lon }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlayLayer = useRef<any>(null);
  const [mode, setMode] = useState<MapMode>('precipitation');
  const [mapReady, setMapReady] = useState(false);
  const [rainviewerData, setRainviewerData] = useState<{ host: string; radar: string; satellite: string } | null>(null);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => r.json())
      .then(data => {
        const radarPath = data.radar?.past?.at(-1)?.path;
        const satPath = data.satellite?.infrared?.at(-1)?.path;
        if (radarPath && satPath) {
          setRainviewerData({
            host: data.host || 'https://tilecache.rainviewer.com',
            radar: radarPath,
            satellite: satPath,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstance.current) return;

      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 7,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        opacity: 0.8,
      }).addTo(map);

      L.marker([lat, lon]).addTo(map);

      mapInstance.current = map;
      setMapReady(true);
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
      setMapReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update overlay when mode or data changes
  useEffect(() => {
    if (!mapInstance.current || !rainviewerData) return;

    import('leaflet').then(L => {
      if (!mapInstance.current) return;

      if (overlayLayer.current) {
        mapInstance.current.removeLayer(overlayLayer.current);
        overlayLayer.current = null;
      }

      const path = mode === 'precipitation' ? rainviewerData.radar : rainviewerData.satellite;
      const colorParam = mode === 'precipitation' ? '2/1_1' : '0/0_0';

      overlayLayer.current = L.tileLayer(
        `${rainviewerData.host}${path}/256/{z}/{x}/{y}/${colorParam}.png`,
        { opacity: 0.65, attribution: 'RainViewer' }
      ).addTo(mapInstance.current);
    });
  }, [mode, rainviewerData, mapReady]);

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Weather Map</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('precipitation')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'precipitation' ? 'bg-white/30 text-white' : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            🌧️ Radar
          </button>
          <button
            onClick={() => setMode('satellite')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'satellite' ? 'bg-white/30 text-white' : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            🛰️ Satellite
          </button>
        </div>
      </div>

      <div ref={mapRef} className="rounded-2xl overflow-hidden" style={{ height: '360px' }} />

      <p className="text-xs text-blue-200 mt-2 text-center opacity-70">
        {mode === 'precipitation' ? 'Precipitation radar' : 'Infrared cloud satellite'} · RainViewer · OpenStreetMap
      </p>
    </div>
  );
}
