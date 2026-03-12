export const NWS_HEADER = { 'User-Agent': 'SkyView Weather App (https://skyview.weather)' };

export const toC = (f: number) => Math.round((f - 32) * 5 / 9);

export const getWeatherEmoji = (forecast: string, isDaytime = true): string => {
  const lower = forecast.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return '⛈️';
  if (lower.includes('rain') && lower.includes('snow')) return '🌨️';
  if (lower.includes('rain') || lower.includes('shower')) return '🌧️';
  if (lower.includes('snow') || lower.includes('flurr')) return '❄️';
  if (lower.includes('sleet') || lower.includes('ice') || lower.includes('freez')) return '🌨️';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return '🌫️';
  if (lower.includes('cloud') || lower.includes('overcast')) return isDaytime ? '⛅' : '☁️';
  if (lower.includes('partly') || lower.includes('mostly sunny')) return isDaytime ? '🌤️' : '☁️';
  if (lower.includes('clear') || lower.includes('sunny')) return isDaytime ? '☀️' : '🌙';
  if (lower.includes('wind')) return '💨';
  return isDaytime ? '☀️' : '🌙';
};

export const getBackgroundGradient = (forecast: string, isDaytime: boolean): string => {
  if (!isDaytime) return 'from-indigo-950 via-blue-950 to-slate-900';
  const lower = forecast.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return 'from-gray-700 via-slate-600 to-gray-900';
  if (lower.includes('rain') || lower.includes('shower')) return 'from-slate-600 via-blue-700 to-slate-800';
  if (lower.includes('snow') || lower.includes('flurr') || lower.includes('sleet')) return 'from-blue-300 via-blue-500 to-indigo-600';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return 'from-gray-500 via-blue-500 to-gray-600';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'from-gray-500 via-blue-600 to-slate-700';
  if (lower.includes('partly')) return 'from-blue-400 via-sky-500 to-blue-600';
  return 'from-sky-400 via-blue-500 to-indigo-500';
};

export const formatDay = (dateString: string): string => {
  const date = new Date(dateString);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatHour = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

export const mmToInches = (mm: number): string => (mm * 0.0393701).toFixed(2);
