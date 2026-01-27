// Weather Types

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface LocationResult {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  icon: string;
  windSpeed: string;
  windDirection: string;
  humidity: number | null;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
  isDaytime: boolean;
  windSpeed: string;
  windDirection: string;
}

export interface PrecipitationObservation {
  timestamp: string;
  precipitation: number; // in mm
  description: string;
  hasData?: boolean; // whether the station reported precipitation data
}

export interface HourlyForecast {
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  probabilityOfPrecipitation: number;
}

export interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast: ForecastPeriod[];
  hourlyForecast: HourlyForecast[];
  precipitationHistory: PrecipitationObservation[];
  totalPrecipitation48h: number;
}
