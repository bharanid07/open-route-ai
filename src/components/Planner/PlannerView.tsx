import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Coins, 
  ShieldAlert, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  Sliders,
  X,
  Truck,
  Car,
  Bus,
  Accessibility,
  Footprints
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PlannerView: React.FC = () => {
  const { 
    language,
    districtScorecards,
    nodes,
    edges 
  } = useApp();

  const isTamil = language === 'ta';
  const [stateCapBudgetCrores, setStateCapBudgetCrores] = useState<number>(35); // 35 Crores
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Coimbatore');
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState<boolean>(false);
  const [activeWhatIfScenario, setActiveWhatIfScenario] = useState<string>('block_coimbatore_chennai');

  // AI Priority Ranking data derived from district metrics (Requirements #1 & #10)
  const priorityDistricts = [
    {
      name: 'Coimbatore',
      nameTamil: 'கோயம்புத்தூர்',
      score: 94,
      rank: 1,
      freightDemand: 'HIGH',
      accessibilityGap: 'MEDIUM',
      logisticsDemand: 'HIGH',
      infraDeficit: 'HIGH',
      investmentCr: (stateCapBudgetCrores * 0.15).toFixed(1),
      logisticsImpact: '+14%',
      accessPoints: '+18',
      explanation: [
        'High freight corridor activity connecting NH 544 & Kerala gateway',
        '6 accessibility blackspots detected along industrial bypass',
        'High infrastructure demand from heavy machinery & textile logistics',
        'Crucial regional hub for Western Tamil Nadu manufacturing',
        'Highest potential return per ₹ invested (1.8x statewide average)'
      ],
      recommendedAction: 'Upgrade accessibility infrastructure and retrofitting multimodal ramps along NH 544 logistics corridors.',
      factors: {
        freightImportance: 94,
        accessibilityGap: 82,
        congestionRisk: 74,
        populationImpact: 88,
        investmentEfficiency: 92,
        aiConfidence: 91
      }
    },
    {
      name: 'Salem',
      nameTamil: 'சேலம்',
      score: 89,
      rank: 2,
      freightDemand: 'HIGH',
      accessibilityGap: 'HIGH',
      logisticsDemand: 'HIGH',
      infraDeficit: 'MEDIUM',
      investmentCr: (stateCapBudgetCrores * 0.12).toFixed(1),
      logisticsImpact: '+11%',
      accessPoints: '+16',
      explanation: [
        'Central freight interchange junction connecting NH 44 and NH 544',
        'Elevated steel & mineral freight volume creating junction bottlenecks',
        'Pedestrian barrier at freight railway crossings',
        'High potential for alternate corridor bypass relief'
      ],
      recommendedAction: 'Eliminate freight interchange blackspots and deploy tactile pathways at Salem logistics junction.',
      factors: {
        freightImportance: 90,
        accessibilityGap: 86,
        congestionRisk: 78,
        populationImpact: 76,
        investmentEfficiency: 89,
        aiConfidence: 88
      }
    },
    {
      name: 'Tiruchirappalli',
      nameTamil: 'திருச்சிராப்பள்ளி',
      score: 84,
      rank: 3,
      freightDemand: 'MEDIUM',
      accessibilityGap: 'HIGH',
      logisticsDemand: 'MEDIUM',
      infraDeficit: 'HIGH',
      investmentCr: (stateCapBudgetCrores * 0.11).toFixed(1),
      logisticsImpact: '+9%',
      accessPoints: '+15',
      explanation: [
        'Geographic heart of Tamil Nadu logistics distribution',
        'Delta agrarian distribution freight convergence point',
        'Significant public transport accessibility deficit at freight terminal zone',
        'Moderate congestion with severe seasonal flood risk'
      ],
      recommendedAction: 'Install flood-resilient multimodal accessible rest stops and grade separators.',
      factors: {
        freightImportance: 82,
        accessibilityGap: 88,
        congestionRisk: 68,
        populationImpact: 79,
        investmentEfficiency: 84,
        aiConfidence: 86
      }
    },
    {
      name: 'Chennai',
      nameTamil: 'சென்னை',
      score: 82,
      rank: 4,
      freightDemand: 'CRITICAL',
      accessibilityGap: 'MEDIUM',
      logisticsDemand: 'CRITICAL',
      infraDeficit: 'MEDIUM',
      investmentCr: (stateCapBudgetCrores * 0.18).toFixed(1),
      logisticsImpact: '+16%',
      accessPoints: '+12',
      explanation: [
        'Highest freight density in South India (Port & Industrial corridor)',
        'Heavy port truck queueing on GST & Ennore Expressways',
        'Complex multi-modal transitions between road, rail, and port',
        'High population exposure to freight emissions & pedestrian hazards'
      ],
      recommendedAction: 'Deploy smart port freight staging corridors with automated accessible skywalks.',
      factors: {
        freightImportance: 98,
        accessibilityGap: 72,
        congestionRisk: 92,
        populationImpact: 96,
        investmentEfficiency: 81,
        aiConfidence: 94
      }
    },
    {
      name: 'Madurai',
      nameTamil: 'மதுரை',
      score: 79,
      rank: 5,
      freightDemand: 'MEDIUM',
      accessibilityGap: 'MEDIUM',
      logisticsDemand: 'MEDIUM',
      infraDeficit: 'MEDIUM',
      investmentCr: (stateCapBudgetCrores * 0.10).toFixed(1),
      logisticsImpact: '+8%',
      accessPoints: '+14',
      explanation: [
        'Southern logistics gateway for Tuticorin port and agricultural corridors',
        'Narrow urban bottlenecks impacting freight ring road throughput',
        'Accessibility deficiencies at southern freight handling depots'
      ],
      recommendedAction: 'Upgrade Southern NH 44 bypass interchange with accessible pedestrian underpasses.',
      factors: {
        freightImportance: 79,
        accessibilityGap: 78,
        congestionRisk: 72,
        populationImpact: 82,
        investmentEfficiency: 80,
        aiConfidence: 85
      }
    }
  ];

  // Dynamic budget allocation calculation based on slider
  const budgetAllocations = [
    { district: 'Chennai', allocation: (stateCapBudgetCrores * 0.18).toFixed(1) },
    { district: 'Coimbatore', allocation: (stateCapBudgetCrores * 0.15).toFixed(1) },
    { district: 'Salem', allocation: (stateCapBudgetCrores * 0.12).toFixed(1) },
    { district: 'Tiruchirappalli', allocation: (stateCapBudgetCrores * 0.11).toFixed(1) },
    { district: 'Madurai', allocation: (stateCapBudgetCrores * 0.10).toFixed(1) },
    { district: 'Tirunelveli', allocation: (stateCapBudgetCrores * 0.08).toFixed(1) },
    { district: 'Erode', allocation: (stateCapBudgetCrores * 0.07).toFixed(1) }
  ];

  const currentSelectedDistrict = priorityDistricts.find(d => d.name.toLowerCase() === selectedDistrictName.toLowerCase()) || {
    name: selectedDistrictName,
    nameTamil: selectedDistrictName,
    score: 80,
    rank: 6,
    freightDemand: 'MEDIUM',
    accessibilityGap: 'MEDIUM',
    logisticsDemand: 'MEDIUM',
    infraDeficit: 'MEDIUM',
    investmentCr: (stateCapBudgetCrores * 0.08).toFixed(1),
    logisticsImpact: '+8%',
    accessPoints: '+12',
    explanation: [
      'Regional logistics corridor feeder zone',
      'Accessibility deficit detected at district bus terminals and highway intersections',
      'Targeted retrofit opportunity with high community benefit'
    ],
    recommendedAction: 'Implement targeted barrier-free retrofits at key transport nodes along freight routes.',
    factors: {
      freightImportance: 75,
      accessibilityGap: 75,
      congestionRisk: 65,
      populationImpact: 70,
      investmentEfficiency: 78,
      aiConfidence: 82
    }
  };

  // What-If scenarios data
  const whatIfScenarios: Record<string, {
    title: string;
    question: string;
    affectedDistricts: number;
    affectedRoutes: number;
    delay: string;
    accessImpact: string;
    economicImpact: string;
    recommendation: string;
  }> = {
    block_coimbatore_chennai: {
      title: 'Block Coimbatore ➔ Chennai Main Freight Corridor',
      question: 'What if the Coimbatore-Chennai corridor is blocked due to major road maintenance / accident?',
      affectedDistricts: 5,
      affectedRoutes: 8,
      delay: '+42 min',
      accessImpact: 'MEDIUM',
      economicImpact: 'HIGH',
      recommendation: 'Redirect freight through alternate corridor via Salem NH 544 and prioritize emergency infrastructure traffic control at Salem junction.'
    },
    reduce_budget_40: {
      title: 'Reduce State Infrastructure Budget by 40%',
      question: 'What if the statewide capital allocation is reduced from ₹35 Cr to ₹21 Cr?',
      affectedDistricts: 14,
      affectedRoutes: 11,
      delay: '+18 min',
      accessImpact: 'CRITICAL',
      economicImpact: 'HIGH',
      recommendation: 'Protect high-density Tier-1 corridors (Chennai-Hosur, Coimbatore-Tuticorin) while deferring non-critical rural bypass upgrades.'
    },
    mandate_accessibility: {
      title: 'Mandate Accessibility Requirements on Port Corridors',
      question: 'What if universal accessibility standards are enforced on all heavy freight routes connecting ports?',
      affectedDistricts: 7,
      affectedRoutes: 6,
      delay: '+5 min (staging)',
      accessImpact: 'OPTIMAL (+24 pts)',
      economicImpact: 'POSITIVE LONG-TERM',
      recommendation: 'Co-locate accessible driver rest facilities, wheelchair-compliant truck staging terminals, and safe pedestrian overpasses.'
    },
    monsoon_coastal_surge: {
      title: 'Simulate Severe Coastal Monsoon Flooding',
      question: 'What if extreme weather causes storm surges across the ECR / Puducherry-Cuddalore corridor?',
      affectedDistricts: 6,
      affectedRoutes: 5,
      delay: '+55 min',
      accessImpact: 'SEVERE',
      economicImpact: 'HIGH',
      recommendation: 'Divert freight inland along NH 45 GST Road and deploy elevated accessible rescue staging platforms in Cuddalore.'
    }
  };

  const activeScenarioData = whatIfScenarios[activeWhatIfScenario] || whatIfScenarios.block_coimbatore_chennai;

  return (
    <div className="space-y-4">
      {/* State Infrastructure Budget & Policy Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-400" />
                {isTamil ? 'தமிழ்நாடு உலகளாவிய அணுகல் உட்கட்டமைப்பு நிதி ஒதுக்கீடு' : 'Tamil Nadu State Universal Accessibility Capital Allocation Simulator'}
              </h3>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                DEMO / SIMULATED DATA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-district budget simulation for retrofitting highway rest stops, lift skywalks, and tactile platforms.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWhatIfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 border border-amber-400/40 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isTamil ? 'என்ன நடக்கும்? (What-If)' : '⚡ WHAT-IF ANALYSIS'}</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Annual State Capital</span>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                ₹{stateCapBudgetCrores} Crores
              </div>
            </div>
          </div>
        </div>

        {/* Budget Allocation Slider (Requirement #6) */}
        <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              State Barrier Elimination Capital Pool
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              ₹{stateCapBudgetCrores} Cr / ₹80 Cr Plan
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={stateCapBudgetCrores}
            onChange={(e) => setStateCapBudgetCrores(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>₹10 Crores (Phase 1)</span>
            <span>₹40 Crores (Highways & Junctions)</span>
            <span>₹80 Crores (All 38 Districts)</span>
          </div>

          {/* Dynamic AI Allocation Breakdown according to budget */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                AI Recommended Allocation (Budget: ₹{stateCapBudgetCrores} Cr)
              </span>
              <span className="text-slate-500 font-mono font-normal">DEMO / SIMULATED DATA</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {budgetAllocations.map(ba => (
                <div key={ba.district} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5">
                  <span className="text-slate-300 font-medium">{ba.district}:</span>
                  <span className="text-emerald-400 font-mono font-bold">₹{ba.allocation} Cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projected Impact Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Accessibility Improvement</div>
            <div className="text-base font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
              <span>+{Math.round(stateCapBudgetCrores * 0.32)} pts</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Logistics Efficiency</div>
            <div className="text-base font-extrabold text-amber-400 mt-0.5 font-mono">
              +{Math.round(stateCapBudgetCrores * 0.23)}%
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Citizens Benefited</div>
            <div className="text-base font-extrabold text-sky-400 mt-0.5 font-mono">
              {(stateCapBudgetCrores * 1.8).toFixed(1)} Lakhs
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Corridor Efficiency</div>
            <div className="text-base font-extrabold text-purple-400 mt-0.5 font-mono">
              +{Math.round(stateCapBudgetCrores * 0.18)}%
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 1. AI INFRASTRUCTURE PRIORITY ENGINE (Requirement #1) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isTamil ? '🤖 AI உட்கட்டமைப்பு முன்னுரிமை மாவட்டங்கள்' : '🤖 AI INFRASTRUCTURE PRIORITY'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Statewide multi-criteria ranking connecting freight importance, accessibility gaps, congestion risk, and capital efficiency.
            </p>
          </div>
          <div className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 px-2 py-1 rounded-md self-start font-mono">
            CORE DECISION METRIC • DEMO / SIMULATED DATA
          </div>
        </div>

        {/* Priority District Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {priorityDistricts.slice(0, 3).map((pd) => (
            <div 
              key={pd.name}
              onClick={() => setSelectedDistrictName(pd.name)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedDistrictName.toLowerCase() === pd.name.toLowerCase()
                  ? 'bg-amber-950/20 border-amber-500/80 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-400 font-mono">#{pd.rank}</span>
                    <h4 className="text-sm font-extrabold text-white">{pd.name}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">{pd.nameTamil}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Priority Score</span>
                  <div className="text-base font-extrabold text-amber-400 font-mono">{pd.score}/100</div>
                </div>
              </div>

              {/* Multi-factor badges */}
              <div className="space-y-1.5 py-2 border-y border-slate-800/80 text-[11px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Why AI Prioritized:</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Freight Eff:</span>
                    <span className="text-emerald-400 font-bold">{pd.freightDemand}</span>
                  </div>
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Access Gap:</span>
                    <span className="text-rose-400 font-bold">{pd.accessibilityGap}</span>
                  </div>
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Logistics:</span>
                    <span className="text-amber-400 font-bold">{pd.logisticsDemand}</span>
                  </div>
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Infra Deficit:</span>
                    <span className="text-orange-400 font-bold">{pd.infraDeficit}</span>
                  </div>
                </div>
              </div>

              {/* Recommended Investment & Expected Impact */}
              <div className="mt-2.5 pt-1 flex items-center justify-between text-[11px]">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Investment:</div>
                  <div className="font-mono font-bold text-emerald-400">₹{pd.investmentCr} Cr</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400 uppercase">Expected Impact:</div>
                  <div className="font-mono font-bold text-sky-400">{pd.logisticsImpact} log • {pd.accessPoints} pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🤖 2. "WHY THIS DISTRICT?" AI EXPLANATION DETAIL PANEL (Requirements #2, #10 & #11) */}
      {selectedDistrictName && (
        <div className="bg-slate-900/95 border border-amber-500/40 rounded-xl p-4 space-y-3.5 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                #{currentSelectedDistrict.rank || 1}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{currentSelectedDistrict.name}</span>
                  <span className="text-xs text-slate-400 font-normal">({currentSelectedDistrict.nameTamil})</span>
                </h4>
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{isTamil ? 'ஏன் இந்த மாவட்டம் முன்னுரிமை பெற்றது?' : '🤖 WHY AI PRIORITIZED THIS DISTRICT?'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Priority</span>
                <div className="text-lg font-extrabold text-amber-400 font-mono">
                  {currentSelectedDistrict.score} / 100
                </div>
              </div>
              <button 
                onClick={() => setSelectedDistrictName('')}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Why factors checklist */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Evidence & Strategic Factors
              </div>
              <div className="space-y-1.5">
                {currentSelectedDistrict.explanation.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Recommended Action */}
              <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="font-bold text-amber-400 text-[10px] uppercase mb-0.5">
                  RECOMMENDED ACTION:
                </div>
                <div className="text-slate-200 font-medium">
                  "{currentSelectedDistrict.recommendedAction}"
                </div>
              </div>
            </div>

            {/* AI Decision Factor Bars (Requirement #10) */}
            <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase">
                <span>AI Decision Weight Breakdown</span>
                <span className="text-emerald-400 font-mono text-[10px]">Confidence: {currentSelectedDistrict.factors.aiConfidence}%</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Freight Corridor Activity</span>
                    <span className="text-amber-400 font-mono font-bold">{currentSelectedDistrict.factors.freightImportance}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${currentSelectedDistrict.factors.freightImportance}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Accessibility Deficit</span>
                    <span className="text-rose-400 font-mono font-bold">{currentSelectedDistrict.factors.accessibilityGap}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${currentSelectedDistrict.factors.accessibilityGap}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Congestion Risk</span>
                    <span className="text-orange-400 font-mono font-bold">{currentSelectedDistrict.factors.congestionRisk}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${currentSelectedDistrict.factors.congestionRisk}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Population Impact</span>
                    <span className="text-sky-400 font-mono font-bold">{currentSelectedDistrict.factors.populationImpact}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${currentSelectedDistrict.factors.populationImpact}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Investment Efficiency</span>
                    <span className="text-emerald-400 font-mono font-bold">{currentSelectedDistrict.factors.investmentEfficiency}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentSelectedDistrict.factors.investmentEfficiency}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Multi-modal Support Tag (Requirement #11) */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Multi-Modal Modes Evaluated:</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-amber-400" title="Freight"><Truck className="w-3 h-3" /> Freight</span>
                  <span className="flex items-center gap-0.5 text-sky-400" title="Road"><Car className="w-3 h-3" /> Road</span>
                  <span className="flex items-center gap-0.5 text-emerald-400" title="Public Transit"><Bus className="w-3 h-3" /> Transit</span>
                  <span className="flex items-center gap-0.5 text-purple-400" title="Accessible Mobility"><Accessibility className="w-3 h-3" /> Accessible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* District-level Scorecard: Logistics Efficiency vs Disability Accommodation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            {isTamil ? 'மாவட்ட வாரியான சரக்கு செயல்திறன் & அணுகல்தன்மை ஒப்பீடு' : 'District Logistics Efficiency vs. Disability Accommodation Scorecard'}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Click any district row to view AI rationale</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Logistics Rank</th>
                <th className="py-2.5 px-3">Freight Efficiency</th>
                <th className="py-2.5 px-3">Accessibility Score</th>
                <th className="py-2.5 px-3">Blackspots</th>
                <th className="py-2.5 px-3">Population</th>
                <th className="py-2.5 px-3">Recommended Retrofit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {districtScorecards.map((d) => (
                <tr 
                  key={d.districtName} 
                  onClick={() => setSelectedDistrictName(d.districtName)}
                  className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    selectedDistrictName.toLowerCase() === d.districtName.toLowerCase() ? 'bg-amber-950/20 text-amber-300' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                    <span>{isTamil ? d.districtNameTamil : d.districtName}</span>
                    {selectedDistrictName.toLowerCase() === d.districtName.toLowerCase() && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                    #{d.logisticsRank}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                    {d.logisticsEfficiencyScore} / 100
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {d.accessibilityScore} / 100
                  </td>
                  <td className="py-2.5 px-3 font-mono text-rose-400">
                    {d.blackspotsCount} Deficits
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {d.populationLakhs} Lakhs
                  </td>
                  <td className="py-2.5 px-3 font-mono text-amber-300">
                    ₹{(d.budgetRecommendedINR / 10000000).toFixed(1)} Cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⚡ 7. WHAT-IF STATE PLANNING MODAL (Requirement #7) */}
      {isWhatIfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>⚡ WHAT-IF STATE PLANNING SIMULATOR</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      DEMO / SIMULATED DATA
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulate real-time policy, budget shocks, and corridor roadblocks across Tamil Nadu.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsWhatIfModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scenario Picker */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select What-If Scenario:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(whatIfScenarios).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => setActiveWhatIfScenario(key)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      activeWhatIfScenario === key
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold mb-0.5 text-amber-300">{s.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{s.question}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Calculations Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Calculated Impacts for "{activeScenarioData.title}":
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Affected Districts</div>
                  <div className="text-base font-extrabold text-white mt-0.5 font-mono">
                    {activeScenarioData.affectedDistricts} Districts
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Affected Freight Routes</div>
                  <div className="text-base font-extrabold text-orange-400 mt-0.5 font-mono">
                    {activeScenarioData.affectedRoutes} Routes
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Estimated Delay</div>
                  <div className="text-base font-extrabold text-rose-400 mt-0.5 font-mono">
                    {activeScenarioData.delay}
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Accessibility Impact</div>
                  <div className="text-sm font-extrabold text-purple-400 mt-0.5">
                    {activeScenarioData.accessImpact}
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 sm:col-span-2">
                  <div className="text-[10px] text-slate-400">Economic / Logistics Impact</div>
                  <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                    {activeScenarioData.economicImpact}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="font-bold text-amber-400 text-[10px] uppercase mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  AI Policy Recommendation:
                </div>
                <div className="text-slate-200 font-medium leading-relaxed">
                  "{activeScenarioData.recommendation}"
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsWhatIfModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
