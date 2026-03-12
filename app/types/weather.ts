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
  windSpeed: string;
  windDirection: string;
  humidity: number | null;
  feelsLike: number | null;
  isDaytime: boolean;
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
  isDaytime: boolean;
  windSpeed: string;
  windDirection: string;
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
  nightForecast: ForecastPeriod[];
  hourlyForecast: HourlyForecast[];
  lastUpdated: Date;
}
