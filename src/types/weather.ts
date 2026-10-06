export type WeatherConditionType = 
  | 'clear' 
  | 'partly_cloudy' 
  | 'cloudy' 
  | 'fog' 
  | 'drizzle' 
  | 'rain' 
  | 'heavy_rain' 
  | 'thunderstorm';

export interface HourlyRainItem {
  time: string;
  timeFormatted: string;
  timeFormattedTamil: string;
  probability: number; // 0-100%
  precipitationMm: number;
  condition: string;
  isRainLikely: boolean;
}

export interface RainForecastInfo {
  isRainingNow: boolean;
  nextRainTime: string | null;
  nextRainTimeTamil: string | null;
  nextRainProbability: number;
  nextRainAmountMm: number;
  rainSummary: string;
  rainSummaryTamil: string;
  next12Hours: HourlyRainItem[];
  willRainToday: boolean;
  willRainTomorrow: boolean;
}

export interface LiveWeatherHub {
  id: string;
  name: string;
  nameTamil: string;
  district: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // %
  windSpeed: number; // km/h
  precipitation: number; // mm
  weatherCode: number; // WMO Code
  condition: string;
  conditionTamil: string;
  conditionType: WeatherConditionType;
  icon: string;
  isDay: boolean;
  highwaySafetyImpact: 'optimal' | 'moderate' | 'hazard';
  advisory: string;
  advisoryTamil: string;
  rainForecast: RainForecastInfo;
  updatedAt: string;
}

export interface CorridorWeatherSummary {
  originWeather: LiveWeatherHub;
  destinationWeather: LiveWeatherHub;
  midpointWeather?: {
    temperature: number;
    condition: string;
    precipitation: number;
  };
  hasRainAlongRoute: boolean;
  rainTimingSummary: string;
  rainTimingSummaryTamil: string;
  maxWindSpeed: number;
  overallAdvisory: string;
  overallAdvisoryTamil: string;
  recommendedSpeedReductionKmh: number;
}
