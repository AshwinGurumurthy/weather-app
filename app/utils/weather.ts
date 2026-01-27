// Weather Utility Functions

// Weather icon mapping
export const getWeatherEmoji = (forecast: string, isDaytime: boolean = true): string => {
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

// Format date for display
export const formatDay = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatHour = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

// Convert mm to inches
export const mmToInches = (mm: number): string => (mm * 0.0393701).toFixed(2);
