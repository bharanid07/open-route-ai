import { LiveWeatherHub, CorridorWeatherSummary } from '../types/weather';

export class WeatherService {
  /**
   * Fetches real-time weather stations across Tamil Nadu
   */
  public static async getLiveWeather(): Promise<LiveWeatherHub[]> {
    try {
      const res = await fetch('/api/weather/live');
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
      const data = await res.json();
      return data.stations || [];
    } catch (err) {
      console.warn('Weather service fetch error, trying direct fallback:', err);
      return [];
    }
  }

  /**
   * Fetches real-time corridor weather for origin and destination
   */
  public static async getCorridorWeather(
    originId: string, 
    destinationId: string
  ): Promise<CorridorWeatherSummary | null> {
    try {
      const res = await fetch(`/api/weather/corridor?originId=${encodeURIComponent(originId)}&destinationId=${encodeURIComponent(destinationId)}`);
      if (!res.ok) throw new Error(`Corridor weather fetch failed: ${res.status}`);
      const data = await res.json();
      return data.corridor || null;
    } catch (err) {
      console.warn('Corridor weather fetch error:', err);
      return null;
    }
  }
}
