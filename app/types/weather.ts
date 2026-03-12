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
  precipitationMm: number;
}

export interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast: ForecastPeriod[];
  nightForecast: ForecastPeriod[];
  hourlyForecast: HourlyForecast[];
  dailyPrecipMm: number[];
  lastUpdated: Date;
}

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  onset: string;
  expires: string;
  areaDesc: string;
}

export interface AQIData {
  usAqi: number;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
}
