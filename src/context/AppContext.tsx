import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { 
  TNNode, 
  TNHighwayEdge, 
  TNHazardIncident, 
  TNStateVehicle, 
  TNOrder, 
  TNDistrictScorecard, 
  DemoScenario, 
  TNRouteProfile, 
  TNProfileWeights, 
  TNRouteComputationResult, 
  TNPersonaType, 
  TNCommuterFilter, 
  WeatherScenario,
  TNHazardType,
  CustomLocationData,
  NavigationRouteData,
  NavigationStep,
  RealRoadRoute,
  RouteConfigInfo,
  WhatIfScenarioResult,
  AiRouteRecommendation,
  UserProfile,
  CopilotAction,
  CopilotHighlightedRoute
} from '../types';
import { LiveWeatherHub, CorridorWeatherSummary } from '../types/weather';
import { WeatherService } from '../services/weatherService';
import { 
  TN_STATE_NODES, 
  TN_HIGHWAY_EDGES, 
  TN_INITIAL_HAZARDS, 
  TN_FLEET_VEHICLES, 
  TN_STATE_ORDERS, 
  TN_DISTRICT_SCORECARDS, 
  TN_DEMO_SCENARIOS, 
  TN_DEFAULT_WEIGHTS 
} from '../data/tnGeographicData';
import { TNRoutingAlgorithm } from '../engine/routingAlgorithm';
import { TNPredictiveTrafficEngine } from '../engine/predictiveTraffic';
import { audioAssistant } from '../utils/audioAssistant';
import { OsrmRoutingService } from '../services/osrmRoutingService';
import { RealRoadRoutingService } from '../services/realRoadRoutingService';
import { RealRoadAiScorer } from '../engine/realRoadAiScorer';
import { AuthService } from '../services/authService';


export interface TNAlertNotification {
  id: string;
  title: string;
  titleTamil: string;
  description: string;
  timeDiffHours: number;
  costDiff: number;
  accessibilityDiff: number;
  avoidedHazardTitle: string;
  timestamp: string;
}

interface AppContextType {
  // Localization & Persona
  language: 'en' | 'ta';
  setLanguage: (lang: 'en' | 'ta') => void;
  persona: TNPersonaType;
  setPersona: (p: TNPersonaType) => void;
  commuterFilter: TNCommuterFilter;
  setCommuterFilter: (f: TNCommuterFilter) => void;

  // Routing Configuration
  routeProfile: TNRouteProfile;
  setRouteProfile: (p: TNRouteProfile) => void;
  weights: TNProfileWeights;
  setWeight: (key: keyof TNProfileWeights, value: number) => void;
  resetWeightsToDefault: () => void;
  originId: string;
  destinationId: string;
  setOriginId: (id: string) => void;
  setDestinationId: (id: string) => void;
  swapOriginDestination: () => void;

  // Simulation & Weather
  hourOfDay: number;
  setHourOfDay: (h: number) => void;
  weather: WeatherScenario;
  setWeather: (w: WeatherScenario) => void;
  liveWeatherStations: LiveWeatherHub[];
  corridorWeather: CorridorWeatherSummary | null;
  isWeatherModalOpen: boolean;
  setIsWeatherModalOpen: (open: boolean) => void;
  refreshLiveWeather: () => Promise<void>;

  // Entities
  nodes: TNNode[];
  edges: TNHighwayEdge[];
  hazards: TNHazardIncident[];
  fleet: TNStateVehicle[];
  orders: TNOrder[];
  districtScorecards: TNDistrictScorecard[];
  demoScenarios: DemoScenario[];
  activeScenarioId: string | null;
  loadDemoScenario: (scenarioId: string) => void;

  // Computed Routing Output
  currentRoute: TNRouteComputationResult;
  standardBaselineRoute: TNRouteComputationResult;

  // Live GPS & Manual Location Pin
  customLocation: CustomLocationData | null;
  setCustomLocation: (loc: CustomLocationData | null) => void;
  setCustomAsOrigin: () => void;
  setCustomAsDestination: () => void;
  routeCustomToNearestHub: () => void;
  clearCustomLocation: () => void;

  // Real Road Snapped Navigation & OSRM
  navigationRouteData: NavigationRouteData | null;
  activeStepIndex: number;
  setActiveStepIndex: (index: number) => void;
  isNavigationDrawerOpen: boolean;
  setIsNavigationDrawerOpen: (open: boolean) => void;
  isNavigationHudVisible: boolean;
  setIsNavigationHudVisible: (visible: boolean) => void;
  isOsrmLoading: boolean;

  // Real Road Routing & Alternatives (Google Routes API / OpenRouteService / OSRM)
  realRoadRoutes: RealRoadRoute[];
  selectedRealRouteIndex: number;
  setSelectedRealRouteIndex: (idx: number) => void;
  activeRealRoute: RealRoadRoute | null;
  routingProviderConfig: RouteConfigInfo;
  isRealRoadLoading: boolean;
  realRoadError: string | null;
  calculateRealRoadRoute: (options?: { forceBypassSalem?: boolean; scenario?: string }) => Promise<void>;
  aiRouteRecommendation: AiRouteRecommendation | null;

  // What-If Scenarios
  activeWhatIfScenario: string | null;
  whatIfResult: WhatIfScenarioResult | null;
  triggerWhatIfScenario: (scenarioId: string | null) => Promise<void>;

  // Authentication & Backend User State
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;

  // Dashboard & Map Layout Management
  viewLayout: 'map' | 'split' | 'dashboard';
  setViewLayout: (layout: 'map' | 'split' | 'dashboard') => void;

  // AI Copilot Navigation & Route Highlighting
  copilotHighlightedRoute: CopilotHighlightedRoute | null;
  setCopilotHighlightedRoute: (route: CopilotHighlightedRoute | null) => void;
  clearCopilotHighlightedRoute: () => void;
  dispatchCopilotAction: (action: CopilotAction) => void;



  // Dynamic Hazard Management
  spawnHazard: (type: TNHazardType, lat: number, lng: number, title?: string, edgeId?: string) => void;
  resolveHazard: (hazardId: string) => void;
  aiAlert: TNAlertNotification | null;
  dismissAiAlert: () => void;
  triggerAutonomousReroute: () => void;

  // Inspect & Audit
  inspectedNode: TNNode | null;
  inspectedEdge: TNHighwayEdge | null;
  setInspectedNode: (node: TNNode | null) => void;
  setInspectedEdge: (edge: TNHighwayEdge | null) => void;

  // Fleet & Dispatch
  dispatchOrder: (orderId: string, vehicleId?: string) => void;

  // Accessibility & WCAG Controls
  highContrastMode: boolean;
  toggleHighContrast: () => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  voiceMuted: boolean;
  toggleVoiceMute: () => void;
  speakText: (text: string, priority?: boolean) => void;

  // Map Click Targeting
  mapClickMode: 'default' | 'spawn_hazard';
  setMapClickMode: (mode: 'default' | 'spawn_hazard') => void;
  pendingHazardType: TNHazardType;
  setPendingHazardType: (t: TNHazardType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [persona, setPersona] = useState<TNPersonaType>('commander');
  const [commuterFilter, setCommuterFilter] = useState<TNCommuterFilter>('wheelchair');
  const [routeProfile, setRouteProfileState] = useState<TNRouteProfile>('freight_express');
  const [weights, setWeights] = useState<TNProfileWeights>(TN_DEFAULT_WEIGHTS['freight_express']);

  const [originId, setOriginId] = useState<string>('sriperumbudur_cluster');
  const [destinationId, setDestinationId] = useState<string>('thoothukudi_port');

  const [hourOfDay, setHourOfDay] = useState<number>(10);
  const [weather, setWeather] = useState<WeatherScenario>('clear');

  // Live Meteorological Weather State
  const [liveWeatherStations, setLiveWeatherStations] = useState<LiveWeatherHub[]>([]);
  const [corridorWeather, setCorridorWeather] = useState<CorridorWeatherSummary | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);

  const refreshLiveWeather = useCallback(async () => {
    try {
      const stations = await WeatherService.getLiveWeather();
      if (stations && stations.length > 0) {
        setLiveWeatherStations(stations);
      }
      const corridor = await WeatherService.getCorridorWeather(originId, destinationId);
      if (corridor) {
        setCorridorWeather(corridor);
      }
    } catch (err) {
      console.warn('Weather refresh error:', err);
    }
  }, [originId, destinationId]);

  useEffect(() => {
    refreshLiveWeather();
    const interval = setInterval(refreshLiveWeather, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshLiveWeather]);

  const [nodes] = useState<TNNode[]>(TN_STATE_NODES);
  const [edges] = useState<TNHighwayEdge[]>(TN_HIGHWAY_EDGES);
  const [hazards, setHazards] = useState<TNHazardIncident[]>(TN_INITIAL_HAZARDS);
  const [fleet, setFleet] = useState<TNStateVehicle[]>(TN_FLEET_VEHICLES);
  const [orders, setOrders] = useState<TNOrder[]>(TN_STATE_ORDERS);
  const [districtScorecards] = useState<TNDistrictScorecard[]>(TN_DISTRICT_SCORECARDS);
  const [demoScenarios] = useState<DemoScenario[]>(TN_DEMO_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('scenario_auto_export');

  // Live GPS & Manual Pin Location State
  const [customLocation, setCustomLocation] = useState<CustomLocationData | null>(null);

  // Compute effective nodes & edges dynamically incorporating custom pin
  const { effectiveNodes, effectiveEdges } = useMemo(() => {
    if (!customLocation) {
      return { effectiveNodes: TN_STATE_NODES, effectiveEdges: TN_HIGHWAY_EDGES };
    }

    const customNodeId = 'custom_pin_node';
    const nearestHub = TN_STATE_NODES.find(n => n.id === customLocation.nearestHubId) || TN_STATE_NODES[0];

    const customNode: TNNode = {
      id: customNodeId,
      name: customLocation.isLiveGps ? `GPS Location (${nearestHub.district})` : `Manual Pin (${nearestHub.district})`,
      nameTamil: customLocation.isLiveGps ? `நேரலை ஜிபிஎஸ் (${nearestHub.districtTamil})` : `பயனர் இருப்பிடம் (${nearestHub.districtTamil})`,
      district: nearestHub.district,
      districtTamil: nearestHub.districtTamil,
      category: 'transit_terminal',
      lat: customLocation.lat,
      lng: customLocation.lng,
      elevationMeters: nearestHub.elevationMeters,
      accessibilityScore: 88,
      hasElevator: true,
      elevatorWorking: true,
      hasRamp: true,
      rampSlopePercent: 3.0,
      hasTactilePaving: true,
      accessibleRestrooms: true,
      batteryBuggyService: true,
      lowFloorBusConnectivity: true,
      tertiaryHospitalProximityKm: 4.5,
      evSuperchargersCount: 2,
      description: `Custom ${customLocation.isLiveGps ? 'Live GPS' : 'Manual'} location pin at ${customLocation.lat.toFixed(4)}, ${customLocation.lng.toFixed(4)} with direct feeder connection to ${nearestHub.name}.`
    };

    const feederDist = Math.max(0.5, Math.round(customLocation.distanceToHubKm * 10) / 10);
    const feederEdge: TNHighwayEdge = {
      id: `feeder_edge_${customNodeId}_${nearestHub.id}`,
      source: customNodeId,
      target: nearestHub.id,
      name: `Feeder Link ➔ ${nearestHub.name}`,
      nameTamil: `${nearestHub.nameTamil} இணைப்பு சாலை`,
      highwayCode: 'NH 83',
      distanceKm: feederDist,
      lanes: 2,
      speedLimitKmh: 50,
      baseTimeHours: Math.max(0.05, Math.round((feederDist / 45) * 100) / 100),
      maxGradientPercent: 2.2,
      surfaceQuality: '2_lane_paved',
      tollPlazaCount: 0,
      tollWaitMinutes: 0,
      baseCongestion: 1.05,
      carbonGramsPerTonKm: 70,
      hasUniversalHighwayRestStops: true,
      restStopFrequencyKm: 15,
      isGhatRoad: false,
      isCoastalProneToFlooding: false,
      accessibilityScore: 85
    };

    return {
      effectiveNodes: [customNode, ...TN_STATE_NODES],
      effectiveEdges: [feederEdge, ...TN_HIGHWAY_EDGES]
    };
  }, [customLocation]);

  const setCustomAsOrigin = useCallback(() => {
    if (!customLocation) return;
    setOriginId('custom_pin_node');
    if (destinationId === 'custom_pin_node') {
      setDestinationId(customLocation.nearestHubId);
    }
  }, [customLocation, destinationId]);

  const setCustomAsDestination = useCallback(() => {
    if (!customLocation) return;
    setDestinationId('custom_pin_node');
    if (originId === 'custom_pin_node') {
      setOriginId(customLocation.nearestHubId);
    }
  }, [customLocation, originId]);

  const routeCustomToNearestHub = useCallback(() => {
    if (!customLocation) return;
    setOriginId('custom_pin_node');
    setDestinationId(customLocation.nearestHubId);
  }, [customLocation]);

  const clearCustomLocation = useCallback(() => {
    setCustomLocation(null);
    if (originId === 'custom_pin_node') {
      setOriginId('sriperumbudur_cluster');
    }
    if (destinationId === 'custom_pin_node') {
      setDestinationId('thoothukudi_port');
    }
  }, [originId, destinationId]);

  const [inspectedNode, setInspectedNode] = useState<TNNode | null>(null);
  const [inspectedEdge, setInspectedEdge] = useState<TNHighwayEdge | null>(null);
  const [aiAlert, setAiAlert] = useState<TNAlertNotification | null>(null);

  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const [fontScale, setFontScaleState] = useState<number>(1.0);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);

  const [mapClickMode, setMapClickMode] = useState<'default' | 'spawn_hazard'>('default');
  const [pendingHazardType, setPendingHazardType] = useState<TNHazardType>('monsoon_flooding');

  const setRouteProfile = useCallback((profile: TNRouteProfile) => {
    setRouteProfileState(profile);
    setWeights(TN_DEFAULT_WEIGHTS[profile]);
  }, []);

  const setWeight = useCallback((key: keyof TNProfileWeights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetWeightsToDefault = useCallback(() => {
    setWeights(TN_DEFAULT_WEIGHTS[routeProfile]);
  }, [routeProfile]);

  const swapOriginDestination = useCallback(() => {
    setOriginId(destinationId);
    setDestinationId(originId);
  }, [originId, destinationId]);

  // Compute Standard baseline freight route
  const standardBaselineRoute = useMemo(() => {
    return TNRoutingAlgorithm.computeRoute({
      originId,
      destinationId,
      profile: 'freight_express',
      weights: TN_DEFAULT_WEIGHTS['freight_express'],
      nodes: effectiveNodes,
      edges: effectiveEdges,
      hazards,
      hourOfDay,
      weather
    });
  }, [originId, destinationId, effectiveNodes, effectiveEdges, hazards, hourOfDay, weather]);

  // Compute Selected profile route (legacy baseline)
  const rawComputedRoute = useMemo(() => {
    const computed = TNRoutingAlgorithm.computeRoute({
      originId,
      destinationId,
      profile: routeProfile,
      weights,
      nodes: effectiveNodes,
      edges: effectiveEdges,
      hazards,
      hourOfDay,
      weather,
      commuterFilter
    });

    computed.timeDiffVsStandardHours = Math.round((computed.totalTimeHours - standardBaselineRoute.totalTimeHours) * 10) / 10;
    computed.carbonSavedVsStandardKg = Math.max(0, Math.round(standardBaselineRoute.carbonEmissionKg - computed.carbonEmissionKg));

    return computed;
  }, [originId, destinationId, routeProfile, weights, effectiveNodes, effectiveEdges, hazards, hourOfDay, weather, commuterFilter, standardBaselineRoute]);

  // Real Road Routing & Alternative Corridors State
  const [realRoadRoutes, setRealRoadRoutes] = useState<RealRoadRoute[]>([]);
  const [selectedRealRouteIndex, setSelectedRealRouteIndex] = useState<number>(0);
  const [routingProviderConfig, setRoutingProviderConfig] = useState<RouteConfigInfo>({
    activeProvider: 'osrm',
    hasGoogleKey: false,
    hasOrsKey: false,
    trafficSupported: false,
    providerLabel: 'Real Road Network (OSRM Highway Grid)'
  });
  const [isRealRoadLoading, setIsRealRoadLoading] = useState<boolean>(false);
  const [realRoadError, setRealRoadError] = useState<string | null>(null);
  const [aiRouteRecommendation, setAiRouteRecommendation] = useState<AiRouteRecommendation | null>(null);
  const [activeWhatIfScenario, setActiveWhatIfScenario] = useState<string | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfScenarioResult | null>(null);

  // Authentication & Backend User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => AuthService.getCachedUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'map' | 'split' | 'dashboard'>('map');

  // Check backend session on mount
  useEffect(() => {
    AuthService.getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        setPersona(user.role);
      }
    }).catch(() => {});
  }, [setPersona]);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setCurrentUser(null);
  }, []);

  // Active Real Road Route
  const activeRealRoute = realRoadRoutes[selectedRealRouteIndex] || null;


  // Real Road Snapped Navigation & HUD
  const [navigationRouteData, setNavigationRouteData] = useState<NavigationRouteData | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isNavigationDrawerOpen, setIsNavigationDrawerOpen] = useState<boolean>(false);
  const [isNavigationHudVisible, setIsNavigationHudVisible] = useState<boolean>(true);
  const isOsrmLoading = isRealRoadLoading;

  // Overlay currentRoute with real road network geometry, distance, and duration
  const currentRoute = useMemo(() => {
    if (activeRealRoute && activeRealRoute.coordinates.length > 1) {
      return {
        ...rawComputedRoute,
        coordinates: activeRealRoute.coordinates,
        totalDistanceKm: activeRealRoute.distanceKm,
        totalTimeHours: activeRealRoute.durationHours
      };
    }
    return rawComputedRoute;
  }, [rawComputedRoute, activeRealRoute]);

  // Fetch routing provider configuration on mount
  useEffect(() => {
    RealRoadRoutingService.getProviderConfig().then(cfg => {
      setRoutingProviderConfig(cfg);
    }).catch(() => {});
  }, []);

  // Synchronize navigationRouteData when activeRealRoute changes
  useEffect(() => {
    if (activeRealRoute && activeRealRoute.coordinates.length > 1) {
      setNavigationRouteData({
        realRoadCoordinates: activeRealRoute.coordinates,
        steps: activeRealRoute.steps,
        totalDistanceKm: activeRealRoute.distanceKm,
        totalDurationHours: activeRealRoute.durationHours,
        totalDurationFormatted: activeRealRoute.durationFormatted,
        primaryHighways: activeRealRoute.primaryHighways
      });
      setActiveStepIndex(0);
    }
  }, [activeRealRoute]);

  // Primary Real Road Route Calculator
  const calculateRealRoadRoute = useCallback(async (options?: { forceBypassSalem?: boolean; scenario?: string }) => {
    setIsRealRoadLoading(true);
    setRealRoadError(null);

    const originNode = effectiveNodes.find(n => n.id === originId) || effectiveNodes[0];
    const destNode = effectiveNodes.find(n => n.id === destinationId) || effectiveNodes[1];

    if (!originNode || !destNode) {
      setIsRealRoadLoading(false);
      return;
    }

    try {
      const result = await RealRoadRoutingService.calculateRealRoadRoute({
        origin: [originNode.lat, originNode.lng],
        destination: [destNode.lat, destNode.lng],
        originName: originNode.name,
        destName: destNode.name,
        avoidCorridor: options?.forceBypassSalem ? 'salem' : undefined
      });

      if (result.status === 'success' && result.routes.length > 0) {
        setRealRoadRoutes(result.routes);
        setSelectedRealRouteIndex(0);

        // Run AI Multi-Objective Comparison & Intelligence Layer
        const aiRec = RealRoadAiScorer.evaluateRoutes({
          routes: result.routes,
          profile: routeProfile,
          hazards,
          hourOfDay,
          weather
        });
        setAiRouteRecommendation(aiRec);

        // Update navigation steps
        const primary = result.routes[0];
        setNavigationRouteData({
          realRoadCoordinates: primary.coordinates,
          steps: primary.steps,
          totalDistanceKm: primary.distanceKm,
          totalDurationHours: primary.durationHours,
          totalDurationFormatted: primary.durationFormatted,
          primaryHighways: primary.primaryHighways
        });
        setActiveStepIndex(0);
      } else {
        setRealRoadError(result.message || 'Unable to calculate the route. Please check the locations or routing service.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Real road routing error:', err);
      setRealRoadError(`Unable to calculate real road route (${msg}). Check connection or routing service.`);
    } finally {
      setIsRealRoadLoading(false);
    }
  }, [originId, destinationId, effectiveNodes, routeProfile, hazards, hourOfDay, weather]);

  // Automatically compute real road route when origin, destination or custom pin coordinates change
  useEffect(() => {
    calculateRealRoadRoute();
  }, [originId, destinationId, customLocation?.lat, customLocation?.lng]);

  // Re-run AI decision scorer when route profile or weather or hazards change
  useEffect(() => {
    if (realRoadRoutes.length > 0) {
      const aiRec = RealRoadAiScorer.evaluateRoutes({
        routes: realRoadRoutes,
        profile: routeProfile,
        hazards,
        hourOfDay,
        weather
      });
      setAiRouteRecommendation(aiRec);
    }
  }, [routeProfile, hazards, hourOfDay, weather, realRoadRoutes]);

  // What-If Scenario Simulator with Real Recalculation
  const triggerWhatIfScenario = useCallback(async (scenarioId: string | null) => {
    setActiveWhatIfScenario(scenarioId);
    if (!scenarioId) {
      setWhatIfResult(null);
      return;
    }

    if (scenarioId === 'salem_blocked') {
      // Recalculate detour route bypassing Salem
      setIsRealRoadLoading(true);
      try {
        const originNode = effectiveNodes.find(n => n.id === originId) || effectiveNodes[0];
        const destNode = effectiveNodes.find(n => n.id === destinationId) || effectiveNodes[1];

        const detourResult = await RealRoadRoutingService.calculateRealRoadRoute({
          origin: [originNode.lat, originNode.lng],
          destination: [destNode.lat, destNode.lng],
          originName: originNode.name,
          destName: destNode.name,
          avoidCorridor: 'salem'
        });

        if (detourResult.status === 'success' && detourResult.routes.length > 0) {
          const detourRoute = detourResult.routes[0];
          const baseRoute = realRoadRoutes[0] || detourRoute;
          const distDiff = Math.round((detourRoute.distanceKm - baseRoute.distanceKm) * 10) / 10;
          const etaDiffMin = Math.round((detourRoute.durationHours - baseRoute.durationHours) * 60);

          setWhatIfResult({
            scenarioId: 'salem_blocked',
            scenarioTitle: 'What if Salem corridor is blocked?',
            scenarioTitleTamil: 'சேலம் வழித்தடம் முடக்கப்பட்டால் என்ன நடக்கும்?',
            originalRouteTitle: baseRoute.title,
            recalculatedRouteTitle: detourRoute.title,
            originalDistanceKm: baseRoute.distanceKm,
            originalDurationFormatted: baseRoute.durationFormatted,
            alternativeDistanceKm: detourRoute.distanceKm,
            alternativeDurationFormatted: detourRoute.durationFormatted,
            distanceDiffKm: distDiff,
            etaDiffMinutes: etaDiffMin,
            riskDiffPercent: -35,
            recommendation: 'Divert freight traffic via Karur-Trichy NH 81 and GST Road NH 45. Bypasses Salem bottleneck completely, saving corridor backlogs.',
            recommendationTamil: 'கரூர்-திருச்சி NH 81 & GST சாலை வழியாக சரக்குகளை திருப்பிவிடவும். சேலம் தடையை தவிர்த்து பயண நேரத்தை சீராக்குகிறது.',
            isSimulated: false
          });

          // Add detour route as selectable option
          setRealRoadRoutes([baseRoute, detourRoute]);
          setSelectedRealRouteIndex(1);
        }
      } catch (err) {
        console.warn('What-If detour failed:', err);
      } finally {
        setIsRealRoadLoading(false);
      }
    } else if (scenarioId === 'traffic_surge_30') {
      const base = realRoadRoutes[selectedRealRouteIndex] || realRoadRoutes[0];
      setWhatIfResult({
        scenarioId: 'traffic_surge_30',
        scenarioTitle: 'What if statewide traffic increases by 30%?',
        scenarioTitleTamil: 'மாநில போக்குவரத்து நெரிசல் 30% அதிகரித்தால்?',
        originalRouteTitle: base?.title || 'Route 1',
        recalculatedRouteTitle: 'Off-Peak / Diverted Corridor',
        originalDistanceKm: base?.distanceKm || 500,
        originalDurationFormatted: base?.durationFormatted || '6 hr 25 min',
        alternativeDistanceKm: base?.distanceKm || 500,
        alternativeDurationFormatted: '+1 hr 55 min added delay',
        distanceDiffKm: 0,
        etaDiffMinutes: 115,
        riskDiffPercent: 42,
        recommendation: 'Severe congestion predicted at Paranur and Samayapuram toll plazas. Divert high-priority freight to off-peak slots (after 21:00) or dispatch via secondary 4-lane bypasses.',
        recommendationTamil: 'சுங்கச்சாவடிகளில் கடுமையான நெரிசல் ஏற்படும். இரவு 9 மணிக்கு மேல் அல்லது மாற்று 4-வழிச் சாலை வழியே செல்லவும்.',
        isSimulated: true
      });
    } else if (scenarioId === 'monsoon_rain') {
      const base = realRoadRoutes[selectedRealRouteIndex] || realRoadRoutes[0];
      setWhatIfResult({
        scenarioId: 'monsoon_rain',
        scenarioTitle: 'What if heavy monsoon rain inundates coastal highways?',
        scenarioTitleTamil: 'கடலோர பகுதிகளில் கனமழை வெள்ளப்பெருக்கு ஏற்பட்டால்?',
        originalRouteTitle: base?.title || 'Route 1',
        recalculatedRouteTitle: 'Inland Elevated Corridor (NH 44 via Salem & Dharmapuri)',
        originalDistanceKm: base?.distanceKm || 500,
        originalDurationFormatted: base?.durationFormatted || '6 hr 25 min',
        alternativeDistanceKm: 505.6,
        alternativeDurationFormatted: '6 hr 54 min',
        distanceDiffKm: 5.6,
        etaDiffMinutes: 29,
        riskDiffPercent: -50,
        recommendation: 'Inland NH 44 corridor via Salem, Dharmapuri, and Krishnagiri recommended. Completely avoids low-lying coastal flood inundation along ECR and GST road.',
        recommendationTamil: 'சேலம், தர்மபுரி, கிருஷ்ணகிரி வழியே செல்லும் உள்நாட்டு NH 44 பாதையை தேர்வு செய்யவும். கடலோர வெள்ளப்பெருக்கை தவிர்க்கிறது.',
        isSimulated: true
      });
    } else if (scenarioId === 'medical_critical') {
      const base = realRoadRoutes[selectedRealRouteIndex] || realRoadRoutes[0];
      setWhatIfResult({
        scenarioId: 'medical_critical',
        scenarioTitle: 'What if consignment is high-priority medical cargo?',
        scenarioTitleTamil: 'உயிர்காக்கும் அவசர மருத்துவ சரக்கு என்றால்?',
        originalRouteTitle: base?.title || 'Route 1',
        recalculatedRouteTitle: 'Green Medical Corridor (CMC Vellore / RGGGH Direct)',
        originalDistanceKm: base?.distanceKm || 500,
        originalDurationFormatted: base?.durationFormatted || '6 hr 25 min',
        alternativeDistanceKm: base?.distanceKm || 500,
        alternativeDurationFormatted: base?.durationFormatted || '6 hr 25 min',
        distanceDiffKm: 0,
        etaDiffMinutes: -22,
        riskDiffPercent: -60,
        recommendation: 'Activate green corridor protocol: FASTag green-lane priority clearance at toll gates and hospital gateway routing (CMC Vellore & RGGGH Chennai).',
        recommendationTamil: 'பசுமை வழித்தட நெறிமுறையை செயல்படுத்தவும்: சுங்கச்சாவடிகளில் முன்னுரிமை அனுமதி மற்றும் மருத்துவமனை நேரடி அணுகல்.',
        isSimulated: true
      });
    } else if (scenarioId === 'step_free') {
      const base = realRoadRoutes[selectedRealRouteIndex] || realRoadRoutes[0];
      setWhatIfResult({
        scenarioId: 'step_free',
        scenarioTitle: 'What if wheelchair accessibility restriction is applied?',
        scenarioTitleTamil: 'சக்கர நாற்காலி அணுகல் கட்டுப்பாடு விதிக்கப்பட்டால்?',
        originalRouteTitle: base?.title || 'Route 1',
        recalculatedRouteTitle: 'Grade AAA Accessible Highway Corridor',
        originalDistanceKm: base?.distanceKm || 500,
        originalDurationFormatted: base?.durationFormatted || '6 hr 25 min',
        alternativeDistanceKm: base?.distanceKm || 500,
        alternativeDurationFormatted: base?.durationFormatted || '6 hr 25 min',
        distanceDiffKm: 0,
        etaDiffMinutes: 10,
        riskDiffPercent: -40,
        recommendation: 'Route selected strictly with universal barrier-free rest stops (spaced every 45 km on NH 544/NH 44) and 100% low-gradient interchange ramps (<= 3.5% slope).',
        recommendationTamil: 'முழுமையான மாற்றுத்திறனாளிகள் ஓய்வு மையங்கள் மற்றும் குறைந்த சாய்வுதளம் கொண்ட வழித்தடம் தேர்வு செய்யப்பட்டுள்ளது.',
        isSimulated: true
      });
    }
  }, [effectiveNodes, originId, destinationId, realRoadRoutes, selectedRealRouteIndex]);


  // WCAG & Accessibility Handlers
  const toggleHighContrast = useCallback(() => {
    setHighContrastMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('high-contrast-mode');
      } else {
        document.documentElement.classList.remove('high-contrast-mode');
      }
      return next;
    });
  }, []);

  const setFontScale = useCallback((scale: number) => {
    setFontScaleState(scale);
    document.documentElement.style.setProperty('--font-scale', scale.toString());
  }, []);

  const toggleVoiceMute = useCallback(() => {
    setVoiceMuted(prev => {
      const next = !prev;
      audioAssistant.setMuted(next);
      return next;
    });
  }, []);

  const speakText = useCallback((text: string, priority: boolean = false) => {
    audioAssistant.speak(text, 0.95, priority);
  }, []);

  // Preset Scenario Loader
  const loadDemoScenario = useCallback((scenarioId: string) => {
    const sc = demoScenarios.find(s => s.id === scenarioId);
    if (!sc) return;
    setActiveScenarioId(sc.id);
    setOriginId(sc.originId);
    setDestinationId(sc.destinationId);
    setRouteProfile(sc.recommendedProfile);
    if (sc.commuterFilter) {
      setCommuterFilter(sc.commuterFilter);
    }

    if (sc.recommendedProfile === 'accessible_transit') {
      setPersona('navigator');
    } else if (sc.recommendedProfile === 'medical_emergency') {
      setPersona('navigator');
      setWeather('monsoon_cyclone');
    } else {
      setPersona('commander');
    }

    audioAssistant.playRerouteChime();
    speakText(`Scenario loaded: ${sc.title}. Calculating optimal Tamil Nadu corridor.`, true);
  }, [demoScenarios, setRouteProfile, speakText]);

  // AI Copilot Action Dispatcher & Route Highlighting
  const [copilotHighlightedRoute, setCopilotHighlightedRoute] = useState<CopilotHighlightedRoute | null>(null);

  const clearCopilotHighlightedRoute = useCallback(() => {
    setCopilotHighlightedRoute(null);
  }, []);

  const dispatchCopilotAction = useCallback((action: CopilotAction) => {
    // 1. Switch navigation viewLayout tab
    if (action.target === 'State Map') {
      setViewLayout('map');
    } else if (action.target === 'Operations Hub') {
      setViewLayout('dashboard');
    } else if (action.target === 'Split') {
      setViewLayout('split');
    } else {
      setViewLayout('map');
    }

    let changedEndpoints = false;

    // 2. Resolve origin
    if (action.origin) {
      const q = action.origin.toLowerCase().trim();
      const match = TN_STATE_NODES.find(n => 
        n.id.toLowerCase() === q ||
        n.id.toLowerCase().replace(/_/g, '').includes(q.replace(/_/g, '')) ||
        n.name.toLowerCase().includes(q) ||
        n.district.toLowerCase().includes(q) ||
        n.nameTamil.includes(q)
      );
      if (match) {
        setOriginId(match.id);
        changedEndpoints = true;
      }
    }

    // 3. Resolve destination
    if (action.destination) {
      const q = action.destination.toLowerCase().trim();
      const match = TN_STATE_NODES.find(n => 
        n.id.toLowerCase() === q ||
        n.id.toLowerCase().replace(/_/g, '').includes(q.replace(/_/g, '')) ||
        n.name.toLowerCase().includes(q) ||
        n.district.toLowerCase().includes(q) ||
        n.nameTamil.includes(q)
      );
      if (match) {
        setDestinationId(match.id);
        changedEndpoints = true;
      }
    }

    // 4. Resolve demo scenario if routeId matches
    if (action.routeId) {
      const rId = action.routeId.toLowerCase();
      const sc = demoScenarios.find(s => 
        s.id.toLowerCase() === rId || 
        rId.includes(s.id.toLowerCase()) ||
        s.id.toLowerCase().includes(rId) ||
        (rId.includes('monsoon') && s.id.includes('monsoon')) ||
        (rId.includes('pwd') && s.id.includes('pwd')) ||
        (rId.includes('export') && s.id.includes('auto'))
      );
      if (sc) {
        loadDemoScenario(sc.id);
        changedEndpoints = false; // loadDemoScenario already set origin/dest
      }
    }

    // 5. If high-resolution waypoints provided, highlight them on map
    if (action.waypoints && action.waypoints.length >= 10) {
      setCopilotHighlightedRoute({
        routeId: action.routeId || 'copilot-corridor',
        title: action.title || (language === 'ta' ? 'AI வழித்தட உகப்பாக்கம்' : 'Copilot Route Corridor'),
        origin: action.origin,
        destination: action.destination,
        waypoints: action.waypoints
      });
    } else if (changedEndpoints) {
      setCopilotHighlightedRoute(null);
    }

    audioAssistant.playRerouteChime();
    speakText(
      language === 'ta' 
        ? 'மாநில வரைபடத்தில் துல்லியமான வழித்தடம் காட்டப்படுகிறது.' 
        : 'Displaying requested corridor on Tamil Nadu State Map.',
      false
    );

    // 6. Trigger real road routing calculation if endpoints changed
    if (changedEndpoints) {
      setActiveScenarioId(null);
      setTimeout(() => {
        calculateRealRoadRoute().catch(err => console.debug('Real road routing catch:', err));
      }, 50);
    }
  }, [demoScenarios, loadDemoScenario, language, speakText, calculateRealRoadRoute]);


  // Hazard Spawning & Autonomous Alert
  const spawnHazard = useCallback((type: TNHazardType, lat: number, lng: number, title?: string, edgeId?: string) => {
    const newHazard = TNPredictiveTrafficEngine.createDisruption(type, lat, lng, {
      title,
      associatedEdgeId: edgeId
    });

    setHazards(prev => [newHazard, ...prev]);
    audioAssistant.playHazardChime();

    setAiAlert({
      id: newHazard.id,
      title: `State Incident Detected: ${newHazard.title}`,
      titleTamil: `அவசர நிகழ்வு கண்டறியப்பட்டது: ${newHazard.titleTamil}`,
      description: `Highway corridor disruption reported. Heuristic rerouting applied around bottleneck.`,
      timeDiffHours: 0.6,
      costDiff: -24,
      accessibilityDiff: +16,
      avoidedHazardTitle: newHazard.title,
      timestamp: newHazard.reportedAt
    });

    speakText(`Warning: ${newHazard.title} detected on Tamil Nadu highway. Autonomous corridor diversion activated.`, true);
  }, [speakText]);

  const resolveHazard = useCallback((hazardId: string) => {
    setHazards(prev => prev.map(h => h.id === hazardId ? { ...h, resolved: true } : h));
    audioAssistant.playRerouteChime();
    speakText('Corridor cleared. Restoring standard freight and passenger flow.');
  }, [speakText]);

  const dismissAiAlert = useCallback(() => {
    setAiAlert(null);
  }, []);

  const triggerAutonomousReroute = useCallback(() => {
    audioAssistant.playRerouteChime();
    speakText('Autonomous route optimization locked for Tamil Nadu corridor.');
    dismissAiAlert();
  }, [speakText, dismissAiAlert]);

  // Order Dispatch
  const dispatchOrder = useCallback((orderId: string, vehicleId?: string) => {
    const selectedVehicle = vehicleId || fleet.find(v => v.status === 'active')?.id || 'veh_tn_01';
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'dispatched', assignedVehicleId: selectedVehicle } : o));
    setFleet(prev => prev.map(v => v.id === selectedVehicle ? { ...v, status: 'in_transit' } : v));
    audioAssistant.playRerouteChime();
    speakText('Consignment dispatched with high-gradient safety compliance.');
  }, [fleet, speakText]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        persona,
        setPersona,
        commuterFilter,
        setCommuterFilter,
        routeProfile,
        setRouteProfile,
        weights,
        setWeight,
        resetWeightsToDefault,
        originId,
        destinationId,
        setOriginId,
        setDestinationId,
        swapOriginDestination,
        hourOfDay,
        setHourOfDay,
        weather,
        setWeather,
        liveWeatherStations,
        corridorWeather,
        isWeatherModalOpen,
        setIsWeatherModalOpen,
        refreshLiveWeather,
        nodes: effectiveNodes,
        edges: effectiveEdges,
        customLocation,
        setCustomLocation,
        setCustomAsOrigin,
        setCustomAsDestination,
        routeCustomToNearestHub,
        clearCustomLocation,
        hazards,
        fleet,
        orders,
        districtScorecards,
        demoScenarios,
        activeScenarioId,
        loadDemoScenario,
        currentRoute,
        standardBaselineRoute,
        navigationRouteData,
        activeStepIndex,
        setActiveStepIndex,
        isNavigationDrawerOpen,
        setIsNavigationDrawerOpen,
        isNavigationHudVisible,
        setIsNavigationHudVisible,
        isOsrmLoading,
        realRoadRoutes,
        selectedRealRouteIndex,
        setSelectedRealRouteIndex,
        activeRealRoute,
        routingProviderConfig,
        isRealRoadLoading,
        realRoadError,
        calculateRealRoadRoute,
        aiRouteRecommendation,
        activeWhatIfScenario,
        whatIfResult,
        triggerWhatIfScenario,

        currentUser,
        setCurrentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        logout,
        viewLayout,
        setViewLayout,

        copilotHighlightedRoute,
        setCopilotHighlightedRoute,
        clearCopilotHighlightedRoute,
        dispatchCopilotAction,



        spawnHazard,
        resolveHazard,
        aiAlert,
        dismissAiAlert,
        triggerAutonomousReroute,
        inspectedNode,
        inspectedEdge,
        setInspectedNode,
        setInspectedEdge,
        dispatchOrder,
        highContrastMode,
        toggleHighContrast,
        fontScale,
        setFontScale,
        voiceMuted,
        toggleVoiceMute,
        speakText,
        mapClickMode,
        setMapClickMode,
        pendingHazardType,
        setPendingHazardType
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
