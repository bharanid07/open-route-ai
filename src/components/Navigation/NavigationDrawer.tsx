import React from "react";
import { useApp } from "../../context/AppContext";
import { 
  X, 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUpLeft, 
  ArrowUpRight, 
  ArrowUp, 
  RotateCcw, 
  RotateCw, 
  GitMerge, 
  Navigation, 
  Flag, 
  Clock, 
  Milestone, 
  Route, 
  ShieldCheck, 
  MapPin, 
  Zap, 
  ExternalLink 
} from "lucide-react";

export const NavigationDrawer: React.FC = () => {
  const { 
    language,
    navigationRouteData, 
    activeStepIndex, 
    setActiveStepIndex,
    isNavigationDrawerOpen,
    setIsNavigationDrawerOpen,
    currentRoute,
    originId,
    destinationId,
    nodes
  } = useApp();

  const isTamil = language === "ta";

  if (!isNavigationDrawerOpen || !navigationRouteData) {
    return null;
  }

  const steps = navigationRouteData.steps || [];
  const originNode = nodes.find(n => n.id === originId);
  const destNode = nodes.find(n => n.id === destinationId);

  // Render turn icon based on maneuver type & modifier
  const renderTurnIcon = (type: string, modifier?: string) => {
    const size = "w-4 h-4";
    if (type === "arrive") return <Flag className={size} />;
    if (type === "depart") return <Navigation className={size} />;
    if (type === "roundabout" || type === "rotary") return <RotateCw className={size} />;
    if (type === "merge") return <GitMerge className={size} />;

    if (modifier === "left") return <CornerUpLeft className={size} />;
    if (modifier === "right") return <CornerUpRight className={size} />;
    if (modifier === "slight left") return <ArrowUpLeft className={size} />;
    if (modifier === "slight right") return <ArrowUpRight className={size} />;
    if (modifier === "sharp left") return <CornerUpLeft className={size} />;
    if (modifier === "sharp right") return <CornerUpRight className={size} />;
    if (modifier === "uturn") return <RotateCcw className={size} />;

    return <ArrowUp className={size} />;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900/98 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 pointer-events-auto">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              {isTamil ? "வழித்தட வழிகாட்டுதல்" : "Turn-by-Turn Directions"}
            </h3>
            <p className="text-[10px] text-slate-400">
              {isTamil ? "Google Maps நேரடி நெடுஞ்சாலை வழி" : "Google Maps Snapped Highway Navigation"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNavigationDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Directions Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Route Summary Overview Card */}
      <div className="p-4 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 space-y-3">
        {/* Origin & Destination Labels */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 ring-2 ring-amber-400/30"></span>
            <span className="truncate font-semibold">{originNode ? (isTamil ? originNode.nameTamil : originNode.name) : "Origin"}</span>
          </div>
          <div className="w-0.5 h-3 bg-slate-700 ml-1"></div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 ring-2 ring-emerald-500/30"></span>
            <span className="truncate font-semibold">{destNode ? (isTamil ? destNode.nameTamil : destNode.name) : "Destination"}</span>
          </div>
        </div>

        {/* Big ETA and Distance Metrics */}
        <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
          <div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              {navigationRouteData.totalDurationFormatted}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {navigationRouteData.totalDistanceKm} km total distance
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              Fastest Route
            </span>
          </div>
        </div>

        {/* Primary Highway Corridors */}
        {navigationRouteData.primaryHighways.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              {isTamil ? "முக்கிய நெடுஞ்சாலைகள்:" : "Primary Corridors:"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {navigationRouteData.primaryHighways.map((hwy: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-300 font-semibold text-[10px] border border-slate-700/80"
                >
                  {hwy}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Instruction List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 scrollbar-thin">
        {steps.map((step: any, index: number) => {
          const isActive = index === activeStepIndex;

          return (
            <div
              key={step.id}
              onClick={() => setActiveStepIndex(index)}
              onMouseEnter={() => setActiveStepIndex(index)}
              className={`p-3 rounded-xl transition-all cursor-pointer flex gap-3 items-start ${
                isActive
                  ? "bg-slate-800/90 border border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/30 text-white"
                  : "hover:bg-slate-800/40 text-slate-300 hover:text-white"
              }`}
            >
              {/* Step Icon Badge */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {renderTurnIcon(step.maneuverType, step.modifier)}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="font-bold uppercase tracking-wider text-slate-500">
                    Step {step.stepIndex}
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {step.distanceFormatted}
                  </span>
                </div>

                <p className="text-xs font-semibold leading-snug">
                  {isTamil ? step.instructionTamil : step.instruction}
                </p>

                {step.roadName && step.roadName !== "Corridor Segment" && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span className="font-medium text-amber-300/90">{step.roadName}</span>
                    <span className="text-slate-500">• {step.durationFormatted}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>{steps.length} {isTamil ? "திருப்பங்கள்" : "maneuvers"}</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <Zap className="w-3 h-3" />
          OSRM Highway Engine Active
        </span>
      </div>
    </div>
  );
};
