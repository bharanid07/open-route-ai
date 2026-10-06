import React from 'react';
import { AlertTriangle, Sparkles, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AiAlertBanner: React.FC = () => {
  const { language, aiAlert, dismissAiAlert, triggerAutonomousReroute } = useApp();
  const isTamil = language === 'ta';

  if (!aiAlert) return null;

  return (
    <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-amber-950/80 border border-rose-500/40 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isTamil ? 'தமிழ்நாடு நெடுஞ்சாலை இடர்பாடு கண்டறியப்பட்டது' : 'State Corridor Disruption Detected'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              [{aiAlert.timestamp}]
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white">
            {isTamil ? aiAlert.titleTamil : aiAlert.title}
          </h4>
          <p className="text-xs text-slate-300">
            {aiAlert.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
            +{aiAlert.accessibilityDiff} pts Accessibility
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
            Gradient Safe
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerAutonomousReroute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-md shadow-amber-700/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTamil ? 'உகந்த மாற்றுப்பாதையை ஏற்க' : 'Apply AI Corridor'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={dismissAiAlert}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
