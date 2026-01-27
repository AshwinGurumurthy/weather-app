'use client';

export default function WeatherHeader() {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
        🌤️ Weather
      </h1>
      <p className="text-blue-100">Powered by National Weather Service</p>
    </header>
  );
}
