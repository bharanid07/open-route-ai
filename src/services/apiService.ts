// Client API Service for connecting to the Express Backend
import { TNRouteComputationResult, TNProfileWeights, TNRouteProfile, WeatherScenario, TNCommuterFilter, TNHazardType, TNNode, TNHighwayEdge, TNHazardIncident } from '../types';

const API_BASE = '/api';

export const apiService = {
  /**
   * Healthcheck
   */
  async checkHealth(): Promise<{ status: string; platform: string; version: string; supportedDistricts: number }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  /**
   * Multi-Criteria Route Computation
   */
  async computeRoute(params: {
    originId: string;
    destinationId: string;
    profile: TNRouteProfile;
    weights?: TNProfileWeights;
    hourOfDay?: number;
    weather?: WeatherScenario;
    commuterFilter?: TNCommuterFilter;
  }): Promise<TNRouteComputationResult> {
    const res = await fetch(`${API_BASE}/route/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`Routing failed: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch Statewide Nodes
   */
  async getNodes(): Promise<TNNode[]> {
    const res = await fetch(`${API_BASE}/nodes`);
    if (!res.ok) throw new Error('Failed to fetch nodes');
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch Statewide Highway Corridors
   */
  async getHighways(): Promise<TNHighwayEdge[]> {
    const res = await fetch(`${API_BASE}/nodes/highways`);
    if (!res.ok) throw new Error('Failed to fetch highways');
    const json = await res.json();
    return json.data;
  },

  /**
   * Spawn a Dynamic Disruption
   */
  async spawnHazard(data: {
    type: TNHazardType;
    lat: number;
    lng: number;
    title?: string;
    titleTamil?: string;
  }): Promise<TNHazardIncident> {
    const res = await fetch(`${API_BASE}/hazards/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to spawn hazard');
    const json = await res.json();
    return json.data;
  },

  /**
   * Resolve an Active Disruption
   */
  async resolveHazard(id: string): Promise<TNHazardIncident> {
    const res = await fetch(`${API_BASE}/hazards/${id}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to resolve hazard');
    const json = await res.json();
    return json.data;
  },

  /**
   * Dispatch Consignment Order
   */
  async dispatchOrder(orderId: string, vehicleId?: string) {
    const res = await fetch(`${API_BASE}/fleet/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, vehicleId })
    });
    if (!res.ok) throw new Error('Failed to dispatch order');
    return res.json();
  }
};
