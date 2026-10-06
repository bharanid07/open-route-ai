import { NavigationStep, NavigationRouteData } from "../types";

// In-memory cache for OSRM routes
const routeCache = new Map<string, NavigationRouteData>();

export class OsrmRoutingService {
  /**
   * Fetches snapped real highway road routing from free OSRM Routing API
   * Endpoint: https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true
   */
  public static async fetchRealRoadRoute(
    waypoints: [number, number][]
  ): Promise<NavigationRouteData | null> {
    if (!waypoints || waypoints.length < 2) return null;

    // Filter duplicate consecutive coordinates
    const filteredWaypoints: [number, number][] = [];
    for (let i = 0; i < waypoints.length; i++) {
      if (
        i === 0 ||
        Math.abs(waypoints[i][0] - waypoints[i - 1][0]) > 0.0001 ||
        Math.abs(waypoints[i][1] - waypoints[i - 1][1]) > 0.0001
      ) {
        filteredWaypoints.push(waypoints[i]);
      }
    }

    if (filteredWaypoints.length < 2) return null;

    // Build OSRM query string: {lon},{lat};{lon},{lat}...
    const queryCoords = filteredWaypoints
      .map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
      .join(";");

    if (routeCache.has(queryCoords)) {
      return routeCache.get(queryCoords)!;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${queryCoords}?overview=full&geometries=geojson&steps=true`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn("OSRM routing returned HTTP error:", res.status);
        return null;
      }

      const data = await res.json();
      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        console.warn("OSRM route code not Ok:", data.code);
        return null;
      }

      const route = data.routes[0];

      // Convert geojson [lon, lat] to Leaflet [lat, lon]
      const realRoadCoordinates: [number, number][] = route.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon]
      );

      const rawSteps: any[] = [];
      route.legs.forEach((leg: any) => {
        if (leg.steps) {
          rawSteps.push(...leg.steps);
        }
      });

      const highwaySet = new Set<string>();

      const steps: NavigationStep[] = rawSteps.map((step: any, index: number) => {
        const maneuver = step.maneuver || {};
        const roadName = step.name ? step.name.trim() : "";

        if (
          roadName &&
          (roadName.includes("NH") ||
            roadName.includes("SH") ||
            roadName.includes("Road") ||
            roadName.includes("High") ||
            roadName.includes("Trunk") ||
            roadName.includes("Bypass") ||
            roadName.includes("Ring") ||
            roadName.includes("Expressway"))
        ) {
          highwaySet.add(roadName);
        }

        const { en, ta } = this.formatManeuverInstruction(
          maneuver.type,
          maneuver.modifier,
          roadName,
          step.distance
        );

        const stepCoordinates: [number, number][] =
          step.geometry && step.geometry.coordinates
            ? step.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon])
            : [];

        const loc: [number, number] = maneuver.location
          ? [maneuver.location[1], maneuver.location[0]]
          : stepCoordinates[0] || [0, 0];

        return {
          id: `step_${index}_${Math.round(step.distance)}`,
          stepIndex: index + 1,
          maneuverType: maneuver.type || "turn",
          modifier: maneuver.modifier,
          roadName: roadName || "Corridor Segment",
          instruction: en,
          instructionTamil: ta,
          distanceMeters: Math.round(step.distance),
          durationSeconds: Math.round(step.duration),
          distanceFormatted: this.formatDistance(step.distance),
          durationFormatted: this.formatDuration(step.duration),
          location: loc,
          stepCoordinates
        };
      });

      const totalDistanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const totalDurationHours = Math.round((route.duration / 3600) * 10) / 10;
      const totalDurationFormatted = this.formatDuration(route.duration);

      const primaryHighways = Array.from(highwaySet).slice(0, 4);
      if (primaryHighways.length === 0) {
        primaryHighways.push("Tamil Nadu State Highway Grid");
      }

      const result: NavigationRouteData = {
        realRoadCoordinates,
        steps,
        totalDistanceKm,
        totalDurationHours,
        totalDurationFormatted,
        primaryHighways
      };

      routeCache.set(queryCoords, result);
      return result;
    } catch (err) {
      console.warn("Error fetching OSRM highway route:", err);
      return null;
    }
  }

  /**
   * Translates turn maneuver and modifier into natural English and Tamil instructions
   */
  private static formatManeuverInstruction(
    type: string,
    modifier: string | undefined,
    roadName: string,
    distanceMeters: number
  ): { en: string; ta: string } {
    const road = roadName ? roadName : "the highway";
    const roadTa = roadName ? roadName : "நெடுஞ்சாலை";

    switch (type) {
      case "depart":
        return {
          en: `Head on ${road}`,
          ta: `${roadTa} வழியாக பயணத்தை தொடங்குங்கள்`
        };
      case "arrive":
        return {
          en: roadName ? `Arrive at ${roadName}` : "You have reached your destination",
          ta: roadName ? `${roadTa} இலக்கை அடைந்துவிட்டீர்கள்` : "உங்கள் இலக்கை அடைந்துவிட்டீர்கள்"
        };
      case "turn":
      case "new name":
      case "continue":
        if (modifier === "left") {
          return {
            en: `Turn left onto ${road}`,
            ta: `${roadTa} நோக்கி இடதுபுறம் திரும்பவும்`
          };
        } else if (modifier === "right") {
          return {
            en: `Turn right onto ${road}`,
            ta: `${roadTa} நோக்கி வலதுபுறம் திரும்பவும்`
          };
        } else if (modifier === "slight left") {
          return {
            en: `Keep left onto ${road}`,
            ta: `${roadTa} நோக்கி சற்று இடதுபுறமாக செல்லவும்`
          };
        } else if (modifier === "slight right") {
          return {
            en: `Keep right onto ${road}`,
            ta: `${roadTa} நோக்கி சற்று வலதுபுறமாக செல்லவும்`
          };
        } else if (modifier === "sharp left") {
          return {
            en: `Sharp left onto ${road}`,
            ta: `${roadTa} நோக்கி கூர்மையான இடதுபுறம் திரும்பவும்`
          };
        } else if (modifier === "sharp right") {
          return {
            en: `Sharp right onto ${road}`,
            ta: `${roadTa} நோக்கி கூர்மையான வலதுபுறம் திரும்பவும்`
          };
        } else if (modifier === "uturn") {
          return {
            en: `Make a U-turn onto ${road}`,
            ta: `${roadTa} நோக்கி யூ-டர்ன் (U-Turn) எடுக்கவும்`
          };
        }
        return {
          en: `Continue onto ${road}`,
          ta: `${roadTa} வழியே தொடர்ந்து செல்லவும்`
        };
      case "merge":
        return {
          en: `Merge onto ${road}`,
          ta: `${roadTa} அதிவேக நெடுஞ்சாலையில் இணையவும்`
        };
      case "fork":
        return {
          en: `At the fork, keep ${modifier || "straight"} onto ${road}`,
          ta: `பிரிவு சாலையில் ${roadTa} நோக்கி செல்லவும்`
        };
      case "roundabout":
      case "rotary":
        return {
          en: `At the roundabout, take the exit onto ${road}`,
          ta: `வட்டச்சந்தியில் ${roadTa} வழியே வெளியேறவும்`
        };
      case "on ramp":
      case "off ramp":
        return {
          en: `Take the ramp onto ${road}`,
          ta: `இணைப்பு பாலம் வழியே ${roadTa} நோக்கி செல்லவும்`
        };
      default:
        return {
          en: `Continue along ${road}`,
          ta: `${roadTa} வழியே பயணிக்கவும்`
        };
    }
  }

  public static formatDistance(meters: number): string {
    if (!meters || meters < 0) return "0 m";
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  public static formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0 min";
    if (seconds < 60) return "< 1 min";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hrs = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (remMin === 0) return `${hrs} hr`;
    return `${hrs} hr ${remMin} min`;
  }
}
