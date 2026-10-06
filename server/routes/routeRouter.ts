import { Router, Request, Response } from 'express';
import { TNRoutingAlgorithm } from '../../src/engine/routingAlgorithm';
import { TN_STATE_NODES, TN_HIGHWAY_EDGES, TN_INITIAL_HAZARDS, TN_DEFAULT_WEIGHTS } from '../../src/data/tnGeographicData';
import { TNRouteProfile, WeatherScenario, TNCommuterFilter, TNProfileWeights } from '../../src/types';
import { RealRoadProvider } from '../services/realRoadProvider';

export const routeRouter = Router();

/**
 * 1. Legacy Graph Routing Computation (Dijkstra-based Multi-Criteria Engine)
 */
routeRouter.post('/compute', (req: Request, res: Response) => {
  try {
    const { 
      originId, 
      destinationId, 
      profile = 'freight_express', 
      weights, 
      hourOfDay = 10, 
      weather = 'clear',
      commuterFilter,
      hazards = TN_INITIAL_HAZARDS
    } = req.body;

    if (!originId || !destinationId) {
      return res.status(400).json({ error: 'originId and destinationId are required.' });
    }

    const effectiveProfile: TNRouteProfile = profile;
    const effectiveWeights: TNProfileWeights = weights || TN_DEFAULT_WEIGHTS[effectiveProfile];

    const result = TNRoutingAlgorithm.computeRoute({
      originId,
      destinationId,
      profile: effectiveProfile,
      weights: effectiveWeights,
      nodes: TN_STATE_NODES,
      edges: TN_HIGHWAY_EDGES,
      hazards,
      hourOfDay: Number(hourOfDay),
      weather: weather as WeatherScenario,
      commuterFilter: commuterFilter as TNCommuterFilter | undefined
    });

    return res.json({
      status: 'success',
      data: result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown routing error';
    return res.status(500).json({ error: message });
  }
});

/**
 * 2. Real Road Network Routing (Google Routes API / OpenRouteService / OSRM)
 * Accepts coordinates, calculates real road following geometry, real distances, durations, and alternatives
 */
routeRouter.post('/real-road', async (req: Request, res: Response) => {
  try {
    const { 
      origin,
      destination,
      originName,
      destName,
      avoidCorridor,
      viaWaypoint
    } = req.body;

    const parseCoords = (c: any): [number, number] | null => {
      if (!c) return null;
      if (Array.isArray(c) && c.length === 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1]))) {
        return [Number(c[0]), Number(c[1])];
      }
      if (typeof c === 'object' && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng))) {
        return [Number(c.lat), Number(c.lng)];
      }
      return null;
    };

    const originCoords = parseCoords(origin);
    const destCoords = parseCoords(destination);

    if (!originCoords || !destCoords) {
      return res.status(400).json({ 
        error: 'Valid origin [lat, lng] or {lat, lng} and destination coordinates are required.' 
      });
    }

    const viaCoords = parseCoords(viaWaypoint);

    const result = await RealRoadProvider.calculateRoute({
      origin: originCoords,
      destination: destCoords,
      originName,
      destName,
      avoidCorridor,
      viaWaypoint: viaCoords || undefined
    });

    if (result.status === 'error') {
      return res.status(502).json({
        error: result.message || 'Unable to calculate real road route. Please verify locations.'
      });
    }

    return res.json({
      status: 'success',
      data: result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal real road routing error';
    return res.status(500).json({ error: message });
  }
});

/**
 * 3. Geocoding Service for Tamil Nadu Hubs & Locations
 */
routeRouter.get('/geocode', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const qLower = query.toLowerCase();

    // First check statewide preset nodes
    const matchedNode = TN_STATE_NODES.find(n => 
      n.name.toLowerCase().includes(qLower) || 
      n.nameTamil.toLowerCase().includes(qLower) ||
      n.district.toLowerCase().includes(qLower) ||
      n.id.toLowerCase().includes(qLower)
    );

    if (matchedNode) {
      return res.json({
        status: 'success',
        data: {
          name: matchedNode.name,
          nameTamil: matchedNode.nameTamil,
          district: matchedNode.district,
          lat: matchedNode.lat,
          lng: matchedNode.lng,
          nodeId: matchedNode.id
        }
      });
    }

    // Fallback to OpenStreetMap Nominatim geocoder bounded to Tamil Nadu
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Tamil Nadu, India')}&format=json&limit=1`;
    const geoRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'OPENROUTE-AI/2.0' }
    });

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        const item = geoData[0];
        return res.json({
          status: 'success',
          data: {
            name: item.display_name.split(',')[0],
            nameTamil: item.display_name.split(',')[0],
            district: 'Tamil Nadu',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }
        });
      }
    }

    return res.status(404).json({ error: `Location "${query}" could not be geocoded.` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Geocoding failed';
    return res.status(500).json({ error: message });
  }
});

/**
 * 4. Provider Configuration status (Safe public view without exposing secret strings)
 */
routeRouter.get('/config', (_req: Request, res: Response) => {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  const orsKey = process.env.OPENROUTESERVICE_API_KEY || process.env.VITE_OPENROUTESERVICE_API_KEY;

  const hasGoogleKey = Boolean(googleKey && googleKey.length > 10 && !googleKey.includes('placeholder'));
  const hasOrsKey = Boolean(orsKey && orsKey.length > 10 && !orsKey.includes('placeholder'));

  let activeProvider: 'google' | 'openrouteservice' | 'osrm' = 'osrm';
  if (hasGoogleKey) activeProvider = 'google';
  else if (hasOrsKey) activeProvider = 'openrouteservice';

  return res.json({
    status: 'success',
    data: {
      activeProvider,
      hasGoogleKey,
      hasOrsKey,
      trafficSupported: hasGoogleKey,
      providerLabel: hasGoogleKey 
        ? 'Google Maps Routes API (Live Traffic Active)' 
        : hasOrsKey 
          ? 'OpenRouteService Directions API' 
          : 'Real Road Network (OSRM Highway Grid)'
    }
  });
});
