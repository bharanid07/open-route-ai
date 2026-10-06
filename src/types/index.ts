// Tamil Nadu State-Wide Smart Logistics & Accessibility Intelligence Types

export type TNNodeCategory =
  | 'metro_hub'
  | 'industrial_cluster'
  | 'port_hub'
  | 'freight_junction'
  | 'transit_terminal'
  | 'medical_gateway'
  | 'agrarian_hub'
  | 'ghat_node';

export interface TNNode {
  id: string;
  name: string;
  nameTamil: string;
  district: string;
  districtTamil: string;
  category: TNNodeCategory;
  lat: number;
  lng: number;
  elevationMeters: number;
  accessibilityScore: number; // 0 - 100
  hasElevator: boolean;
  elevatorWorking: boolean;
  hasRamp: boolean;
  rampSlopePercent: number; // e.g. 3.2%
  hasTactilePaving: boolean;
  accessibleRestrooms: boolean;
  batteryBuggyService: boolean;
  lowFloorBusConnectivity: boolean;
  tertiaryHospitalProximityKm: number;
  evSuperchargersCount: number;
  description: string;
  isHighCrowdZone?: boolean;
}

export type TNHighwayCode =
  | 'NH 44'
  | 'NH 544'
  | 'NH 45 (GST Road)'
  | 'East Coast Corridor'
  | 'SH Ghat Corridor'
  | 'NH 83'
  | 'NH 381';

export type SurfaceQuality = 'expressway_grade' | '4_lane_divided' | '2_lane_paved' | 'ghat_hairpin_steep' | 'coastal_inundated';

export interface TNHighwayEdge {
  id: string;
  source: string;
  target: string;
  name: string;
  nameTamil: string;
  highwayCode: TNHighwayCode;
  distanceKm: number;
  lanes: number;
  speedLimitKmh: number;
  baseTimeHours: number;
  maxGradientPercent: number;
  surfaceQuality: SurfaceQuality;
  tollPlazaCount: number;
  tollWaitMinutes: number;
  baseCongestion: number; // 1.0 = free flow, 2.0 = heavy backlog
  carbonGramsPerTonKm: number;
  hasUniversalHighwayRestStops: boolean;
  restStopFrequencyKm: number;
  isGhatRoad: boolean;
  isCoastalProneToFlooding: boolean;
  accessibilityScore: number; // 0 - 100
}

export type TNHazardType =
  | 'monsoon_flooding'
  | 'toll_congestion'
  | 'ghat_landslide'
  | 'broken_lift'
  | 'surface_hazard';

export type HazardSeverity = 'low' | 'medium' | 'critical';

export interface TNHazardIncident {
  id: string;
  type: TNHazardType;
  title: string;
  titleTamil: string;
  description: string;
  severity: HazardSeverity;
  lat: number;
  lng: number;
  associatedEdgeId?: string;
  associatedNodeId?: string;
  reportedAt: string;
  delayMultiplier: number;
  barrierScorePenalty: number;
  resolved: boolean;
}

export type TNRouteProfile =
  | 'freight_express'
  | 'green_corridor'
  | 'accessible_transit'
  | 'medical_emergency';

export interface TNProfileWeights {
  w_dist: number;    // Distance weight
  w_time: number;    // Travel time & toll delay weight
  w_barrier: number; // Accessibility barrier & terrain deficit weight
  w_eco: number;     // Carbon emission & EV efficiency weight
}

export interface TNTurnInstruction {
  id: string;
  instruction: string;
  instructionTamil: string;
  distanceKm: number;
  durationMinutes: number;
  highwayCode?: string;
  accessibilityCheckpoint?: string;
  accessibilityCheckpointTamil?: string;
  audioAnnouncement: string;
  isStepFreeOrHighwayGrade: boolean;
  gradientPercent: number;
}

export interface TNElevationPoint {
  distanceKm: number;
  elevationM: number;
  slopePercent: number;
  locationName: string;
}

export interface TNRouteComputationResult {
  profile: TNRouteProfile;
  pathNodeIds: string[];
  pathEdges: TNHighwayEdge[];
  coordinates: [number, number][];
  totalDistanceKm: number;
  totalTimeHours: number;
  totalCost: number;
  accessibilityScore: number; // 0 - 100
  carbonEmissionKg: number;
  carbonSavedVsStandardKg: number;
  timeDiffVsStandardHours: number;
  stepFreeRestStopPct: number;
  maxGradientPercent: number;
  tollPlazasTotal: number;
  tollWaitTotalMinutes: number;
  elevationProfile: TNElevationPoint[];
  turnByTurn: TNTurnInstruction[];
  hazardsEncountered: TNHazardIncident[];
  avoidedHazardsCount: number;
  ratingBreakdown: {
    safety: number;
    speed: number;
    eco: number;
    inclusivity: number;
    gradientSafety: number;
  };
}

export type TNPersonaType = 'commander' | 'navigator' | 'planner';

export type TNCommuterFilter = 'wheelchair' | 'elderly' | 'visual_impairment' | 'medical_patient';

export type WeatherScenario = 'clear' | 'monsoon_cyclone' | 'extreme_summer';

export interface TNStateVehicle {
  id: string;
  code: string;
  name: string;
  type: 'electric_semi' | 'heavy_container_hauler' | 'reefer_coldchain' | 'accessible_ambulance';
  batteryOrFuelPct: number;
  status: 'active' | 'in_transit' | 'docked';
  currentLat: number;
  currentLng: number;
  currentCargo?: string;
  capacityTons: number;
  currentPayloadTons: number;
  driverName: string;
  isZeroEmission: boolean;
}

export interface TNOrder {
  id: string;
  consignmentNo: string;
  originNodeId: string;
  destinationNodeId: string;
  cargoType: 'automotive' | 'textiles' | 'perishable_agri' | 'medical_critical';
  cargoName: string;
  cargoNameTamil: string;
  weightTons: number;
  isColdChain: boolean;
  priority: 'critical' | 'express' | 'standard';
  assignedVehicleId?: string;
  status: 'pending' | 'dispatched' | 'delivered';
  etaHours: number;
}

export interface TNDistrictScorecard {
  districtName: string;
  districtNameTamil: string;
  logisticsRank: number;
  logisticsEfficiencyScore: number; // 0 - 100
  accessibilityScore: number; // 0 - 100
  blackspotsCount: number;
  populationLakhs: number;
  equityPriority: 'high' | 'medium' | 'low';
  budgetRecommendedINR: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  titleTamil: string;
  description: string;
  originId: string;
  destinationId: string;
  recommendedProfile: TNRouteProfile;
  commuterFilter?: TNCommuterFilter;
  badge: string;
  injectedHazard?: {
    type: TNHazardType;
    edgeId: string;
    title: string;
  };
}

export interface CustomLocationData {
  lat: number;
  lng: number;
  label: string;
  isLiveGps: boolean;
  accuracyMeters?: number;
  nearestHubId: string;
  nearestHubName: string;
  nearestHubNameTamil: string;
  nearestHubDistrict: string;
  distanceToHubKm: number;
}

export interface NavigationStep {
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

export interface NavigationRouteData {
  realRoadCoordinates: [number, number][];
  steps: NavigationStep[];
  totalDistanceKm: number;
  totalDurationHours: number;
  totalDurationFormatted: string;
  primaryHighways: string[];
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
  coordinates: [number, number][];
  steps: NavigationStep[];
  primaryHighways: string[];
  summary: string;
  provider: 'google' | 'openrouteservice' | 'osrm';
  isSimulatedTraffic: boolean;
}

export interface RouteConfigInfo {
  activeProvider: 'google' | 'openrouteservice' | 'osrm';
  hasGoogleKey: boolean;
  hasOrsKey: boolean;
  trafficSupported: boolean;
  providerLabel: string;
}

export interface WhatIfScenarioResult {
  scenarioId: string;
  scenarioTitle: string;
  scenarioTitleTamil: string;
  originalRouteTitle: string;
  recalculatedRouteTitle: string;
  originalDistanceKm: number;
  originalDurationFormatted: string;
  alternativeDistanceKm: number;
  alternativeDurationFormatted: string;
  distanceDiffKm: number;
  etaDiffMinutes: number;
  riskDiffPercent: number;
  recommendation: string;
  recommendationTamil: string;
  isSimulated: boolean;
}

export interface RouteAiEvaluation {
  routeId: string;
  overallScore: number;
  accessibilityScore: number;
  gradientSafetyScore: number;
  riskScore: number;
  predictedDelayMinutes: number;
  reliabilityScore: number;
  suitability: string;
  suitabilityTamil: string;
  logisticsPriorityFit: 'High' | 'Medium' | 'Standard';
  keyHighlights: string[];
  keyHighlightsTamil: string[];
}

export interface AiRouteRecommendation {
  recommendedRouteId: string;
  recommendedRouteIndex: number;
  recommendationTitle: string;
  recommendationTitleTamil: string;
  whyThisRoute: string[];
  whyThisRouteTamil: string[];
  evaluations: Record<string, RouteAiEvaluation>;
  disclaimer: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'commander' | 'navigator' | 'planner';
  district: string;
  designation: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CopilotAction {
  type: 'SWITCH_TAB';
  target: 'State Map' | 'Operations Hub' | 'Split';
  origin?: string;
  destination?: string;
  routeId?: string;
  waypoints?: [number, number][];
  title?: string;
}

export interface CopilotHighlightedRoute {
  routeId?: string;
  title?: string;
  origin?: string;
  destination?: string;
  waypoints: [number, number][];
}



