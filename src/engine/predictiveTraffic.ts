import { TNHazardIncident, TNHazardType, HazardSeverity } from '../types';

export class TNPredictiveTrafficEngine {

  /**
   * Generates a disruption incident across Tamil Nadu with quantified penalties
   */
  public static createDisruption(
    type: TNHazardType,
    lat: number,
    lng: number,
    options?: {
      title?: string;
      titleTamil?: string;
      associatedEdgeId?: string;
      associatedNodeId?: string;
      severity?: HazardSeverity;
    }
  ): TNHazardIncident {
    const defaultMeta: Record<TNHazardType, { title: string; titleTamil: string; delayMult: number; barrierPen: number; severity: HazardSeverity }> = {
      monsoon_flooding: {
        title: 'Coastal Monsoon Surge & Highway Waterlogging',
        titleTamil: 'கடலோர பருவமழை வெள்ளப்பெருக்கு',
        delayMult: 2.8,
        barrierPen: 85,
        severity: 'critical'
      },
      toll_congestion: {
        title: 'Toll Plaza Freight Backlog & Congestion',
        titleTamil: 'சுங்கச்சாவடி சரக்கு லாரி நெரிசல்',
        delayMult: 1.9,
        barrierPen: 35,
        severity: 'medium'
      },
      ghat_landslide: {
        title: 'Mountain Ghat Landslide & Rockfall Closure',
        titleTamil: 'மலைப்பாதை நிலச்சரிவு மற்றும் பாதை அடைப்பு',
        delayMult: 3.5,
        barrierPen: 95,
        severity: 'critical'
      },
      broken_lift: {
        title: 'Inter-District Terminal Elevator Breakdown',
        titleTamil: 'முனைய மின்தூக்கி பழுது',
        delayMult: 1.4,
        barrierPen: 75,
        severity: 'critical'
      },
      surface_hazard: {
        title: 'Highway Resurfacing & Deep Pavement Rutting',
        titleTamil: 'நெடுஞ்சாலை சீரமைப்பு & சாலை மேடு பள்ளங்கள்',
        delayMult: 1.6,
        barrierPen: 40,
        severity: 'medium'
      }
    };

    const meta = defaultMeta[type];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: `tn_hzd_${Date.now()}`,
      type,
      title: options?.title || meta.title,
      titleTamil: options?.titleTamil || meta.titleTamil,
      description: `Reported incident at coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Heuristic router applies dynamic multiplier of ${meta.delayMult}x and +${meta.barrierPen} barrier penalty.`,
      severity: options?.severity || meta.severity,
      lat,
      lng,
      associatedEdgeId: options?.associatedEdgeId,
      associatedNodeId: options?.associatedNodeId,
      reportedAt: timeStr,
      delayMultiplier: meta.delayMult,
      barrierScorePenalty: meta.barrierPen,
      resolved: false
    };
  }
}
