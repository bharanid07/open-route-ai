import React, { useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Wrench, 
  Mountain,
  MapPin,
  Truck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TNAccessibilityScorer, TNAccessibilityAuditReport } from '../../engine/accessibilityScorer';

export const AuditModal: React.FC = () => {
  const { 
    language,
    inspectedNode, 
    inspectedEdge, 
    setInspectedNode, 
    setInspectedEdge, 
    hazards 
  } = useApp();

  const isTamil = language === 'ta';

  const auditReport: TNAccessibilityAuditReport | null = useMemo(() => {
    if (inspectedNode) {
      return TNAccessibilityScorer.scoreTerminal(inspectedNode, hazards);
    }
    if (inspectedEdge) {
      return TNAccessibilityScorer.scoreHighway(inspectedEdge, hazards);
    }
    return null;
  }, [inspectedNode, inspectedEdge, hazards]);

  if (!auditReport) return null;

  const handleClose = () => {
    setInspectedNode(null);
    setInspectedEdge(null);
  };

  const gradeColor = 
    auditReport.complianceGrade.includes('AAA') 
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
      : auditReport.complianceGrade.includes('AA') 
      ? 'text-sky-400 bg-sky-500/10 border-sky-500/30' 
      : auditReport.complianceGrade.includes('A') 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 p-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Engine 2 • Statewide Accessibility Matrix
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${gradeColor}`}>
                {isTamil ? auditReport.complianceGradeTamil : auditReport.complianceGrade}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {isTamil ? auditReport.nameTamil : auditReport.name}
            </h3>
            <p className="text-xs text-slate-400">
              {auditReport.district} • Evaluated under Rights of Persons with Disabilities Act 2016
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Overall Index Score Box */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-2xl font-mono shadow-inner">
              {auditReport.overallScore}
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {isTamil ? 'அணுகல்தன்மை குறியீட்டு எண்' : 'Accessibility Index Score'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Scale 0 (Impassable Barrier) to 100 (Universal Step-Free Inter-Modal Gateway)
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Status:</span>
            <span className="text-sm font-bold text-emerald-400">
              {auditReport.overallScore >= 80 ? 'Approved for All PwDs' : 'Requires Infrastructure Retrofit'}
            </span>
          </div>
        </div>

        {/* High Terrain / Mountain Warning Alert If Applicable */}
        {auditReport.terrainAlert && (
          <div className="bg-purple-950/30 border border-purple-500/40 p-3 rounded-xl space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase">
              <Mountain className="w-4 h-4 text-purple-400" />
              <span>{isTamil ? 'செங்குத்தான மலைப்பாதை எச்சரிக்கை' : 'Terrain Warning: Steep Ghat Section'}</span>
            </div>
            <p className="text-xs text-slate-300 pl-6">
              {isTamil ? auditReport.terrainAlert.warningMessageTamil : auditReport.terrainAlert.warningMessage}
            </p>
          </div>
        )}

        {/* Criteria Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isTamil ? 'மதிப்பீட்டுக் கூறுகள்' : 'Criteria Audit Scorecard'}
          </h4>

          <div className="space-y-2">
            {auditReport.criteria.map((c, i) => {
              const statusIcon = 
                c.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                c.status === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                <AlertTriangle className="w-4 h-4 text-rose-400" />;

              const barColor = 
                c.score >= 80 ? 'bg-emerald-500' :
                c.score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

              return (
                <div
                  key={i}
                  className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <span className="font-semibold text-slate-200">
                        {isTamil ? c.titleTamil : c.title}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-100">
                      {c.score} <span className="text-slate-500 font-normal">/ 100</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 pl-6">
                    {isTamil ? c.detailsTamil : c.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Disruption Penalties */}
        {auditReport.activeHazards.length > 0 && (
          <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Active Disruption Penalties Applied (-25 pts)</span>
            </div>
            {auditReport.activeHazards.map(obs => (
              <div key={obs.id} className="text-xs text-slate-300 pl-5">
                • <span className="font-semibold text-white">{isTamil ? obs.titleTamil : obs.title}</span>: {obs.description}
              </div>
            ))}
          </div>
        )}

        {/* Engineering Recommendations */}
        {auditReport.recommendations.length > 0 && (
          <div className="bg-blue-950/20 border border-blue-500/30 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase">
              <Wrench className="w-4 h-4" />
              <span>{isTamil ? 'உட்கட்டமைப்பு மேம்பாட்டு பரிந்துரைகள்' : 'Infrastructure Upgrade Recommendations'}</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 pl-5 list-disc">
              {auditReport.recommendations.map((rec, idx) => (
                <li key={idx}>
                  {isTamil && auditReport.recommendationsTamil[idx] ? auditReport.recommendationsTamil[idx] : rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            {isTamil ? 'மூடுக' : 'Close Audit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
