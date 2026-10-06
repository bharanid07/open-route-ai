// Real Road Routing Provider for OPENROUTE AI
// Supports:
// 1. Google Maps Routes API v2 (Traffic-Aware, Alternatives, Encoded Polyline)
// 2. OpenRouteService Directions API (Alternatives, GeoJSON)
// 3. OpenStreetMap / OSRM Real Road Network (Real Geometries, Real Highway Distances, Real Alternatives)

export interface RealRoadStep {
  id: string;
  stepIndex: number;
  maneuverType: string;
  modifier?: string;
  roadName: string;
  instruction: string;
  instructionTamil: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceFormatted: string;
  durationFormatted: string;
  location: [number, number]; // [lat, lng]
  stepCoordinates: [number, number][]; // [lat, lng][]
}

export interface RealRoadRoute {
  id: string;
  title: string;
  titleTamil: string;
  isFastest: boolean;
  distanceKm: number;
  durationHours: number;
  durationFormatted: string;
  trafficDurationHours?: number;
  trafficDurationFormatted?: string;
  trafficDelayMinutes: number;
  trafficStatus: 'live_available' | 'traffic_unavailable';
  trafficMessage: string;
  coordinates: [number, number][]; // [lat, lng]
  steps: RealRoadStep[];
  primaryHighways: string[];
  summary: string;
  provider: 'google' | 'openrouteservice' | 'osrm';
  isSimulatedTraffic: boolean;
}

export interface RealRoadCalculationResult {
  status: 'success' | 'error';
  provider: 'google' | 'openrouteservice' | 'osrm';
  keyConfigured: boolean;
  trafficSupported: boolean;
  routes: RealRoadRoute[];
  activeRoute: RealRoadRoute;
  message?: string;
}

// Decode Google Maps Encoded Polyline algorithm
export function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function formatDistance(meters: number): string {
  if (!meters || meters < 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  if (seconds < 60) return '< 1 min';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (remMin === 0) return `${hrs} hr`;
  return `${hrs} hr ${remMin} min`;
}

export function formatManeuverInstruction(
  type: string,
  modifier: string | undefined,
  roadName: string
): { en: string; ta: string } {
  const road = roadName ? roadName : 'the highway';
  const roadTa = roadName ? roadName : 'நெடுஞ்சாலை';

  switch (type) {
    case 'depart':
      return {
        en: `Head on ${road}`,
        ta: `${roadTa} வழியே பயணத்தைத் தொடங்குங்கள்`
      };
    case 'arrive':
      return {
        en: roadName ? `Arrive at ${roadName}` : 'Arrive at destination',
        ta: roadName ? `${roadTa} இலக்கை அடைந்துவிட்டீர்கள்` : 'உங்கள் இலக்கை அடைந்துவிட்டீர்கள்'
      };
    case 'turn':
    case 'new name':
    case 'continue':
      if (modifier === 'left') {
        return {
          en: `Turn left onto ${road}`,
          ta: `${roadTa} நோக்கி இடதுபுறம் திரும்பவும்`
        };
      } else if (modifier === 'right') {
        return {
          en: `Turn right onto ${road}`,
          ta: `${roadTa} நோக்கி வலதுபுறம் திரும்பவும்`
        };
      } else if (modifier === 'slight left') {
        return {
          en: `Keep left onto ${road}`,
          ta: `${roadTa} நோக்கி சற்று இடதுபுறமாக செல்லவும்`
        };
      } else if (modifier === 'slight right') {
        return {
          en: `Keep right onto ${road}`,
          ta: `${roadTa} நோக்கி சற்று வலதுபுறமாக செல்லவும்`
        };
      }
      return {
        en: `Continue along ${road}`,
        ta: `${roadTa} வழியே தொடர்ந்து பயணிக்கவும்`
      };
    case 'merge':
      return {
        en: `Merge onto ${road}`,
        ta: `${roadTa} அதிவேக நெடுஞ்சாலையில் இணையவும்`
      };
    case 'roundabout':
    case 'rotary':
      return {
        en: `At the roundabout, take exit onto ${road}`,
        ta: `வட்டச்சந்தியில் ${roadTa} வழியே வெளியேறவும்`
      };
    default:
      return {
        en: `Follow ${road}`,
        ta: `${roadTa} வழியே தொடரவும்`
      };
  }
}

export class RealRoadProvider {
  /**
   * Main entrypoint: computes real road routes via Google Routes API, OpenRouteService, or OSRM
   */
  public static async calculateRoute(params: {
    origin: [number, number]; // [lat, lng]
    destination: [number, number]; // [lat, lng]
    originName?: string;
    destName?: string;
    avoidCorridor?: string; // e.g. 'salem'
    viaWaypoint?: [number, number]; // [lat, lng]
  }): Promise<RealRoadCalculationResult> {
    const { origin, destination, originName, destName, avoidCorridor, viaWaypoint } = params;

    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    const orsKey = process.env.OPENROUTESERVICE_API_KEY || process.env.VITE_OPENROUTESERVICE_API_KEY;

    // 1. Try Google Maps Routes API if key configured
    if (googleKey && googleKey.trim().length > 10 && !googleKey.includes('placeholder')) {
      try {
        const googleResult = await this.fetchGoogleRoutes({
          origin,
          destination,
          apiKey: googleKey,
          avoidCorridor,
          viaWaypoint
        });
        if (googleResult && googleResult.routes.length > 0) {
          return googleResult;
        }
      } catch (err) {
        console.warn('Google Maps Routes API failed, falling back to OSRM:', err);
      }
    }

    // 2. Try OpenRouteService if key configured
    if (orsKey && orsKey.trim().length > 10 && !orsKey.includes('placeholder')) {
      try {
        const orsResult = await this.fetchOpenRouteService({
          origin,
          destination,
          apiKey: orsKey,
          avoidCorridor,
          viaWaypoint
        });
        if (orsResult && orsResult.routes.length > 0) {
          return orsResult;
        }
      } catch (err) {
        console.warn('OpenRouteService API failed, falling back to OSRM:', err);
      }
    }

    // 3. Real Road Network via OSRM (100% Free, Real OpenStreetMap Highways, No Key Required)
    const osrmResult = await this.fetchOsrmRoutes({
      origin,
      destination,
      originName,
      destName,
      avoidCorridor,
      viaWaypoint
    });

    return osrmResult;
  }

  /**
   * Google Maps Routes API v2 with Traffic-Aware Routing and Alternatives
   */
  private static async fetchGoogleRoutes(params: {
    origin: [number, number];
    destination: [number, number];
    apiKey: string;
    avoidCorridor?: string;
    viaWaypoint?: [number, number];
  }): Promise<RealRoadCalculationResult | null> {
    const { origin, destination, apiKey, viaWaypoint } = params;

    const body: Record<string, any> = {
      origin: {
        location: {
          latLng: { latitude: origin[0], longitude: origin[1] }
        }
      },
      destination: {
        location: {
          latLng: { latitude: destination[0], longitude: destination[1] }
        }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true
    };

    if (viaWaypoint) {
      body.intermediates = [
        {
          location: {
            latLng: { latitude: viaWaypoint[0], longitude: viaWaypoint[1] }
          }
        }
      ];
    }

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'routes.duration,routes.staticDuration,routes.distanceMeters,routes.description,routes.polyline.encodedPolyline,routes.legs,routes.travelAdvisory'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Google Routes API HTTP error:', res.status, errText);
      return null;
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;

    const routes: RealRoadRoute[] = data.routes.map((rt: any, idx: number) => {
      const distanceMeters = rt.distanceMeters || 0;
      const durationSec = parseInt((rt.duration || '0s').replace('s', ''), 10);
      const staticSec = parseInt((rt.staticDuration || `${durationSec}s`).replace('s', ''), 10);
      const trafficDelayMin = Math.max(0, Math.round((durationSec - staticSec) / 60));

      const coords = rt.polyline?.encodedPolyline
        ? decodeGooglePolyline(rt.polyline.encodedPolyline)
        : [];

      const rawLeg = rt.legs?.[0];
      const rawSteps = rawLeg?.steps || [];
      const highwaySet = new Set<string>();

      const steps: RealRoadStep[] = rawSteps.map((st: any, sIdx: number) => {
        const roadName = st.navigationInstruction?.maneuver || 'Highway Corridor';
        const maneuverType = st.navigationInstruction?.maneuver || 'turn';
        const { en, ta } = formatManeuverInstruction(maneuverType, undefined, roadName);

        return {
          id: `goog_step_${sIdx}`,
          stepIndex: sIdx + 1,
          maneuverType,
          roadName,
          instruction: st.navigationInstruction?.instructions || en,
          instructionTamil: ta,
          distanceMeters: st.distanceMeters || 0,
          durationSeconds: parseInt((st.staticDuration || '0s').replace('s', ''), 10),
          distanceFormatted: formatDistance(st.distanceMeters || 0),
          durationFormatted: formatDuration(parseInt((st.staticDuration || '0s').replace('s', ''), 10)),
          location: [st.startLocation?.latLng?.latitude || 0, st.startLocation?.latLng?.longitude || 0],
          stepCoordinates: st.polyline?.encodedPolyline ? decodeGooglePolyline(st.polyline.encodedPolyline) : []
        };
      });

      const primaryHighways = Array.from(highwaySet).slice(0, 3);
      if (primaryHighways.length === 0) {
        primaryHighways.push(rt.description || 'TN Expressway Corridor');
      }

      return {
        id: `route_${idx + 1}`,
        title: idx === 0 ? 'Route 1 – Fastest (Traffic-Optimized)' : `Route ${idx + 1} – Alternative Corridor`,
        titleTamil: idx === 0 ? 'பாதை 1 – விரைவான வழித்தடம் (நேரலை போக்குவரத்து)' : `பாதை ${idx + 1} – மாற்று வழித்தடம்`,
        isFastest: idx === 0,
        distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
        durationHours: Math.round((durationSec / 3600) * 10) / 10,
        durationFormatted: formatDuration(durationSec),
        trafficDurationHours: Math.round((durationSec / 3600) * 10) / 10,
        trafficDurationFormatted: formatDuration(durationSec),
        trafficDelayMinutes: trafficDelayMin,
        trafficStatus: 'live_available',
        trafficMessage: trafficDelayMin > 0 ? `+${trafficDelayMin} min live traffic delay` : 'Free flow traffic conditions',
        coordinates: coords,
        steps,
        primaryHighways,
        summary: rt.description || 'Google Routes Highway Corridor',
        provider: 'google',
        isSimulatedTraffic: false
      };
    });

    return {
      status: 'success',
      provider: 'google',
      keyConfigured: true,
      trafficSupported: true,
      routes,
      activeRoute: routes[0]
    };
  }

  /**
   * OpenRouteService Directions API
   */
  private static async fetchOpenRouteService(params: {
    origin: [number, number];
    destination: [number, number];
    apiKey: string;
    avoidCorridor?: string;
    viaWaypoint?: [number, number];
  }): Promise<RealRoadCalculationResult | null> {
    const { origin, destination, apiKey, viaWaypoint } = params;

    const coordinates = viaWaypoint
      ? [[origin[1], origin[0]], [viaWaypoint[1], viaWaypoint[0]], [destination[1], destination[0]]]
      : [[origin[1], origin[0]], [destination[1], destination[0]]];

    const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
        alternative_routes: { target_count: 3, weight_factor: 1.4 },
        instructions: true
      })
    });

    if (!res.ok) {
      console.warn('OpenRouteService HTTP error:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const routes: RealRoadRoute[] = data.features.map((feature: any, idx: number) => {
      const summary = feature.properties?.summary || {};
      const distanceM = summary.distance || 0;
      const durationS = summary.duration || 0;

      const coords: [number, number][] = (feature.geometry?.coordinates || []).map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      const segments = feature.properties?.segments || [];
      const steps: RealRoadStep[] = [];
      let sCount = 0;

      segments.forEach((seg: any) => {
        (seg.steps || []).forEach((st: any) => {
          sCount++;
          const roadName = st.name || 'State Highway';
          const { en, ta } = formatManeuverInstruction(st.type, st.modifier, roadName);

          steps.push({
            id: `ors_step_${sCount}`,
            stepIndex: sCount,
            maneuverType: String(st.type || 'turn'),
            modifier: st.modifier,
            roadName,
            instruction: st.instruction || en,
            instructionTamil: ta,
            distanceMeters: Math.round(st.distance || 0),
            durationSeconds: Math.round(st.duration || 0),
            distanceFormatted: formatDistance(st.distance || 0),
            durationFormatted: formatDuration(st.duration || 0),
            location: coords[st.way_points?.[0]] || coords[0] || [0, 0],
            stepCoordinates: coords.slice(st.way_points?.[0] || 0, (st.way_points?.[1] || 0) + 1)
          });
        });
      });

      return {
        id: `route_${idx + 1}`,
        title: idx === 0 ? 'Route 1 – Fastest (OpenRouteService)' : `Route ${idx + 1} – Alternative Corridor`,
        titleTamil: idx === 0 ? 'பாதை 1 – முதன்மை வழித்தடம்' : `பாதை ${idx + 1} – மாற்று வழித்தடம்`,
        isFastest: idx === 0,
        distanceKm: Math.round((distanceM / 1000) * 10) / 10,
        durationHours: Math.round((durationS / 3600) * 10) / 10,
        durationFormatted: formatDuration(durationS),
        trafficDelayMinutes: 0,
        trafficStatus: 'traffic_unavailable',
        trafficMessage: 'Traffic data unavailable (Live traffic requires Google Maps Routes API key)',
        coordinates: coords,
        steps,
        primaryHighways: ['Tamil Nadu State Highway Grid'],
        summary: 'OpenRouteService Real Road Geometry',
        provider: 'openrouteservice',
        isSimulatedTraffic: false
      };
    });

    return {
      status: 'success',
      provider: 'openrouteservice',
      keyConfigured: true,
      trafficSupported: false,
      routes,
      activeRoute: routes[0]
    };
  }

  /**
   * Real Road Network via OSRM (OpenStreetMap Road Highway Grid)
   * 100% Free, Zero Key Needed, Real Road Highway Geometries & Alternatives
   */
  private static async fetchOsrmRoutes(params: {
    origin: [number, number];
    destination: [number, number];
    originName?: string;
    destName?: string;
    avoidCorridor?: string;
    viaWaypoint?: [number, number];
  }): Promise<RealRoadCalculationResult> {
    const { origin, destination, avoidCorridor, viaWaypoint } = params;

    // Handle bypass waypoint if Salem is blocked
    let coordinatesQuery = `${origin[1].toFixed(6)},${origin[0].toFixed(6)}`;
    if (viaWaypoint) {
      coordinatesQuery += `;${viaWaypoint[1].toFixed(6)},${viaWaypoint[0].toFixed(6)}`;
    } else if (avoidCorridor === 'salem') {
      // Divert through Karur / Trichy (lat: 10.7905, lng: 78.7047) to bypass Salem bottleneck
      coordinatesQuery += `;78.704700,10.790500`;
    }
    coordinatesQuery += `;${destination[1].toFixed(6)},${destination[0].toFixed(6)}`;

    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?overview=full&geometries=geojson&steps=true&alternatives=3`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`OSRM HTTP error: ${res.status}`);
      }

      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`OSRM returned code: ${data.code}`);
      }

      const routes: RealRoadRoute[] = data.routes.map((rt: any, idx: number) => {
        const coords: [number, number][] = rt.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );

        const highwaySet = new Set<string>();
        const rawSteps: any[] = [];
        (rt.legs || []).forEach((leg: any) => {
          if (leg.steps) rawSteps.push(...leg.steps);
        });

        const steps: RealRoadStep[] = rawSteps.map((st: any, sIdx: number) => {
          const maneuver = st.maneuver || {};
          const roadName = st.name ? st.name.trim() : '';

          if (
            roadName &&
            (roadName.includes('NH') ||
              roadName.includes('SH') ||
              roadName.includes('Road') ||
              roadName.includes('Flyover') ||
              roadName.includes('Bypass') ||
              roadName.includes('Expressway'))
          ) {
            highwaySet.add(roadName);
          }

          const { en, ta } = formatManeuverInstruction(maneuver.type, maneuver.modifier, roadName);

          const stepCoordinates: [number, number][] = st.geometry?.coordinates
            ? st.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon])
            : [];

          const loc: [number, number] = maneuver.location
            ? [maneuver.location[1], maneuver.location[0]]
            : stepCoordinates[0] || [0, 0];

          return {
            id: `osrm_step_${sIdx}`,
            stepIndex: sIdx + 1,
            maneuverType: maneuver.type || 'turn',
            modifier: maneuver.modifier,
            roadName: roadName || 'Highway Corridor Segment',
            instruction: en,
            instructionTamil: ta,
            distanceMeters: Math.round(st.distance || 0),
            durationSeconds: Math.round(st.duration || 0),
            distanceFormatted: formatDistance(st.distance || 0),
            durationFormatted: formatDuration(st.duration || 0),
            location: loc,
            stepCoordinates
          };
        });

        const primaryHighways = Array.from(highwaySet).slice(0, 3);
        if (primaryHighways.length === 0) {
          primaryHighways.push(avoidCorridor === 'salem' ? 'NH 81 / NH 45 (Bypassing Salem)' : 'NH 544 & NH 45 / NH 44');
        }

        const distanceKm = Math.round((rt.distance / 1000) * 10) / 10;
        const durationHours = Math.round((rt.duration / 3600) * 10) / 10;

        const isBypass = avoidCorridor === 'salem';
        let routeTitle = idx === 0 ? 'Route 1 – Fastest' : `Route ${idx + 1} – Alternative`;
        let routeTitleTamil = idx === 0 ? 'பாதை 1 – விரைவான வழித்தடம்' : `பாதை ${idx + 1} – மாற்று வழித்தடம்`;

        if (isBypass) {
          routeTitle = 'Bypass Detour (via Karur / Trichy NH 81 & GST Road)';
          routeTitleTamil = 'சேலம் தவிர்ப்பு மாற்றுப்பாதை (கரூர் / திருச்சி வழியே)';
        } else if (idx === 0) {
          routeTitle = 'Route 1 – Fastest (via NH 544 & GST Road)';
          routeTitleTamil = 'பாதை 1 – விரைவான வழித்தடம் (NH 544 & GST சாலை)';
        } else if (idx === 1) {
          routeTitle = 'Route 2 – Alternative (via Salem & NH 44 / Vellore)';
          routeTitleTamil = 'பாதை 2 – மாற்று வழித்தடம் (சேலம் & NH 44 / வேலூர் வழியே)';
        }

        return {
          id: `route_${idx + 1}`,
          title: routeTitle,
          titleTamil: routeTitleTamil,
          isFastest: idx === 0,
          distanceKm,
          durationHours,
          durationFormatted: formatDuration(rt.duration),
          trafficDelayMinutes: 0,
          trafficStatus: 'traffic_unavailable',
          trafficMessage: 'Traffic data unavailable (Live traffic requires Google Maps Routes API key)',
          coordinates: coords,
          steps,
          primaryHighways,
          summary: `${distanceKm} km via ${primaryHighways.join(', ')}`,
          provider: 'osrm',
          isSimulatedTraffic: false
        };
      });

      return {
        status: 'success',
        provider: 'osrm',
        keyConfigured: false,
        trafficSupported: false,
        routes,
        activeRoute: routes[0],
        message: 'Calculated using Real Road Network (OSRM). Traffic data unavailable without Google Maps API key.'
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        status: 'error',
        provider: 'osrm',
        keyConfigured: false,
        trafficSupported: false,
        routes: [],
        activeRoute: null as any,
        message: `Unable to calculate real road route: ${errMsg}. Please verify network connectivity or routing service.`
      };
    }
  }
}
