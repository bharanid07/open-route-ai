import React, { useState } from 'react';
import { 
  Accessibility, 
  Volume2, 
  AlertTriangle, 
  CheckCircle2, 
  CornerDownRight, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles,
  Mountain,
  Eye,
  HeartPulse
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TNCommuterFilter, TNHazardType, HazardSeverity } from '../../types';

export const CommuterView: React.FC = () => {
  const { 
    language,
    commuterFilter, 
    setCommuterFilter, 
    currentRoute, 
    speakText, 
    spawnHazard,
    nodes
  } = useApp();

  const isTamil = language === 'ta';
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportCategory, setReportCategory] = useState<TNHazardType>('monsoon_flooding');
  const [reportSeverity, setReportSeverity] = useState<HazardSeverity>('critical');
  const [reportTitle, setReportTitle] = useState<string>('Highway Waterlogging on ECR');
  const [reportLocationNode, setReportLocationNode] = useState<string>(nodes[0]?.id || 'chennai_metro');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  const filterOptions: { id: TNCommuterFilter; label: string; labelTamil: string; icon: string; desc: string; descTamil: string }[] = [
    {
      id: 'wheelchair',
      label: 'Wheelchair / Powerchair',
      labelTamil: 'சக்கர நாற்காலி பயனாளி',
      icon: '♿',
      desc: 'Enforces level boarding, max slope <= 5%, low-floor TNSTC buses & working lifts.',
      descTamil: '5% வரை சாய்வு வீதம், மின்தூக்கி மற்றும் தாழ்தள பேருந்து இணைப்புகளை உறுதி செய்கிறது.'
    },
    {
      id: 'elderly',
      label: 'Senior Citizen Mobility',
      labelTamil: 'முதியோர் பாதுகாப்பு',
      icon: '🦯',
      desc: 'Prioritizes battery buggy services at railway junctions & universal rest stops.',
      descTamil: 'ரயில் நிலையங்களில் மின்கல ஊர்தி மற்றும் நெடுஞ்சாலை ஓய்வு மையங்களை முன்னுரிமைப்படுத்துகிறது.'
    },
    {
      id: 'visual_impairment',
      label: 'Visual / Blind Guide',
      labelTamil: 'பார்வைக் குறைபாடு',
      icon: '👁️',
      desc: 'Ensures tactile paving routes & acoustic announcements at all transit terminals.',
      descTamil: 'தொடுஉணர்வு தரை வழிகாட்டி மற்றும் ஒலி அறிவிப்புகளை உறுதி செய்கிறது.'
    },
    {
      id: 'medical_patient',
      label: 'Medical Emergency Patient',
      labelTamil: 'மருத்துவ அவசர நோயாளி',
      icon: '🏥',
      desc: 'Prioritizes smooth low-vibration expressways, bypassing steep ghats & coastal floods.',
      descTamil: 'குலுங்காத விரைவு சாலைகளை தேர்வு செய்து, மலைப்பாதைகள் மற்றும் வெள்ளத்தை தவிர்க்கிறது.'
    }
  ];

  const handleSpeakInstruction = (text: string) => {
    speakText(text, true);
  };

  const handleSubmitHazardReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNode = nodes.find(n => n.id === reportLocationNode);
    const lat = targetNode ? targetNode.lat + 0.05 : 11.5;
    const lng = targetNode ? targetNode.lng + 0.05 : 78.5;

    spawnHazard(reportCategory, lat, lng, reportTitle);
    setReportSuccess(true);

    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Mobility Profile Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Accessibility className="w-4 h-4 text-emerald-400" />
            {isTamil ? 'மாநில அளவிலான மாற்றுத்திறனாளிகள் பாதுகாப்பு வடிகட்டி' : 'Statewide Accessibility & Assistance Filter'}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Disability Act 2016 Compliant</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filterOptions.map((f) => {
            const isSelected = commuterFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setCommuterFilter(f.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{f.icon}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {isTamil ? f.labelTamil : f.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {isTamil ? f.descTamil : f.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Corridor Accessibility Quality Ribbon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Accessibility className="w-4 h-4 text-sky-400" />
          {isTamil ? 'வழித்தட அணுகல் தணிக்கை' : 'Corridor Accessibility Audit'}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-amber-400 font-bold">
          Accessibility data: Demo/Simulated
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>{isTamil ? 'சாய்வு பாதுகாப்பு' : 'Gradient Safety'}</span>
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">
            {currentRoute.maxGradientPercent}% <span className="text-xs font-normal text-slate-500">Max</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {currentRoute.maxGradientPercent <= 5 ? 'Safe for Wheelchairs' : 'Ghat Incline Warning'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>{isTamil ? 'அணுகல்தன்மை குறியீடு' : 'Accessibility Index'}</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-sky-400">
            {currentRoute.accessibilityScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {currentRoute.accessibilityScore >= 90 ? 'Grade AAA Universal' : 'Grade AA Inter-District'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>{isTamil ? 'ஓய்வு மையங்கள்' : 'Universal Rest Stops'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400">
            {currentRoute.stepFreeRestStopPct}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Highway PwD Restrooms
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>{isTamil ? 'இடர்பாடு அறிவிப்பு' : 'Report Hazard'}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full mt-0.5 py-1 px-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <span>{isTamil ? 'புகார் செய்க' : 'Report Corridor Hazard'}</span>
          </button>
        </div>
      </div>

      {/* Turn-by-Turn Guidance with Accessibility Checkpoints */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-400" />
            {isTamil ? 'அணுகல்தன்மை சோதனைச் சாவடிகள் & வழிகாட்டுதல்' : 'Turn-by-Turn Guidance & Accessibility Checkpoints'}
          </h3>
          <button
            onClick={() => {
              if (currentRoute.turnByTurn.length > 0) {
                speakText(currentRoute.turnByTurn.map(t => t.audioAnnouncement).join(' '));
              }
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isTamil ? 'முழு வழியையும் வாசிக்க' : 'Read Full Route'}</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {currentRoute.turnByTurn.map((step, idx) => (
            <div
              key={step.id}
              className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{isTamil ? step.instructionTamil : step.instruction}</span>
                    {step.highwayCode && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold font-mono">
                        {step.highwayCode}
                      </span>
                    )}
                  </div>
                  {step.accessibilityCheckpoint && (
                    <div className="text-[11px] text-emerald-400/90 mt-1 flex items-start gap-1">
                      <ShieldCheck className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{isTamil ? step.accessibilityCheckpointTamil : step.accessibilityCheckpoint}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-1">
                    Distance: {step.distanceKm} km • Est. Time: {step.durationMinutes} mins • Gradient: {step.gradientPercent}%
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSpeakInstruction(step.audioAnnouncement)}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                title="Hear audio guidance"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* State Hazard Reporting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{isTamil ? 'தமிழ்நாடு நெடுஞ்சாலை இடர்பாடு அறிக்கை' : 'Report State Highway Disruption'}</span>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Disruption Broadcasted</h4>
                <p className="text-xs text-slate-400">
                  Statewide AI heuristic engine has dynamically rerouted active medical ambulances and heavy logistics around this segment!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitHazardReport} className="space-y-3.5">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Disruption Category
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as TNHazardType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="monsoon_flooding">Coastal Monsoon Waterlogging / Storm Surge</option>
                    <option value="toll_congestion">Toll Plaza FASTag Server Failure & Gridlock</option>
                    <option value="ghat_landslide">Mountain Ghat Rockfall & Subsidence</option>
                    <option value="broken_lift">Transit Terminal Wheelchair Lift Breakdown</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Nearest Highway Node
                  </label>
                  <select
                    value={reportLocationNode}
                    onChange={(e) => setReportLocationNode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {nodes.map(n => (
                      <option key={`rep_${n.id}`} value={n.id}>
                        {isTamil ? n.nameTamil : n.name} ({n.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Description & Observations
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="e.g. 1.5ft water depth along ECR road"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md shadow-rose-900/30 flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Broadcast State Alert</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
