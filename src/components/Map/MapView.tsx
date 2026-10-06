import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../../context/AppContext";
import { TNNode, TNHighwayEdge, TNHazardIncident } from "../../types";
import { NavigationHud } from "../Navigation/NavigationHud";
import { NavigationDrawer } from "../Navigation/NavigationDrawer";
import { 
  Layers, 
  Crosshair, 
  AlertTriangle, 
  ShieldCheck, 
  Mountain, 
  Compass, 
  MapPin, 
  Radio, 
  LocateFixed, 
  Route, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ArrowRight,
  Navigation,
  Activity,
  ListOrdered,
  CloudSun
} from "lucide-react";

export const MapView: React.FC = () => {
  const {
    language,
    nodes,
    edges,
    hazards,
    fleet,
    originId,
    destinationId,
    currentRoute,
    standardBaselineRoute,
    spawnHazard,
    resolveHazard,
    setInspectedNode,
    setInspectedEdge,
    mapClickMode,
    setMapClickMode,
    pendingHazardType,
    highContrastMode,
    customLocation,
    setCustomLocation,
    setCustomAsOrigin,
    setCustomAsDestination,
    routeCustomToNearestHub,
    clearCustomLocation,
    navigationRouteData,
    activeStepIndex,
    setActiveStepIndex,
    isNavigationDrawerOpen,
    setIsNavigationDrawerOpen,
    isOsrmLoading,
    realRoadRoutes,
    selectedRealRouteIndex,
    setSelectedRealRouteIndex,
    copilotHighlightedRoute,
    clearCopilotHighlightedRoute,
    corridorWeather,
    setIsWeatherModalOpen
  } = useApp();


  const isTamil = language === "ta";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const edgesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const baselineRouteLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentRouteLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const stepHighlightLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const nodesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const hazardsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const fleetLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const customPinLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const copilotRouteLayerGroupRef = useRef<L.LayerGroup | null>(null);


  // Basemap style and layer toggles - Google Maps street view tiles as primary
  const [basemapStyle, setBasemapStyle] = useState<"google_streets" | "google_satellite" | "google_hybrid" | "google_terrain" | "osm">("google_streets");
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showHighwayNetwork, setShowHighwayNetwork] = useState<boolean>(true);
  const [showBaselineRoute, setShowBaselineRoute] = useState<boolean>(true);
  const [showFleet, setShowFleet] = useState<boolean>(true);
  const [showAccessibilityBlackspots, setShowAccessibilityBlackspots] = useState<boolean>(false);
  const [showCongestionPrediction, setShowCongestionPrediction] = useState<boolean>(false);
  const [showInfrastructurePriority, setShowInfrastructurePriority] = useState<boolean>(false);
  const [showAiRecommendedCorridors, setShowAiRecommendedCorridors] = useState<boolean>(false);

  // Real-Time Location & Manual Pin Control State
  const [locationMode, setLocationMode] = useState<"manual_pin" | "live_gps" | "off">("manual_pin");
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsWatching, setIsGpsWatching] = useState<boolean>(false);
  const gpsWatchIdRef = useRef<number | null>(null);
  const manualMarkerRef = useRef<L.Marker | null>(null);
  const feederCasingRef = useRef<L.Polyline | null>(null);
  const feederLineRef = useRef<L.Polyline | null>(null);

  // Helper to find nearest Tamil Nadu logistics hub from any coordinate
  const findNearestHub = useCallback((lat: number, lng: number) => {
    let nearest = nodes[0] || {
      id: "trichy_hub",
      name: "Tiruchirappalli Logistics Junction",
      nameTamil: "திருச்சிராப்பள்ளி சரக்கு சந்திப்பு",
      district: "Tiruchirappalli",
      districtTamil: "திருச்சிராப்பள்ளி",
      lat: 10.7905,
      lng: 78.7047
    };
    let minDistance = Infinity;

    for (const node of nodes) {
      if (node.id === "custom_pin_node") continue;
      const dLat = (node.lat - lat) * (Math.PI / 180);
      const dLng = (node.lng - lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) *
          Math.cos(node.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = 6371 * c; // Earth radius in km
      if (d < minDistance) {
        minDistance = d;
        nearest = node;
      }
    }

    return {
      hub: nearest,
      distanceKm: Math.round(minDistance * 10) / 10
    };
  }, [nodes]);

  // Update pin position and propagate feedback immediately
  const updatePinCoordinates = useCallback((lat: number, lng: number, isGps: boolean = false, accuracy?: number) => {
    const { hub, distanceKm } = findNearestHub(lat, lng);
    setCustomLocation({
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      label: isGps ? "Live GPS Position" : `Manual Pin (${hub.district})`,
      isLiveGps: isGps,
      accuracyMeters: accuracy ? Math.round(accuracy) : undefined,
      nearestHubId: hub.id,
      nearestHubName: hub.name,
      nearestHubNameTamil: hub.nameTamil,
      nearestHubDistrict: hub.district,
      distanceToHubKm: distanceKm
    });
  }, [findNearestHub, setCustomLocation]);

  // Handle switching to Live GPS mode
  const startLiveGps = useCallback(() => {
    setLocationMode("live_gps");
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError(isTamil ? "உங்கள் உலாவியில் ஜிபிஎஸ் ஆதரவு இல்லை" : "Geolocation is not supported by your browser");
      return;
    }

    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
    }

    setIsGpsWatching(true);

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        setGpsError(null);
        updatePinCoordinates(lat, lng, true, accuracy);

        // Optionally center map on first GPS fix
        if (mapInstanceRef.current && (!customLocation || !customLocation.isLiveGps)) {
          mapInstanceRef.current.panTo([lat, lng]);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setGpsError(err.message || (isTamil ? "நேரலை ஜிபிஎஸ் அணுகல் பெற முடியவில்லை" : "Unable to access live GPS location"));
        setIsGpsWatching(false);
        // Seamless fallback to manual pin so the user is never stuck
        setLocationMode("manual_pin");
        if (customLocation) {
          updatePinCoordinates(customLocation.lat, customLocation.lng, false);
        } else if (mapInstanceRef.current) {
          const c = mapInstanceRef.current.getCenter();
          updatePinCoordinates(c.lat, c.lng, false);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 12000
      }
    );
  }, [isTamil, updatePinCoordinates, customLocation]);

  // Handle switching to Manual Pin mode
  const activateManualPin = useCallback(() => {
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
    setIsGpsWatching(false);
    setGpsError(null);
    setLocationMode("manual_pin");

    // Center manual pin at map center or current coordinates
    if (!customLocation) {
      if (mapInstanceRef.current) {
        const c = mapInstanceRef.current.getCenter();
        updatePinCoordinates(c.lat, c.lng, false);
      } else {
        updatePinCoordinates(11.1271, 78.6569, false);
      }
    } else {
      updatePinCoordinates(customLocation.lat, customLocation.lng, false);
    }
  }, [customLocation, updatePinCoordinates]);

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  // Helper to get basemap configuration with Google Maps street view tiles
  const getBasemapConfig = (style: typeof basemapStyle, isHighContrast: boolean) => {
    if (isHighContrast) {
      return {
        url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        maxZoom: 20,
        attribution: "Google Maps"
      };
    }

    switch (style) {
      case "google_streets":
      default:
        return {
          url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 20,
          attribution: "Google Maps"
        };
      case "google_satellite":
        return {
          url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 20,
          attribution: "Google Maps"
        };
      case "google_hybrid":
        return {
          url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 20,
          attribution: "Google Maps"
        };
      case "google_terrain":
        return {
          url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 20,
          attribution: "Google Maps"
        };
      case "osm":
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          subdomains: "abc",
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        };
    }
  };

  // Function to re-center directly on Tamil Nadu
  const centerTamilNadu = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([11.1271, 78.6569], 7);
      mapInstanceRef.current.invalidateSize();
    }
  };

  // Initialize Map with Tamil Nadu State Bounds & High Contrast Panes
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered at Tamil Nadu geographic center: [11.1271, 78.6569], Zoom: 7
    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      minZoom: 6,
      maxZoom: 20,
      maxBounds: [
        [7.5, 75.5],  // South-West bound (Kanyakumari / Kerala border)
        [14.2, 81.2]  // North-East bound (Tiruvallur / Andhra / Bay of Bengal)
      ],
      zoomControl: false,
      attributionControl: true
    });

    // Explicitly set initial map view over Tamil Nadu
    map.setView([11.1271, 78.6569], 7);

    // Custom z-index panes so routes and markers stay firmly on top of the map layer with high contrast
    map.createPane("highwaysPane");
    map.getPane("highwaysPane")!.style.zIndex = "420";

    map.createPane("routesPane");
    map.getPane("routesPane")!.style.zIndex = "450";

    map.createPane("markersPane");
    map.getPane("markersPane")!.style.zIndex = "600";

    const config = getBasemapConfig(basemapStyle, highContrastMode);
    const googleTiles = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains,
      attribution: config.attribution
    }).addTo(map);

    baseTileLayerRef.current = googleTiles;

    edgesLayerGroupRef.current = L.layerGroup().addTo(map);
    baselineRouteLayerGroupRef.current = L.layerGroup().addTo(map);
    currentRouteLayerGroupRef.current = L.layerGroup().addTo(map);
    stepHighlightLayerGroupRef.current = L.layerGroup().addTo(map);
    hazardsLayerGroupRef.current = L.layerGroup().addTo(map);
    fleetLayerGroupRef.current = L.layerGroup().addTo(map);
    nodesLayerGroupRef.current = L.layerGroup().addTo(map);
    customPinLayerGroupRef.current = L.layerGroup().addTo(map);
    copilotRouteLayerGroupRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstanceRef.current = map;

    // Call invalidateSize after loading so map tiles render completely without grey gaps
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    // Watch container size changes via ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Initialize default manual pin at center of Tamil Nadu
    updatePinCoordinates(11.1271, 78.6569, false);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if basemap style or High Contrast changes
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);

    const config = getBasemapConfig(basemapStyle, highContrastMode);
    const newTiles = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains,
      attribution: config.attribution
    });
    newTiles.addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newTiles;
    mapInstanceRef.current.invalidateSize();
  }, [basemapStyle, highContrastMode]);

  // Click on map: Supports both Dynamic Hazard Placement and Manual Pin Placement
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (mapClickMode === "spawn_hazard") {
        spawnHazard(pendingHazardType, e.latlng.lat, e.latlng.lng);
        setMapClickMode("default");
      } else {
        // Move manual pin immediately to the clicked coordinates
        if (locationMode !== "manual_pin") {
          setLocationMode("manual_pin");
          setGpsError(null);
        }
        updatePinCoordinates(e.latlng.lat, e.latlng.lng, false);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapClickMode, pendingHazardType, spawnHazard, setMapClickMode, locationMode, updatePinCoordinates]);

  // Render Real-Time Location Marker (Live GPS pulsing dot or Draggable Manual Pin + Feeder Connector)
  useEffect(() => {
    const group = customPinLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (locationMode === "off" || !customLocation) return;

    const isOrigin = originId === "custom_pin_node";
    const isDestination = destinationId === "custom_pin_node";

    // 1. Render Live GPS Marker (Pulsing blue dot + Accuracy Ring)
    if (customLocation.isLiveGps) {
      if (customLocation.accuracyMeters && customLocation.accuracyMeters > 5) {
        const accuracyCircle = L.circle([customLocation.lat, customLocation.lng], {
          radius: customLocation.accuracyMeters,
          color: "#3b82f6",
          fillColor: "#60a5fa",
          fillOpacity: 0.15,
          weight: 1.5,
          pane: "markersPane"
        });
        group.addLayer(accuracyCircle);
      }

      let markerInnerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 rounded-full bg-blue-500/50 animate-ping"></div>
          <div class="absolute w-6 h-6 rounded-full bg-blue-400/30 animate-pulse"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-2xl ring-2 ring-blue-400"></div>
        </div>
      `;

      if (isOrigin) {
        markerInnerHtml = `
          <div class="relative flex items-center justify-center w-9 h-9">
            <div class="absolute inset-0 rounded-full bg-amber-500/60 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white ring-2 ring-blue-600 flex items-center justify-center text-slate-950 font-black shadow-2xl text-xs">
              A
            </div>
          </div>
        `;
      } else if (isDestination) {
        markerInnerHtml = `
          <div class="relative flex items-center justify-center w-9 h-9">
            <div class="absolute inset-0 rounded-full bg-emerald-500/60 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-blue-600 flex items-center justify-center text-white font-black shadow-2xl text-xs">
              B
            </div>
          </div>
        `;
      }

      const gpsIcon = L.divIcon({
        className: "custom-live-gps",
        html: markerInnerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const gpsMarker = L.marker([customLocation.lat, customLocation.lng], {
        icon: gpsIcon,
        pane: "markersPane"
      });

      gpsMarker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="font-bold text-xs text-blue-400 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>${isTamil ? "நேரலை ஜிபிஎஸ் இருப்பிடம்" : "Live GPS Tracking Active"}</span>
          </div>
          <div class="text-[11px] text-white font-mono mt-0.5">${customLocation.lat.toFixed(4)}°N, ${customLocation.lng.toFixed(4)}°E</div>
          <div class="text-[10px] text-slate-300 mt-1">Nearest Hub: <span class="font-bold text-amber-400">${customLocation.nearestHubName}</span> (${customLocation.distanceToHubKm} km)</div>
        </div>`,
        { sticky: true }
      );

      group.addLayer(gpsMarker);
    } 
    // 2. Render Interactive Draggable Manual Pin
    else {
      let pinBadgeHtml = `
        <div class="relative flex flex-col items-center justify-center -translate-y-4 cursor-grab active:cursor-grabbing select-none">
          <div class="px-2 py-0.5 rounded-full bg-slate-900/95 border border-violet-400 text-[10px] font-bold text-violet-300 shadow-2xl whitespace-nowrap mb-1 backdrop-blur-md flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping"></span>
            <span>${isTamil ? "நகர்த்தக்கூடிய பின்" : "Drag Pin"}</span>
          </div>
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute inset-0 rounded-full bg-violet-500/50 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 border-2 border-white ring-2 ring-slate-900 shadow-2xl flex items-center justify-center text-white text-xs font-black">
              📍
            </div>
          </div>
          <div class="w-1.5 h-3 bg-violet-700 -mt-1 rounded-b-full"></div>
          <div class="w-3 h-1 bg-black/50 rounded-full blur-[1px]"></div>
        </div>
      `;

      if (isOrigin) {
        pinBadgeHtml = `
          <div class="relative flex flex-col items-center justify-center -translate-y-4 cursor-grab active:cursor-grabbing select-none">
            <div class="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] shadow-2xl whitespace-nowrap mb-1 flex items-center gap-1 border border-white">
              <span>START POINT (A)</span>
            </div>
            <div class="relative flex items-center justify-center w-9 h-9">
              <div class="absolute inset-0 rounded-full bg-amber-500/60 animate-ping"></div>
              <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white ring-2 ring-slate-950 flex items-center justify-center text-slate-950 font-black shadow-2xl text-xs">
                A
              </div>
            </div>
            <div class="w-1.5 h-3 bg-amber-600 -mt-1 rounded-b-full"></div>
          </div>
        `;
      } else if (isDestination) {
        pinBadgeHtml = `
          <div class="relative flex flex-col items-center justify-center -translate-y-4 cursor-grab active:cursor-grabbing select-none">
            <div class="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] shadow-2xl whitespace-nowrap mb-1 flex items-center gap-1 border border-white">
              <span>DESTINATION (B)</span>
            </div>
            <div class="relative flex items-center justify-center w-9 h-9">
              <div class="absolute inset-0 rounded-full bg-emerald-500/60 animate-ping"></div>
              <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-slate-950 flex items-center justify-center text-white font-black shadow-2xl text-xs">
                B
              </div>
            </div>
            <div class="w-1.5 h-3 bg-emerald-700 -mt-1 rounded-b-full"></div>
          </div>
        `;
      }

      const manualPinIcon = L.divIcon({
        className: "custom-manual-pin",
        html: pinBadgeHtml,
        iconSize: [40, 50],
        iconAnchor: [20, 48]
      });

      const pinMarker = L.marker([customLocation.lat, customLocation.lng], {
        icon: manualPinIcon,
        draggable: true,
        pane: "markersPane"
      });

      // Drag event updates feeder lines smoothly in real time without destroying DOM
      pinMarker.on("drag", (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const latlng = target.getLatLng();
        if (nearestHubNode && feederLineRef.current && feederCasingRef.current) {
          feederLineRef.current.setLatLngs([latlng, [nearestHubNode.lat, nearestHubNode.lng]]);
          feederCasingRef.current.setLatLngs([latlng, [nearestHubNode.lat, nearestHubNode.lng]]);
        }
      });

      // Dragend commits new coordinates to React state and recomputes corridor
      pinMarker.on("dragend", (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const latlng = target.getLatLng();
        updatePinCoordinates(latlng.lat, latlng.lng, false);
      });

      pinMarker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="font-bold text-xs text-violet-300 flex items-center gap-1">
            <span>📍 ${isTamil ? "பயனர் இருப்பிடம்" : "Manual Location Pin"}</span>
          </div>
          <div class="text-[11px] text-white font-mono mt-0.5">${customLocation.lat.toFixed(4)}°N, ${customLocation.lng.toFixed(4)}°E</div>
          <div class="text-[10px] text-slate-300 mt-1">Nearest Hub: <span class="font-bold text-amber-400">${customLocation.nearestHubName}</span> (${customLocation.distanceToHubKm} km)</div>
          <div class="text-[9px] text-violet-400 font-semibold mt-1">Click & Drag to relocate anywhere in Tamil Nadu</div>
        </div>`,
        { sticky: true }
      );

      manualMarkerRef.current = pinMarker;
      group.addLayer(pinMarker);
    }

    // 3. Render Feeder Connector Line from Pin to Nearest Hub
    const nearestHubNode = nodes.find(n => n.id === customLocation.nearestHubId);
    if (nearestHubNode) {
      // Dark casing for feeder line
      const feederCasing = L.polyline([[customLocation.lat, customLocation.lng], [nearestHubNode.lat, nearestHubNode.lng]], {
        color: "#0f172a",
        weight: 5,
        opacity: 0.7,
        pane: "routesPane"
      });
      feederCasingRef.current = feederCasing;
      group.addLayer(feederCasing);

      // Distinct dashed purple/violet feeder line
      const feederLine = L.polyline([[customLocation.lat, customLocation.lng], [nearestHubNode.lat, nearestHubNode.lng]], {
        color: customLocation.isLiveGps ? "#38bdf8" : "#a855f7",
        weight: 3,
        opacity: 0.95,
        dashArray: "4, 6",
        pane: "routesPane"
      });
      feederLineRef.current = feederLine;

      feederLine.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="font-bold text-xs text-violet-300">Direct Feeder Connector Corridor</div>
          <div class="text-[10px] text-slate-200">${customLocation.distanceToHubKm} km to ${nearestHubNode.name}</div>
        </div>`,
        { sticky: true }
      );

      group.addLayer(feederLine);
    }
  }, [customLocation, locationMode, originId, destinationId, isTamil, nodes, updatePinCoordinates]);

  // Render Statewide Highway Network (NH 44, NH 544, NH 45, ECR, Ghat)
  useEffect(() => {
    const group = edgesLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showHighwayNetwork) return;

    const nodeCoordMap = new Map<string, [number, number]>();
    nodes.forEach(n => nodeCoordMap.set(n.id, [n.lat, n.lng]));

    edges.forEach(edge => {
      const p1 = nodeCoordMap.get(edge.source);
      const p2 = nodeCoordMap.get(edge.target);
      if (!p1 || !p2) return;

      let color = "#0284c7"; // Sky Blue
      if (edge.highwayCode === "NH 44") {
        color = "#1d4ed8"; // Royal Blue Golden Corridor
      } else if (edge.highwayCode === "NH 544") {
        color = "#d97706"; // Amber West Corridor
      } else if (edge.highwayCode === "NH 45 (GST Road)") {
        color = "#059669"; // Emerald Central Spine
      } else if (edge.isGhatRoad) {
        color = "#9333ea"; // Purple Mountain Ghat
      } else if (edge.isCoastalProneToFlooding) {
        color = "#0891b2"; // Cyan Coastal
      }

      // Highway shadow casing for high contrast on Google Maps street view
      const casing = L.polyline([p1, p2], {
        color: "#0f172a",
        weight: edge.lanes >= 6 ? 5 : edge.lanes >= 4 ? 4 : 3,
        opacity: 0.5,
        pane: "highwaysPane"
      });
      group.addLayer(casing);

      const poly = L.polyline([p1, p2], {
        color,
        weight: edge.lanes >= 6 ? 3.5 : edge.lanes >= 4 ? 2.5 : 1.8,
        opacity: 0.85,
        dashArray: edge.isGhatRoad ? "4, 4" : undefined,
        pane: "highwaysPane"
      });

      poly.on("click", () => {
        setInspectedEdge(edge);
      });

      poly.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="font-bold text-xs text-white">${isTamil ? edge.nameTamil : edge.name}</div>
          <div class="text-[11px] text-amber-400 font-semibold">${edge.highwayCode} • ${edge.lanes} Lanes • ${edge.distanceKm} km</div>
          <div class="text-[10px] text-slate-300">Gradient: ${edge.maxGradientPercent}% • Rest Stops: ${edge.hasUniversalHighwayRestStops ? "Yes (Universal)" : "Limited"}</div>
          <div class="text-[9px] text-sky-400 font-bold mt-1">Click to view Highway Corridor Accessibility Audit</div>
        </div>`,
        { sticky: true }
      );

      group.addLayer(poly);
    });
  }, [nodes, edges, showHighwayNetwork, isTamil, setInspectedEdge]);

  // Render Baseline Standard Freight Route with high contrast casing
  useEffect(() => {
    const group = baselineRouteLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showBaselineRoute || !standardBaselineRoute || standardBaselineRoute.coordinates.length < 2) return;

    // Dark casing for baseline route
    const casing = L.polyline(standardBaselineRoute.coordinates, {
      color: "#0f172a",
      weight: 6,
      opacity: 0.75,
      lineCap: "round",
      pane: "routesPane"
    });
    group.addLayer(casing);

    const poly = L.polyline(standardBaselineRoute.coordinates, {
      color: "#f8fafc",
      weight: 3.5,
      opacity: 0.95,
      dashArray: "6, 8",
      lineCap: "round",
      pane: "routesPane"
    });

    poly.bindTooltip(
      `<div class="p-1 font-sans">
        <div class="font-bold text-xs text-slate-200">Standard Heavy Commercial Path</div>
        <div class="text-[10px] text-slate-300">${standardBaselineRoute.totalDistanceKm} km • ${standardBaselineRoute.totalTimeHours}h • Accessibility: ${standardBaselineRoute.accessibilityScore}/100</div>
      </div>`,
      { sticky: true }
    );

    group.addLayer(poly);
  }, [standardBaselineRoute, showBaselineRoute]);

  // Render Current AI-Optimized Corridor SNAPPED TO REAL HIGHWAYS & REAL ROAD ALTERNATIVES
  useEffect(() => {
    const group = currentRouteLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!currentRoute || currentRoute.coordinates.length < 2) return;

    // 1. Render Alternative Real Routes from Routing API (visibly secondary & clickable)
    if (realRoadRoutes && realRoadRoutes.length > 1) {
      realRoadRoutes.forEach((altRoute, altIdx) => {
        if (altIdx === selectedRealRouteIndex) return; // skip active route
        if (!altRoute.coordinates || altRoute.coordinates.length < 2) return;

        const altPoly = L.polyline(altRoute.coordinates, {
          color: "#38bdf8",
          weight: 4,
          opacity: 0.65,
          dashArray: "6, 8",
          pane: "routesPane"
        });

        altPoly.bindTooltip(
          `<div class="p-1 font-sans">
            <div class="font-bold text-xs text-sky-300">${altRoute.title}</div>
            <div class="text-[11px] text-white">${altRoute.distanceKm} km • ${altRoute.durationFormatted}</div>
            <div class="text-[10px] text-amber-300 font-semibold mt-0.5">Click to switch to this route</div>
          </div>`,
          { sticky: true }
        );

        altPoly.on("click", () => {
          setSelectedRealRouteIndex(altIdx);
        });

        group.addLayer(altPoly);
      });
    }

    // 2. Use real road geometry for active route (from realRoadRoutes or OSRM/Google API)
    const activeRealRoute = realRoadRoutes && realRoadRoutes[selectedRealRouteIndex];
    const hasRealRoadData = Boolean(activeRealRoute && activeRealRoute.coordinates && activeRealRoute.coordinates.length > 1);

    const roadCoordinates = hasRealRoadData
      ? activeRealRoute!.coordinates
      : (navigationRouteData &&
         navigationRouteData.realRoadCoordinates &&
         navigationRouteData.realRoadCoordinates.length > 1
          ? navigationRouteData.realRoadCoordinates
          : currentRoute.coordinates);

    const isEmergency = currentRoute.profile === "medical_emergency";
    const routeColor = isEmergency ? "#e11d48" : "#d97706";
    const haloColor = isEmergency ? "#f43f5e" : "#f59e0b";

    // A. Solid deep navy/dark casing for high contrast on Google Maps light background
    const casingPoly = L.polyline(roadCoordinates, {
      color: "#020617",
      weight: 10,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
      pane: "routesPane"
    });
    group.addLayer(casingPoly);

    // B. Luminous halo
    const haloPoly = L.polyline(roadCoordinates, {
      color: haloColor,
      weight: 14,
      opacity: 0.35,
      lineCap: "round",
      pane: "routesPane"
    });
    group.addLayer(haloPoly);

    // C. Sharp high-contrast central polyline
    const mainPoly = L.polyline(roadCoordinates, {
      color: routeColor,
      weight: 5,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      pane: "routesPane"
    });

    const routeDistance = activeRealRoute?.distanceKm || navigationRouteData?.totalDistanceKm || currentRoute.totalDistanceKm;
    const routeDuration = activeRealRoute?.durationFormatted || navigationRouteData?.totalDurationFormatted || `${currentRoute.totalTimeHours} hrs`;
    const routeTitle = activeRealRoute?.title || (isTamil ? "தேர்ந்தெடுக்கப்பட்ட உகந்த நெடுஞ்சாலை" : "Active Highway Corridor");

    mainPoly.bindTooltip(
      `<div class="p-1 font-sans">
        <div class="font-bold text-xs text-amber-300">${routeTitle}</div>
        <div class="text-[11px] text-white font-mono mt-0.5">${routeDistance} km • ETA: ${routeDuration}</div>
        <div class="text-[10px] text-emerald-400 mt-0.5">
          ${hasRealRoadData ? '🛣️ Real Road Network Route' : `Accessibility Score: ${currentRoute.accessibilityScore}/100`}
        </div>
      </div>`,
      { sticky: true }
    );

    group.addLayer(mainPoly);

    // 3. Automatically fit map bounds to the selected real road route (Requirement #9)
    if (mapInstanceRef.current && roadCoordinates && roadCoordinates.length > 1) {
      try {
        const bounds = L.latLngBounds(roadCoordinates.map(c => [c[0], c[1]]));
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13
        });
      } catch (err) {
        console.warn("Could not fit map bounds:", err);
      }
    }
  }, [currentRoute, navigationRouteData, isTamil, realRoadRoutes, selectedRealRouteIndex, setSelectedRealRouteIndex]);

  // Render AI Copilot Highlighted Waypoints & Corridor
  useEffect(() => {
    const group = copilotRouteLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!copilotHighlightedRoute || !copilotHighlightedRoute.waypoints || copilotHighlightedRoute.waypoints.length < 2) {
      return;
    }

    // If real road routes are already active and copilot waypoints are coarse (< 10), skip to avoid straight cuts
    if (copilotHighlightedRoute.waypoints.length < 10 && realRoadRoutes && realRoadRoutes.length > 0) {
      return;
    }

    const waypoints = copilotHighlightedRoute.waypoints;
    const title = copilotHighlightedRoute.title || (isTamil ? 'AI Copilot பரிந்துரைத்த வழித்தடம்' : 'AI Copilot Route Corridor');

    // Outer luminous glow
    const glowLine = L.polyline(waypoints, {
      color: '#f59e0b',
      weight: 10,
      opacity: 0.55,
      lineCap: 'round',
      lineJoin: 'round',
      pane: 'routesPane'
    });

    // Inner distinct route line
    const coreLine = L.polyline(waypoints, {
      color: '#fbbf24',
      weight: 5,
      opacity: 0.95,
      dashArray: '10, 8',
      pane: 'routesPane'
    });

    // Start marker
    const startPt = waypoints[0];
    const startMarker = L.circleMarker([startPt[0], startPt[1]], {
      radius: 7,
      color: '#ffffff',
      fillColor: '#10b981',
      fillOpacity: 1,
      weight: 2.5,
      pane: 'markersPane'
    }).bindTooltip(`<b>Start:</b> ${copilotHighlightedRoute.origin || 'Origin'}`, { permanent: false });

    // End marker
    const endPt = waypoints[waypoints.length - 1];
    const endMarker = L.circleMarker([endPt[0], endPt[1]], {
      radius: 7,
      color: '#ffffff',
      fillColor: '#ef4444',
      fillOpacity: 1,
      weight: 2.5,
      pane: 'markersPane'
    }).bindTooltip(`<b>Destination:</b> ${copilotHighlightedRoute.destination || 'Destination'}`, { permanent: false });

    coreLine.bindTooltip(
      `<div class="p-1.5 font-sans">
        <div class="font-bold text-xs text-amber-300">📍 ${title}</div>
        <div class="text-[11px] text-white mt-0.5">OPENROUTE AI Copilot Active Visualization</div>
        <div class="text-[10px] text-emerald-400 mt-0.5">Route automatically highlighted on State Map</div>
      </div>`,
      { sticky: true }
    );

    group.addLayer(glowLine);
    group.addLayer(coreLine);
    group.addLayer(startMarker);
    group.addLayer(endMarker);

    // Zoom and fly map smoothly to route bounds
    if (mapInstanceRef.current) {
      try {
        const bounds = L.latLngBounds(waypoints);
        mapInstanceRef.current.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 12,
          duration: 1.2
        });
      } catch (err) {
        console.warn('Could not fly to copilot route bounds:', err);
      }
    }
  }, [copilotHighlightedRoute, isTamil]);


  // Render Step Highlight (Turns / Segments) on Map
  useEffect(() => {
    const group = stepHighlightLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!navigationRouteData || !navigationRouteData.steps || navigationRouteData.steps.length === 0) return;

    const activeStep = navigationRouteData.steps[activeStepIndex];
    if (!activeStep || !activeStep.location || (activeStep.location[0] === 0 && activeStep.location[1] === 0)) return;

    // Highlight turn maneuver pin
    const turnIcon = L.divIcon({
      className: "active-step-turn-marker",
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping"></div>
          <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-slate-900 shadow-2xl flex items-center justify-center text-white text-[11px] font-black">
            ${activeStep.stepIndex}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const turnMarker = L.marker([activeStep.location[0], activeStep.location[1]], {
      icon: turnIcon,
      pane: "markersPane"
    });

    turnMarker.bindTooltip(
      `<div class="p-1 font-sans">
        <div class="font-bold text-xs text-emerald-400 flex items-center gap-1">
          <span>Step ${activeStep.stepIndex}: ${activeStep.maneuverType.toUpperCase()}</span>
        </div>
        <div class="text-xs text-white font-bold mt-0.5">${isTamil ? activeStep.instructionTamil : activeStep.instruction}</div>
        <div class="text-[10px] text-slate-300 mt-0.5">${activeStep.distanceFormatted} • ${activeStep.roadName}</div>
      </div>`,
      { permanent: false, sticky: true }
    );

    group.addLayer(turnMarker);

    // If step has sub-coordinates, highlight that segment in bright emerald
    if (activeStep.stepCoordinates && activeStep.stepCoordinates.length > 1) {
      const stepSegmentCasing = L.polyline(activeStep.stepCoordinates, {
        color: "#064e3b",
        weight: 10,
        opacity: 0.8,
        pane: "routesPane"
      });
      group.addLayer(stepSegmentCasing);

      const stepSegment = L.polyline(activeStep.stepCoordinates, {
        color: "#10b981",
        weight: 6,
        opacity: 1,
        lineCap: "round",
        pane: "routesPane"
      });
      group.addLayer(stepSegment);
    }
  }, [navigationRouteData, activeStepIndex, isTamil]);

  // Render 20 Statewide Nodes & Hubs with high contrast markers
  useEffect(() => {
    const group = nodesLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    nodes.forEach(node => {
      // Don't render custom_pin_node here as it is rendered with dedicated controls in customPinLayerGroup
      if (node.id === "custom_pin_node") return;

      const isOrigin = node.id === originId;
      const isDestination = node.id === destinationId;

      let markerHtml = "";
      let iconSize: [number, number] = [20, 20];

      if (isOrigin) {
        iconSize = [34, 34];
        markerHtml = `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute inset-0 rounded-full bg-amber-500/50 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white ring-2 ring-slate-900 flex items-center justify-center text-slate-950 font-black shadow-2xl text-xs">
              A
            </div>
          </div>
        `;
      } else if (isDestination) {
        iconSize = [34, 34];
        markerHtml = `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute inset-0 rounded-full bg-emerald-500/50 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-slate-900 flex items-center justify-center text-white font-black shadow-2xl text-xs">
              B
            </div>
          </div>
        `;
      } else {
        const catColor = 
          node.category === "metro_hub" ? "bg-amber-500" :
          node.category === "port_hub" ? "bg-cyan-500" :
          node.category === "industrial_cluster" ? "bg-orange-500" :
          node.category === "medical_gateway" ? "bg-rose-500" :
          node.category === "ghat_node" ? "bg-purple-600" :
          node.category === "agrarian_hub" ? "bg-emerald-600" : "bg-blue-600";

        const isGhat = node.category === "ghat_node";

        markerHtml = `
          <div class="relative flex items-center justify-center w-5 h-5">
            ${isGhat ? '<div class="absolute inset-0 rounded-full bg-purple-500/50 animate-pulse"></div>' : ""}
            <div class="w-4 h-4 rounded-full ${catColor} border-2 border-white shadow-xl ring-2 ring-slate-900/60 transition-transform hover:scale-150"></div>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: "custom-tn-node",
        html: markerHtml,
        iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2]
      });

      const marker = L.marker([node.lat, node.lng], { icon, pane: "markersPane" });

      marker.on("click", () => {
        setInspectedNode(node);
      });

      marker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="font-bold text-xs text-white">${isTamil ? node.nameTamil : node.name}</div>
          <div class="text-[11px] text-amber-400 font-semibold">${node.district} District • Elev: ${node.elevationMeters}m</div>
          <div class="text-[10px] text-slate-300">Accessibility: <span class="font-bold text-emerald-400">${node.accessibilityScore}/100</span> | Buggy: ${node.batteryBuggyService ? "Available" : "None"}</div>
          ${node.elevationMeters > 1000 ? '<div class="text-[10px] text-rose-400 font-bold mt-0.5">⚠️ High Altitude Ghat Node (2,240m)</div>' : ""}
          <div class="mt-1 text-[9px] text-blue-400 font-bold">Click for Full 6-Point Audit Report</div>
        </div>`,
        { sticky: true }
      );

      group.addLayer(marker);
    });
  }, [nodes, originId, destinationId, isTamil, setInspectedNode]);

  // Render Dynamic Incidents
  useEffect(() => {
    const group = hazardsLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    hazards.forEach(hazard => {
      if (hazard.resolved) return;

      const iconEmoji = 
        hazard.type === "monsoon_flooding" ? "🌊" :
        hazard.type === "toll_congestion" ? "🚛" :
        hazard.type === "ghat_landslide" ? "⛰️" : "⚠️";

      const hazardHtml = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 rounded-full bg-rose-500/50 animate-hazard"></div>
          <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white ring-2 ring-slate-900 flex items-center justify-center text-sm shadow-xl cursor-pointer">
            ${iconEmoji}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "custom-hazard",
        html: hazardHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([hazard.lat, hazard.lng], { icon, pane: "markersPane" });

      const popupDiv = document.createElement("div");
      popupDiv.className = "font-sans p-1 text-slate-200";
      popupDiv.innerHTML = `
        <div class="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase mb-1">
          <span>⚠️</span>
          <span>${isTamil ? hazard.titleTamil : hazard.title}</span>
        </div>
        <p class="text-xs text-slate-300 mb-2 leading-tight">${hazard.description}</p>
        <div class="text-[10px] text-slate-400 mb-2">Reroute Delay Multiplier: <span class="text-rose-400 font-bold">${hazard.delayMultiplier}x</span></div>
      `;

      const resolveBtn = document.createElement("button");
      resolveBtn.className = "w-full py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors";
      resolveBtn.innerHTML = `<span>Clear Incident & Reopen Corridor</span>`;
      resolveBtn.onclick = () => {
        resolveHazard(hazard.id);
        marker.closePopup();
      };
      popupDiv.appendChild(resolveBtn);

      marker.bindPopup(popupDiv);
      group.addLayer(marker);
    });
  }, [hazards, isTamil, resolveHazard]);

  // Render State Fleet Vehicles
  useEffect(() => {
    const group = fleetLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showFleet) return;

    fleet.forEach(v => {
      const vEmoji = v.type === "electric_semi" ? "⚡" : v.type === "heavy_container_hauler" ? "🚛" : v.type === "reefer_coldchain" ? "❄️" : "🚑";

      const html = `
        <div class="relative flex items-center justify-center w-7 h-7">
          <div class="w-6 h-6 rounded-lg bg-slate-900 border border-amber-400 ring-1 ring-white/60 flex items-center justify-center text-xs shadow-xl">
            ${vEmoji}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "fleet-marker",
        html,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([v.currentLat, v.currentLng], { icon, pane: "markersPane" });

      marker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="font-bold text-xs text-white">${v.code} - ${v.name}</div>
          <div class="text-[10px] text-amber-400">Cargo: ${v.currentCargo || "Available for Dispatch"}</div>
          <div class="text-[10px] text-slate-300">Battery/Fuel: ${v.batteryOrFuelPct}% • Driver: ${v.driverName}</div>
        </div>`,
        { sticky: true }
      );

      group.addLayer(marker);
    });
  }, [fleet, showFleet]);

  // Is custom pin involved in the active corridor?
  const isPinInActiveRoute = originId === "custom_pin_node" || destinationId === "custom_pin_node";
  const isPinOrigin = originId === "custom_pin_node";
  const isPinDestination = destinationId === "custom_pin_node";

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" id="tn-map-viewport" />

      {/* Target Hazard Dropping Banner */}
      {mapClickMode === "spawn_hazard" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-rose-600/90 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-rose-400/50 animate-bounce-gentle">
          <Crosshair className="w-4 h-4 animate-spin" />
          <span className="text-xs font-bold">
            {isTamil ? "வரைபடத்தில் கிளிக் செய்து சாலையடைப்பு அல்லது வெள்ளத்தை ஏற்படுத்துக" : "Target Mode Active: Click anywhere on Tamil Nadu map to drop a disruption"}
          </span>
          <button
            onClick={() => setMapClickMode("default")}
            className="ml-2 text-xs bg-rose-800 hover:bg-rose-900 px-2 py-0.5 rounded-full"
          >
            Cancel
          </button>
        </div>
      )}

      {/* GOOGLE MAPS IN-DRIVE NAVIGATION HUD BANNER (Top-Center) */}
      <NavigationHud />

      {/* GOOGLE MAPS STEP-BY-STEP DIRECTIONS SIDE DRAWER */}
      <NavigationDrawer />

      {/* FLOATING REAL-TIME LOCATION & MANUAL PIN WIDGET (Bottom-Left) */}
      <div className="absolute bottom-16 left-4 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-3 text-xs text-slate-200 transition-all">
          {/* Widget Header & Mode Toggles */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>{isTamil ? "நேரலை இருப்பிடம் & பின்" : "Live GPS & Location Pin"}</span>
                  {locationMode === "live_gps" && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  )}
                  {locationMode === "manual_pin" && (
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                  )}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isWidgetCollapsed ? "Expand Location Control" : "Collapse"}
            >
              {isWidgetCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!isWidgetCollapsed && (
            <div className="flex flex-col gap-2.5">
              {/* Mode Selector Pill Buttons */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  onClick={startLiveGps}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    locationMode === "live_gps"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-blue-300" />
                  <span>{isTamil ? "நேரலை ஜிபிஎஸ்" : "Live GPS"}</span>
                </button>

                <button
                  onClick={activateManualPin}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    locationMode === "manual_pin"
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-violet-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <LocateFixed className="w-3.5 h-3.5 text-violet-300" />
                  <span>{isTamil ? "கைமுறை பின்" : "Manual Pin"}</span>
                </button>
              </div>

              {/* GPS Error Alert */}
              {gpsError && locationMode === "live_gps" && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="leading-tight">{gpsError}</span>
                  </div>
                  <button
                    onClick={activateManualPin}
                    className="underline text-rose-200 font-bold whitespace-nowrap hover:text-white"
                  >
                    Use Pin
                  </button>
                </div>
              )}

              {/* Coordinate & Location Feedback Card */}
              {customLocation && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">{isTamil ? "ஒருங்கிணைப்புகள்:" : "Coordinates:"}</span>
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {customLocation.lat.toFixed(4)}°N, {customLocation.lng.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="border-t border-slate-900 pt-1.5">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                      {isTamil ? "அருகிலுள்ள சரக்கு மையம்:" : "Nearest Logistics Hub:"}
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="truncate">{isTamil ? customLocation.nearestHubNameTamil : customLocation.nearestHubName}</span>
                      <span className="text-emerald-400 whitespace-nowrap ml-2 text-[11px] font-extrabold">
                        {customLocation.distanceToHubKm} km
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{customLocation.nearestHubDistrict} District</span>
                      <span className="text-violet-400 font-medium">~{Math.max(2, Math.round(customLocation.distanceToHubKm / 0.8))} mins feeder</span>
                    </div>
                  </div>

                  {/* Mode-specific status tip */}
                  <div className="text-[10px] pt-1 border-t border-slate-900 flex items-center gap-1.5 text-slate-400">
                    {locationMode === "live_gps" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="text-emerald-400 font-semibold">
                          {isTamil ? "நேரலை ஜிபிஎஸ் இயங்குகிறது" : "Live Tracking Active"} 
                          {customLocation.accuracyMeters ? ` (±${customLocation.accuracyMeters}m)` : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                        <span className="text-violet-300">
                          {isTamil ? "வரைபடத்தில் கிளிக் செய்து அல்லது பின்னை இழுத்து மாற்றவும்" : "Click map or drag pin to relocate"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ROUTE INTEGRATION ACTIONS */}
              {customLocation && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isTamil ? "வழித்தட ஒருங்கிணைப்பு:" : "Corridor Route Action:"}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={setCustomAsOrigin}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all border ${
                        isPinOrigin
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                          : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-amber-500/50"
                      }`}
                      title="Set this pin location as Route Origin"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 flex items-center justify-center text-[10px] font-black">A</span>
                      <span>{isPinOrigin ? (isTamil ? "தொடக்க இடம் (A)" : "Origin Active") : (isTamil ? "தொடக்கமாக வை" : "Set Origin (A)")}</span>
                    </button>

                    <button
                      onClick={setCustomAsDestination}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all border ${
                        isPinDestination
                          ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                          : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700 hover:border-emerald-500/50"
                      }`}
                      title="Set this pin location as Route Destination"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 flex items-center justify-center text-[10px] font-black">B</span>
                      <span>{isPinDestination ? (isTamil ? "இலக்கு இடம் (B)" : "Dest Active") : (isTamil ? "இலக்காக வை" : "Set Dest (B)")}</span>
                    </button>
                  </div>

                  {/* Route Direct to Nearest Hub Button */}
                  <button
                    onClick={routeCustomToNearestHub}
                    className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-700/25 flex items-center justify-center gap-1.5 border border-violet-400/40 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isTamil ? "அருகிலுள்ள மையத்திற்கு வழி காண்க" : "Route to Nearest Hub & Calculate ETA"}</span>
                  </button>

                  {/* Active Route Summary when Pin is Routed */}
                  {isPinInActiveRoute && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-300">
                        <span>{isPinOrigin ? "Pin ➔ Destination Corridor" : "Origin ➔ Pin Corridor"}</span>
                        <span className="text-emerald-400 font-extrabold">
                          ETA: {navigationRouteData?.totalDurationFormatted || `${currentRoute.totalTimeHours}h`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Distance: {navigationRouteData?.totalDistanceKm || currentRoute.totalDistanceKm} km</span>
                        <span>Accessibility: {currentRoute.accessibilityScore}/100</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Highway Overlays, Directions & Layers Control (Top-Right) */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* Step-by-Step Directions Button */}
          <button
            onClick={() => setIsNavigationDrawerOpen(!isNavigationDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold transition-all ${
              isNavigationDrawerOpen
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
                : "bg-slate-900/90 text-slate-200 border-slate-700 hover:text-white hover:border-emerald-500 hover:bg-slate-800"
            }`}
            title="Open Step-by-Step Directions Side Drawer"
          >
            <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isTamil ? "வழிகாட்டல்" : "Directions"}</span>
            {navigationRouteData?.steps && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-emerald-300 font-bold">
                {navigationRouteData.steps.length}
              </span>
            )}
          </button>

          {/* Live Weather Button */}
          <button
            onClick={() => setIsWeatherModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold bg-slate-900/90 text-slate-200 border-slate-700 hover:text-white hover:border-amber-400 hover:bg-slate-800 transition-all group"
            title={isTamil ? "நேரலை வானிலை விவரங்கள்" : "View Live Corridor Weather"}
          >
            <CloudSun className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>
              {corridorWeather 
                ? `${corridorWeather.originWeather.temperature}°C` 
                : (isTamil ? "வானிலை" : "Weather")}
            </span>
            {corridorWeather && (
              <span className={`w-2 h-2 rounded-full ${corridorWeather.hasRainAlongRoute ? 'bg-sky-400 animate-ping' : 'bg-emerald-400'}`}></span>
            )}
          </button>

          {/* Quick Center Tamil Nadu Button */}
          <button
            onClick={centerTamilNadu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold bg-slate-900/90 text-slate-200 border-slate-700 hover:text-white hover:border-amber-500 hover:bg-slate-800 transition-all"
            title="Center and frame Tamil Nadu"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>{isTamil ? "தமிழ்நாடு மையம்" : "Center TN"}</span>
          </button>

          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold transition-all ${
              showLayerMenu 
                ? "bg-amber-600 text-white border-amber-500 shadow-amber-500/20" 
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
            }`}
            title="Toggle Map Layers & Basemap Styles"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{isTamil ? "வரைபட அடுக்குகள்" : "Layers & Theme"}</span>
          </button>
        </div>

        {showLayerMenu && (
          <div className="w-68 bg-slate-900/95 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800 pb-1.5">
              <span>{isTamil ? "வரைபட அடுக்குகள்" : "Map Layers"}</span>
              <button 
                onClick={() => setShowLayerMenu(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* MAP LAYERS (Requirement #9) */}
            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHighwayNetwork}
                onChange={(e) => setShowHighwayNetwork(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span className="font-semibold text-amber-400">☑ Freight Corridors (NH 44/544/45)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBaselineRoute}
                onChange={(e) => setShowBaselineRoute(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>☑ Logistics Nodes & Hubs</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAccessibilityBlackspots}
                onChange={(e) => setShowAccessibilityBlackspots(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
              />
              <span>☐ Accessibility Blackspots (6 Hotspots)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCongestionPrediction}
                onChange={(e) => setShowCongestionPrediction(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
              />
              <span>☐ Predicted Congestion (30-min forecast)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInfrastructurePriority}
                onChange={(e) => setShowInfrastructurePriority(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>☐ Infrastructure Priority Districts</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAiRecommendedCorridors}
                onChange={(e) => setShowAiRecommendedCorridors(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span>☐ AI Recommended Bypass Corridors</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showFleet}
                onChange={(e) => setShowFleet(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>{isTamil ? "செயலில் உள்ள சரக்கு வாகனங்கள்" : "Active Fleet"}</span>
            </label>

            {/* Basemap Style Selector */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold mb-1">
                {isTamil ? "அடிப்படை வரைபடம் (Basemap):" : "Basemap Theme:"}
              </div>
              <select
                value={basemapStyle}
                onChange={(e) => setBasemapStyle(e.target.value as typeof basemapStyle)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-400 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="google_streets">Google Maps Street View (Default)</option>
                <option value="google_hybrid">Google Maps Hybrid (Satellite + Roads)</option>
                <option value="google_terrain">Google Maps Terrain</option>
                <option value="google_satellite">Google Maps Satellite Only</option>
                <option value="osm">OpenStreetMap Standard</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md hidden sm:flex items-center gap-4 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-slate-950 shadow-sm shadow-amber-400"></span>
          <span>{isTamil ? "உகந்த வழித்தடம்" : "AI Optimal Corridor"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1.5 rounded-full border-t-2 border-dashed border-slate-300"></span>
          <span>Standard Freight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white"></span>
          <span>Ghat Terrain (&gt;9%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white"></span>
          <span>State Incident</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 border border-white"></span>
          <span>Manual Pin / GPS</span>
        </div>
      </div>
    </div>
  );
};
