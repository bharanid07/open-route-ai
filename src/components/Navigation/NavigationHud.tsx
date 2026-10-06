import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { 
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
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  ListOrdered,
  Clock,
  Compass,
  Milestone
} from "lucide-react";

export const NavigationHud: React.FC = () => {
  const { 
    language,
    navigationRouteData, 
    activeStepIndex, 
    setActiveStepIndex,
    isNavigationDrawerOpen,
    setIsNavigationDrawerOpen,
    isNavigationHudVisible,
    setIsNavigationHudVisible,
    isOsrmLoading
  } = useApp();

  const isTamil = language === "ta";
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const steps = navigationRouteData?.steps || [];
  const hasSteps = steps.length > 0;
  const currentStep = steps[activeStepIndex] || steps[0];
  const nextStep = steps[activeStepIndex + 1];

  // Calculate live ETA clock time (e.g. 06:45 PM)
  const etaClockTime = useMemo(() => {
    if (!navigationRouteData?.totalDurationHours) return "";
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + navigationRouteData.totalDurationHours * 3600 * 1000);
    return arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [navigationRouteData?.totalDurationHours]);

  if (!isNavigationHudVisible || !navigationRouteData || !hasSteps) {
    return null;
  }

  // Render turn icon based on maneuver type & modifier
  const renderTurnIcon = (type: string, modifier?: string, size: string = "w-6 h-6") => {
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

  const handlePrevStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-xl px-4 pointer-events-auto select-none">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl overflow-hidden text-slate-100 transition-all duration-300">
        {/* Top Header Row with Turn Maneuver */}
        <div className="p-3 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Large Next Turn Icon Box */}
            <div className="w-12 h-12 rounded-xl bg-emerald-600 border border-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 flex-shrink-0 animate-pulse">
              {renderTurnIcon(currentStep.maneuverType, currentStep.modifier, "w-7 h-7")}
            </div>

            {/* Instruction Headline & Upcoming cue */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-0.5">
                <span>{isTamil ? "அடுத்த திருப்பம்:" : "Next Maneuver:"}</span>
                <span className="font-mono text-white bg-slate-800/80 px-1.5 py-0.2 rounded text-[10px]">
                  {currentStep.distanceFormatted}
                </span>
                {isOsrmLoading && (
                  <span className="text-[9px] text-amber-400 font-semibold animate-pulse">
                    • Snapping Highway...
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-white leading-tight truncate">
                {isTamil ? currentStep.instructionTamil : currentStep.instruction}
              </h4>
              {nextStep && !isMinimized && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  <span className="text-slate-500 font-bold">Then:</span>
                  <span>{isTamil ? nextStep.instructionTamil : nextStep.instruction}</span>
                </p>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIsNavigationDrawerOpen(!isNavigationDrawerOpen)}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 hover:text-white transition-all shadow-md"
              title="Open Step-by-Step Directions Side Drawer"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isTamil ? "அனைத்து படிகள்" : "Steps"}</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded-full text-slate-300">
                {steps.length}
              </span>
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title={isMinimized ? "Expand HUD" : "Minimize HUD"}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer Bar: Real-time Remaining ETA, Distance, & Step Navigation */}
        {!isMinimized && (
          <div className="px-3.5 py-2 bg-slate-950/80 flex items-center justify-between text-xs text-slate-300 gap-3">
            {/* Live Metrics */}
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-extrabold text-emerald-400 text-xs">{etaClockTime}</span>
                <span className="text-[10px] text-slate-400 font-medium">({navigationRouteData.totalDurationFormatted})</span>
              </div>
              <div className="h-3 w-px bg-slate-800"></div>
              <div className="flex items-center gap-1 font-semibold text-slate-200">
                <Milestone className="w-3.5 h-3.5 text-amber-400" />
                <span>{navigationRouteData.totalDistanceKm} km</span>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevStep}
                disabled={activeStepIndex === 0}
                className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                title="Previous Turn"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[10px] text-slate-400 font-semibold px-1">
                {activeStepIndex + 1} / {steps.length}
              </span>

              <button
                onClick={handleNextStep}
                disabled={activeStepIndex >= steps.length - 1}
                className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                title="Next Turn"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
