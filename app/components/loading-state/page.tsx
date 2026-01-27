'use client';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
      <p className="text-white text-lg">Loading weather data...</p>
    </div>
  );
}
