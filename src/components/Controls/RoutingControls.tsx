import React, { useState } from 'react';
import { 
  Sliders, 
  ArrowUpDown, 
  MapPin, 
  Navigation, 
  Leaf, 
  Accessibility, 
  HeartPulse, 
  Truck, 
  Sun, 
  CloudRain, 
  Flame, 
  AlertTriangle, 
  RotateCcw, 
  Clock, 
  Crosshair,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldAlert,
  Car,
  Bus,
  Footprints,
  RotateCw,
  Layers,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TNRouteProfile, TNHazardType, WeatherScenario } from '../../types';

interface RoutingControlsProps {
  isFloating?: boolean;
  onClose?: () => void;
}

export const RoutingControls: React.FC<RoutingControlsProps> = ({ isFloating = false, onClose }) => {
  const {
    language,
    nodes,
    originId,
    destinationId,
    setOriginId,
    setDestinationId,
    swapOriginDestination,
    routeProfile,
    setRouteProfile,
    currentRoute,
    weights,
    setWeight,
    resetWeightsToDefault,
    hourOfDay,
    setHourOfDay,
    weather,
    setWeather,
    spawnHazard,
    mapClickMode,
    setMapClickMode,
    pendingHazardType,
    setPendingHazardType,
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
    triggerWhatIfScenario
  } = useApp();

  const isTamil = language === 'ta';
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [advancedTab, setAdvancedTab] = useState<'weights' | 'disruptions'>('weights');

  const profiles: { 
    id: TNRouteProfile; 
    label: string; 
    labelTamil: string; 
    desc: string; 
    descTamil: string; 
    icon: React.ReactNode; 
    accentColor: string;
  }[] = [
    {
      id: 'freight_express',
      label: 'Industrial Freight',
      labelTamil: 'விரைவு சரக்கு',
      desc: 'NH 44/544 6-lane expressways, minimal toll wait',
      descTamil: 'NH 44/544 அதிவேக சரக்கு வழித்தடம்',
      icon: <Truck className="w-4 h-4" />,
      accentColor: 'border-orange-500 text-orange-400 bg-orange-500/10'
    },
    {
      id: 'green_corridor',
      label: 'Green Corridor',
      labelTamil: 'பசுமை வழித்தடம்',
      desc: 'EV battery efficiency & charging proximity',
      descTamil: 'மின்சார வாகன பேட்டரி & சார்ஜிங் உகப்பாக்கம்',
      icon: <Leaf className="w-4 h-4" />,
      accentColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'accessible_transit',
      label: 'Accessible Transit',
      labelTamil: 'அணுகல் பயணம்',
      desc: 'Wheelchair ramps, lifts & low-gradient paths',
      descTamil: 'சக்கர நாற்காலி சாய்வுதளம் & மின்தூக்கி வசதிகள்',
      icon: <Accessibility className="w-4 h-4" />,
      accentColor: 'border-sky-500 text-sky-400 bg-sky-500/10'
    },
    {
      id: 'medical_emergency',
      label: 'Medical Corridor',
      labelTamil: 'அவசர மருத்துவம்',
      desc: 'Tertiary hospitals, avoids ghats & floods',
      descTamil: 'மருத்துவமனை நேரடி வழி & மலைப்பாதை தவிர்ப்பு',
      icon: <HeartPulse className="w-4 h-4" />,
      accentColor: 'border-rose-500 text-rose-400 bg-rose-500/10'
    }
  ];

  const quickRoutes = [
    { name: 'Coimbatore ➔ Chennai', from: 'coimbatore_hub', to: 'chennai_metro' },
    { name: 'Chennai ➔ Hosur', from: 'chennai_metro', to: 'hosur_hub' },
    { name: 'Coimbatore ➔ Tuticorin', from: 'coimbatore_hub', to: 'thoothukudi_port' },
    { name: 'Madurai ➔ Ooty', from: 'madurai_junction', to: 'nilgiris_ooty' },
    { name: 'Cuddalore ➔ Trichy', from: 'cuddalore_coastal', to: 'trichy_hub' }
  ];


  const handleQuickSpawn = (type: TNHazardType) => {
    let lat = 11.5;
    let lng = 78.5;
    let title = '';

    if (type === 'monsoon_flooding') {
      lat = 11.7480;
      lng = 79.7714;
      title = 'Coastal Surge Flooding (ECR Inundation)';
    } else if (type === 'toll_congestion') {
      lat = 12.7215;
      lng = 79.9850;
      title = 'Paranur Toll Plaza FASTag Backlog';
    } else if (type === 'ghat_landslide') {
      lat = 11.3530;
      lng = 76.7950;
      title = 'Coonoor Ghat Rockfall Suspension';
    } else {
      lat = 10.7905;
      lng = 78.7047;
      title = 'Trichy Terminal Lift Maintenance';
    }

    spawnHazard(type, lat, lng, title);
  };

  return (
    <div className={`flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
      isFloating 
        ? 'w-full sm:w-[400px] max-h-[calc(100vh-6rem)] overflow-y-auto' 
        : 'w-full lg:w-96 flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-r'
    }`}>
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-white tracking-wide">
              {isTamil ? 'தமிழ்நாடு வழித்தட திட்டம்' : 'State Corridor Planner'}
            </h2>
            <p className="text-[10px] text-slate-400">
              {isTamil ? '38 மாவட்டங்களுக்கான ஸ்மார்ட் பயணம்' : 'AI-Optimized Multi-Criteria Routing'}
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Minimize Planner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Quick Corridor Presets Chips */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            {isTamil ? 'பிரபல வழித்தடங்கள்:' : 'Popular Corridors:'}
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {quickRoutes.map((qr) => (
              <button
                key={qr.name}
                onClick={() => {
                  setOriginId(qr.from);
                  setDestinationId(qr.to);
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  originId === qr.from && destinationId === qr.to
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {qr.name}
              </button>
            ))}
          </div>
        </div>

        {/* Origin & Destination Selectors */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2.5 relative">
          {/* Origin */}
          <div>
            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {isTamil ? 'தொடக்க இடம் (Origin):' : 'Starting From (Origin):'}
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {nodes.map(n => (
                <option key={`origin_${n.id}`} value={n.id}>
                  {isTamil ? n.nameTamil : n.name} ({n.district})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={swapOriginDestination}
              className="p-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500 transition-all shadow-md"
              title="Swap Origin & Destination"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div>
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {isTamil ? 'சென்றடையும் இடம் (Destination):' : 'Destination:'}
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {nodes.map(n => (
                <option key={`dest_${n.id}`} value={n.id}>
                  {isTamil ? n.nameTamil : n.name} ({n.district})
                </option>
              ))}
            </select>
          </div>

          {/* Calculate Real Road Route Button */}
          <button
            onClick={() => calculateRealRoadRoute()}
            disabled={isRealRoadLoading}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-[0.98] disabled:opacity-60 border border-amber-400/40"
          >
            {isRealRoadLoading ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-200" />
                <span>{isTamil ? 'சாலை வழித்தடம் கணக்கிடப்படுகிறது...' : 'Calculating Real Road Route...'}</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-white transform -rotate-45" />
                <span>{isTamil ? 'உண்மையான சாலை வழித்தடம் காண்க' : 'Calculate Real Road Route'}</span>
              </>
            )}
          </button>

          {/* Routing Provider & Live Traffic Status Badge */}
          <div className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-semibold text-amber-400">Provider:</span>
              <span className="truncate max-w-[170px] text-slate-300">{routingProviderConfig.providerLabel}</span>
            </div>
            {activeRealRoute?.trafficStatus === 'live_available' ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE TRAFFIC
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] border border-slate-700" title="Traffic-aware routing active when Google Routes API key is set in .env">
                Traffic data unavailable
              </span>
            )}
          </div>

          {/* Real road routing error message if any */}
          {realRoadError && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{realRoadError}</span>
            </div>
          )}
        </div>


        {/* Step 2: Routing Profile Selection */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            {isTamil ? 'பயண முறை & முன்னுரிமை:' : 'Routing Priority & Mode:'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map((p) => {
              const isSelected = routeProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setRouteProfile(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${p.accentColor} shadow-md ring-1 ring-amber-500/30 font-bold`
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {p.icon}
                    <span className="text-xs font-bold leading-tight">
                      {isTamil ? p.labelTamil : p.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                    {isTamil ? p.descTamil : p.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Route Quick Metrics */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 rounded-xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {isTamil ? 'உகந்த கணக்கீடு முடிவு' : 'Computed Route Stats'}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Optimal
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400">{isTamil ? 'நேரம்' : 'ETA'}</div>
              <div className="text-xs font-extrabold text-amber-400 font-mono mt-0.5">
                {currentRoute.totalTimeHours}h
              </div>
            </div>

            <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400">{isTamil ? 'தூரம்' : 'Dist'}</div>
              <div className="text-xs font-extrabold text-sky-400 font-mono mt-0.5">
                {currentRoute.totalDistanceKm}km
              </div>
            </div>

            <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400">{isTamil ? 'அணுகல்' : 'Access'}</div>
              <div className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5">
                {currentRoute.accessibilityScore}%
              </div>
            </div>

            <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
              <div className="text-[9px] text-slate-400">{isTamil ? 'CO₂ சேமிப்பு' : 'CO₂ Save'}</div>
              <div className="text-xs font-extrabold text-teal-400 font-mono mt-0.5">
                {currentRoute.carbonSavedVsStandardKg}kg
              </div>
            </div>
          </div>
        </div>

        {/* 🛣️ MULTIPLE REAL ROUTES FROM ROUTING API (Requirement #4) */}
        {realRoadRoutes.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1 text-sky-400">
                <Layers className="w-3.5 h-3.5" />
                {isTamil ? 'உண்மையான மாற்று வழித்தடங்கள் (API):' : 'REAL ROAD ALTERNATIVES (ROUTING API):'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">{realRoadRoutes.length} Real Routes</span>
            </label>
            <div className="space-y-1.5">
              {realRoadRoutes.map((rt, idx) => {
                const isSelected = idx === selectedRealRouteIndex;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedRealRouteIndex(idx)}
                    className={`w-full p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                          {isTamil ? rt.titleTamil : rt.title}
                        </span>
                      </div>
                      {rt.isFastest && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Fastest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1.5 font-mono">
                      <span className="text-sky-400 font-bold">{rt.distanceKm} km</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-400 font-bold">{rt.durationFormatted}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px] font-sans">
                        {rt.primaryHighways.slice(0, 2).join(', ')}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="italic">{rt.trafficMessage}</span>
                      <span className={`font-semibold ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                        {isSelected ? '✓ Active on Map' : 'Click to select'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 🤖 CONNECTED AI DECISION LAYER & RECOMMENDATION (Requirement #5) */}
        {aiRouteRecommendation && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 space-y-2 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTamil ? 'AI வழித்தட பரிந்துரை' : 'AI RECOMMENDATION'}</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                {isTamil ? aiRouteRecommendation.recommendationTitleTamil : aiRouteRecommendation.recommendationTitle}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                {isTamil ? 'ஏன் இந்த வழித்தடம்?' : 'Why this route?'}
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {(isTamil ? aiRouteRecommendation.whyThisRouteTamil : aiRouteRecommendation.whyThisRoute).map((why, wIdx) => (
                  <li key={wIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{why}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1.5 italic">
              {aiRouteRecommendation.disclaimer}
            </div>
          </div>
        )}

        {/* 🔮 WHAT-IF SCENARIO ANALYSIS (Requirement #8) */}
        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTamil ? 'சூழ்நிலை மாதிரி (What-If)' : 'WHAT-IF SCENARIO SIMULATION'}</span>
            </div>
            {activeWhatIfScenario && (
              <button
                onClick={() => triggerWhatIfScenario(null)}
                className="text-[9px] text-slate-400 hover:text-white underline font-mono"
              >
                Reset
              </button>
            )}
          </div>

          {/* Scenario options buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => triggerWhatIfScenario('salem_blocked')}
              className={`p-1.5 rounded-lg text-left text-[11px] border transition-all ${
                activeWhatIfScenario === 'salem_blocked'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>⚠️ Salem Blocked</span>
            </button>
            <button
              onClick={() => triggerWhatIfScenario('traffic_surge_30')}
              className={`p-1.5 rounded-lg text-left text-[11px] border transition-all ${
                activeWhatIfScenario === 'traffic_surge_30'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>⏱️ Traffic +30%</span>
            </button>
            <button
              onClick={() => triggerWhatIfScenario('monsoon_rain')}
              className={`p-1.5 rounded-lg text-left text-[11px] border transition-all ${
                activeWhatIfScenario === 'monsoon_rain'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>🌧️ Coastal Flood</span>
            </button>
            <button
              onClick={() => triggerWhatIfScenario('medical_critical')}
              className={`p-1.5 rounded-lg text-left text-[11px] border transition-all ${
                activeWhatIfScenario === 'medical_critical'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>🚑 Medical Priority</span>
            </button>
          </div>

          {/* Scenario Result Card */}
          {whatIfResult && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-xs">
                  {isTamil ? whatIfResult.scenarioTitleTamil : whatIfResult.scenarioTitle}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  whatIfResult.isSimulated ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {whatIfResult.isSimulated ? 'SIMULATION' : 'REAL ROAD DETOUR'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950 p-2 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block">Original Route:</span>
                  <span className="font-mono text-slate-300 font-bold">{whatIfResult.originalDistanceKm} km • {whatIfResult.originalDurationFormatted}</span>
                </div>
                <div>
                  <span className="text-amber-400 block">Alternative Route:</span>
                  <span className="font-mono text-amber-300 font-bold">{whatIfResult.alternativeDistanceKm} km • {whatIfResult.alternativeDurationFormatted}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">Dist Diff</div>
                  <div className={`font-mono font-bold ${whatIfResult.distanceDiffKm < 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
                    {whatIfResult.distanceDiffKm > 0 ? `+${whatIfResult.distanceDiffKm}` : whatIfResult.distanceDiffKm} km
                  </div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">ETA Diff</div>
                  <div className={`font-mono font-bold ${whatIfResult.etaDiffMinutes < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {whatIfResult.etaDiffMinutes > 0 ? `+${whatIfResult.etaDiffMinutes}` : whatIfResult.etaDiffMinutes} m
                  </div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">Risk Diff</div>
                  <div className={`font-mono font-bold ${whatIfResult.riskDiffPercent < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {whatIfResult.riskDiffPercent > 0 ? `+${whatIfResult.riskDiffPercent}` : whatIfResult.riskDiffPercent}%
                  </div>
                </div>
              </div>

              <div className="text-slate-300 text-[10px] bg-slate-950/70 p-1.5 rounded border border-slate-800">
                <strong className="text-amber-400 uppercase text-[9px] block">Recommendation:</strong>
                {isTamil ? whatIfResult.recommendationTamil : whatIfResult.recommendation}
              </div>
            </div>
          )}
        </div>

        {/* 🤖 CORRIDOR INTELLIGENCE & ACCESSIBILITY CONNECTION (Requirements #3, #4, #5 & #11) */}

        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTamil ? 'வழித்தட நுண்ணறிவு' : 'CORRIDOR INTELLIGENCE'}</span>
            </div>
            <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">
              DEMO / SIMULATED DATA
            </span>
          </div>

          {/* Corridor metrics grid */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Freight Importance:</span>
              <span className="font-bold text-amber-400 font-mono">94 / 100</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Logistics Efficiency:</span>
              <span className="font-bold text-sky-400 font-mono">88 / 100</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Accessibility Score:</span>
              <span className="font-bold text-emerald-400 font-mono">{currentRoute.accessibilityScore} / 100</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Congestion Risk:</span>
              <span className="font-bold text-rose-400">HIGH</span>
            </div>
          </div>

          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-slate-300">
            <span className="font-bold text-amber-400 text-[10px] uppercase block mb-0.5">AI Recommendation:</span>
            "Prioritize infrastructure improvements and grade separation around this corridor to unlock +14% freight throughput."
          </div>

          {/* 🔮 AI CORRIDOR RISK PREDICTION (Requirement #4) */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-sky-300 uppercase">
              <span className="flex items-center gap-1">
                <span>🔮</span>
                {isTamil ? 'வழித்தட முன்னறிவிப்பு (30-நிமிடம்)' : 'CORRIDOR FORECAST (30-MIN)'}
              </span>
              <span className="text-rose-400 font-mono">+24 min delay</span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800/80">
              <span>Current: <strong className="text-amber-400 font-normal">Risk MEDIUM</strong></span>
              <span className="text-slate-500">➔</span>
              <span>Predicted in 30 min: <strong className="text-rose-400 font-bold">Risk HIGH</strong></span>
            </div>

            <div className="text-[10px] text-slate-400 italic">
              AI Action: "Schedule freight movement outside predicted congestion window or divert via alternate highway."
            </div>
          </div>

          {/* ♿ ACCESSIBILITY + LOGISTICS CONNECTION (Requirement #5) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase">
              <span className="flex items-center gap-1">
                <Accessibility className="w-3 h-3 text-purple-400" />
                Accessibility Blackspots
              </span>
              <span className="text-rose-400 font-mono font-bold">6 Deficits Detected</span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Accessible freight driver rest stop active (NH 544)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Missing accessible pedestrian crossing near industrial bypass</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                <span>High slope / steep gradient (&gt;8%) at interchange junction</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Missing tactile pathway at freight handling terminal</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Accessible public transport inter-modal feeder link available</span>
              </div>
            </div>
          </div>

          {/* Multi-modal support visualization (Requirement #11) */}
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
            <span>Multi-Modal Evaluation:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-amber-400"><Truck className="w-2.5 h-2.5" /> Freight</span>
              <span className="flex items-center gap-0.5 text-sky-400"><Car className="w-2.5 h-2.5" /> Road</span>
              <span className="flex items-center gap-0.5 text-emerald-400"><Bus className="w-2.5 h-2.5" /> Transit</span>
              <span className="flex items-center gap-0.5 text-purple-400"><Accessibility className="w-2.5 h-2.5" /> Access</span>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced AI Weights & Disruptions */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              {isTamil ? 'கூடுதல் விருப்பங்கள்: AI எடைகள் & சூழல்' : 'Advanced: AI Weights & Disruptions'}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showAdvanced && (
            <div className="p-3 space-y-3 border-t border-slate-800 text-xs">
              {/* Sub-tab Switcher */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setAdvancedTab('weights')}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                    advancedTab === 'weights'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isTamil ? 'அல்காரித எடைகள்' : 'AI Weights (w)'}
                </button>
                <button
                  onClick={() => setAdvancedTab('disruptions')}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all ${
                    advancedTab === 'disruptions'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isTamil ? 'வானிலை & தடைகள்' : 'Chaos Simulator'}
                </button>
              </div>

              {advancedTab === 'weights' && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Multi-Criteria Factors</span>
                    <button
                      onClick={resetWeightsToDefault}
                      className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>

                  {/* Distance */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Distance Factor (w_dist)</span>
                      <span className="font-mono text-sky-400 font-bold">{weights.w_dist.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.w_dist}
                      onChange={(e) => setWeight('w_dist', parseFloat(e.target.value))}
                      className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Travel Time */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Time & Toll Factor (w_time)</span>
                      <span className="font-mono text-amber-400 font-bold">{weights.w_time.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.w_time}
                      onChange={(e) => setWeight('w_time', parseFloat(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Barrier & Accessibility */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Accessibility Deficit (w_barrier)</span>
                      <span className="font-mono text-emerald-400 font-bold">{weights.w_barrier.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.w_barrier}
                      onChange={(e) => setWeight('w_barrier', parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Eco Carbon */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Eco Carbon Factor (w_eco)</span>
                      <span className="font-mono text-teal-400 font-bold">{weights.w_eco.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.w_eco}
                      onChange={(e) => setWeight('w_eco', parseFloat(e.target.value))}
                      className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {advancedTab === 'disruptions' && (
                <div className="space-y-3">
                  {/* Weather Scenario */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {isTamil ? 'வானிலை மாதிரி:' : 'Weather Condition:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setWeather('clear')}
                        className={`p-1.5 rounded-lg border text-center transition-all ${
                          weather === 'clear'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 mx-auto mb-0.5 text-amber-400" />
                        <span className="text-[10px]">Clear</span>
                      </button>

                      <button
                        onClick={() => setWeather('monsoon_cyclone')}
                        className={`p-1.5 rounded-lg border text-center transition-all ${
                          weather === 'monsoon_cyclone'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <CloudRain className="w-3.5 h-3.5 mx-auto mb-0.5 text-sky-400" />
                        <span className="text-[10px]">Monsoon</span>
                      </button>

                      <button
                        onClick={() => setWeather('extreme_summer')}
                        className={`p-1.5 rounded-lg border text-center transition-all ${
                          weather === 'extreme_summer'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 mx-auto mb-0.5 text-rose-400" />
                        <span className="text-[10px]">Summer</span>
                      </button>
                    </div>
                  </div>

                  {/* 24-Hour Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        State Congestion Hour
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{hourOfDay.toString().padStart(2, '0')}:00 hrs</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={hourOfDay}
                      onChange={(e) => setHourOfDay(parseInt(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Instant Disruption Buttons */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {isTamil ? 'உடனடி தடைகள்:' : 'Trigger Incidents:'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleQuickSpawn('monsoon_flooding')}
                        className="p-1.5 rounded-lg bg-sky-950/40 border border-sky-800 text-sky-300 hover:bg-sky-900/50 text-left text-[11px] flex items-center gap-1.5"
                      >
                        <span>🌊</span> Coastal Flood
                      </button>
                      <button
                        onClick={() => handleQuickSpawn('toll_congestion')}
                        className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300 hover:bg-amber-900/50 text-left text-[11px] flex items-center gap-1.5"
                      >
                        <span>🚛</span> Toll Gridlock
                      </button>
                      <button
                        onClick={() => handleQuickSpawn('ghat_landslide')}
                        className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-800 text-purple-300 hover:bg-purple-900/50 text-left text-[11px] flex items-center gap-1.5"
                      >
                        <span>⛰️</span> Ghat Rockfall
                      </button>
                      <button
                        onClick={() => handleQuickSpawn('broken_lift')}
                        className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50 text-left text-[11px] flex items-center gap-1.5"
                      >
                        <span>🛗</span> Lift Failure
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
