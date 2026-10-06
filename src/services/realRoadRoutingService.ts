// Client-side Service for Real Road Network Routing
import { RealRoadCalculationResult, RealRoadRoute } from '../../server/services/realRoadProvider';

export interface RouteConfigInfo {
  activeProvider: 'google' | 'openrouteservice' | 'osrm';
  hasGoogleKey: boolean;
  hasOrsKey: boolean;
  trafficSupported: boolean;
  providerLabel: string;
}

export class RealRoadRoutingService {
  /**
   * Fetch current backend routing provider configuration safely
   */
  public static async getProviderConfig(): Promise<RouteConfigInfo> {
    try {
      const res = await fetch('/api/route/config');
      if (!res.ok) throw new Error('Failed to get provider config');
      const json = await res.json();
      return json.data;
    } catch {
      return {
        activeProvider: 'osrm',
        hasGoogleKey: false,
        hasOrsKey: false,
        trafficSupported: false,
        providerLabel: 'Real Road Network (OSRM Highway Grid)'
      };
    }
  }

  /**
   * Compute real road-following routes via backend API
   */
  public static async calculateRealRoadRoute(params: {
    origin: [number, number];
    destination: [number, number];
    originName?: string;
    destName?: string;
    avoidCorridor?: string;
    viaWaypoint?: [number, number];
  }): Promise<RealRoadCalculationResult> {
    const res = await fetch('/api/route/real-road', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `Routing failed with HTTP status ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Geocode a place name in Tamil Nadu
   */
  public static async geocodeLocation(query: string): Promise<{
    name: string;
    nameTamil: string;
    district: string;
    lat: number;
    lng: number;
    nodeId?: string;
  } | null> {
    try {
      const res = await fetch(`/api/route/geocode?query=${encodeURIComponent(query)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  }
}
