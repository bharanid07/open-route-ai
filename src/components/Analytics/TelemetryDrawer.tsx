import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Mountain, 
  BarChart2, 
  Table, 
  Clock, 
  MapPin, 
  Leaf, 
  ShieldCheck, 
  Zap,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const TelemetryDrawer: React.FC = () => {
  const { language, currentRoute, standardBaselineRoute } = useApp();
  const isTamil = language === 'ta';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'elevation' | 'radar' | 'comparison'>('elevation');

  const qualityData = [
    { name: isTamil ? 'பாதுகாப்பு' : 'Safety', score: currentRoute.ratingBreakdown.safety, color: '#10b981' },
    { name: isTamil ? 'வேகம்' : 'Speed', score: currentRoute.ratingBreakdown.speed, color: '#3b82f6' },
    { name: isTamil ? 'சுற்றுச்சூழல்' : 'Eco Carbon', score: currentRoute.ratingBreakdown.eco, color: '#06b6d4' },
    { name: isTamil ? 'உள்ளடக்கம்' : 'Inclusivity', score: currentRoute.ratingBreakdown.inclusivity, color: '#8b5cf6' },
    { name: isTamil ? 'சாய்வு பாதுகாப்பு' : 'Gradient Safe', score: currentRoute.ratingBreakdown.gradientSafety, color: '#f59e0b' }
  ];

  return (
    <div className="border-t border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl transition-all duration-300 z-20">
      {/* Header bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronUp className="w-4 h-4 text-amber-400" />}
            <span className="uppercase tracking-wider text-[11px]">
              {isTamil ? 'தொலைநிலை அளவீடு & தரை விவரங்கள்' : 'State Corridor Telemetry & Analytics'}
            </span>
          </button>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-sans text-[11px]">{isTamil ? 'நேரம்:' : 'ETA:'}</span>
              <span className="font-bold text-slate-100">{currentRoute.totalTimeHours} hrs</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 font-sans text-[11px]">{isTamil ? 'தூரம்:' : 'Dist:'}</span>
              <span className="font-bold text-slate-100">{currentRoute.totalDistanceKm} km</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 font-sans text-[11px]">{isTamil ? 'அணுகல்தன்மை:' : 'Score:'}</span>
              <span className="font-bold text-emerald-400">{currentRoute.accessibilityScore}/100</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400 font-sans text-[11px]">{isTamil ? 'சேமித்த CO2:' : 'CO2 Saved:'}</span>
              <span className="font-bold text-teal-300">{currentRoute.carbonSavedVsStandardKg} kg</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('elevation')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeTab === 'elevation'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTamil ? 'உயர சாய்வு விவரம்' : 'Elevation Profile'}</span>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeTab === 'radar'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTamil ? 'குறியீடு பகுப்பாய்வு' : 'Quality Breakdown'}</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTamil ? 'வழித்தட ஒப்பீடு' : 'Route Comparison'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 max-h-64 overflow-y-auto">
          {/* TAB 1: Elevation Profile */}
          {activeTab === 'elevation' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" />
                  State Topographic Gradient: Sea Level (0m) to Nilgiris (2,240m)
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  Max Route Gradient: {currentRoute.maxGradientPercent}%
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentRoute.elevationProfile}>
                    <defs>
                      <linearGradient id="tnElevationGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="distanceKm" 
                      stroke="#64748b" 
                      fontSize={10} 
                      unit=" km" 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      unit=" m" 
                      domain={[0, 'auto']} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val: number) => [`${val} meters MSL`, 'Altitude']}
                      labelFormatter={(label) => `Distance from Origin: ${label} km`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="elevationM" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#tnElevationGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 2: Multi-Criteria Breakdown */}
          {activeTab === 'radar' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Multi-Objective Score Index (0 - 100)</span>
                <span className="text-amber-400 font-bold font-mono">
                  State Corridor Index: {currentRoute.accessibilityScore}/100
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={90} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val: number) => [`${val} / 100`, 'Rating']}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: Route Comparison */}
          {activeTab === 'comparison' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium">
                Comparative Corridor Matrix: Standard Freight vs. AI Optimized Corridor
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Corridor Profile</th>
                      <th className="py-2 px-3">Distance</th>
                      <th className="py-2 px-3">Travel Time</th>
                      <th className="py-2 px-3">Accessibility Score</th>
                      <th className="py-2 px-3">Universal Rest %</th>
                      <th className="py-2 px-3">Max Gradient</th>
                      <th className="py-2 px-3">Tolls & Wait</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-slate-300">Standard Heavy Commercial</td>
                      <td className="py-2 px-3 font-mono">{standardBaselineRoute.totalDistanceKm} km</td>
                      <td className="py-2 px-3 font-mono">{standardBaselineRoute.totalTimeHours} hrs</td>
                      <td className="py-2 px-3 font-mono text-amber-400">{standardBaselineRoute.accessibilityScore} / 100</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{standardBaselineRoute.stepFreeRestStopPct}%</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{standardBaselineRoute.maxGradientPercent}%</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{standardBaselineRoute.tollPlazasTotal} plazas ({standardBaselineRoute.tollWaitTotalMinutes}m)</td>
                    </tr>
                    <tr className="bg-amber-950/20 hover:bg-amber-950/30">
                      <td className="py-2 px-3 font-bold text-amber-400">OPENROUTE AI Corridor</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-300">{currentRoute.totalDistanceKm} km</td>
                      <td className="py-2 px-3 font-mono font-bold text-white">{currentRoute.totalTimeHours} hrs</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">{currentRoute.accessibilityScore} / 100</td>
                      <td className="py-2 px-3 font-mono font-bold text-sky-400">{currentRoute.stepFreeRestStopPct}%</td>
                      <td className="py-2 px-3 font-mono font-bold text-teal-300">{currentRoute.maxGradientPercent}% (Safe)</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">{currentRoute.tollPlazasTotal} plazas ({currentRoute.tollWaitTotalMinutes}m)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
