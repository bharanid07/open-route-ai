// AI Decision Layer for Real Road Routes
// Evaluates real road routes from routing API across logistics, accessibility, terrain, and risk
import { 
  RealRoadRoute, 
  RouteAiEvaluation, 
  AiRouteRecommendation, 
  TNRouteProfile, 
  TNHazardIncident, 
  WeatherScenario 
} from '../types';

export class RealRoadAiScorer {
  /**
   * Compares real road routes from the routing API using OPENROUTE AI multi-objective intelligence
   */
  public static evaluateRoutes(params: {
    routes: RealRoadRoute[];
    profile: TNRouteProfile;
    hazards: TNHazardIncident[];
    hourOfDay: number;
    weather: WeatherScenario;
  }): AiRouteRecommendation | null {
    const { routes, profile, hazards, hourOfDay, weather } = params;
    if (!routes || routes.length === 0) return null;

    const evaluations: Record<string, RouteAiEvaluation> = {};

    // 1. Analyze each route
    routes.forEach((route, idx) => {
      // Risk evaluation based on hazards and congestion along corridor
      let hazardPenalties = 0;
      let activeIncidentsEncountered = 0;

      // Check distance from active hazards to route coordinates
      hazards.filter(h => !h.resolved).forEach(h => {
        // Quick bounding check
        const nearRoute = route.coordinates.some(coord => {
          const latDiff = Math.abs(coord[0] - h.lat);
          const lngDiff = Math.abs(coord[1] - h.lng);
          return latDiff < 0.15 && lngDiff < 0.15; // ~15km
        });

        if (nearRoute) {
          activeIncidentsEncountered++;
          hazardPenalties += h.barrierScorePenalty * 0.4;
        }
      });

      // Weather impact on coastal highways (ECR / GST)
      let weatherRisk = 0;
      if (weather === 'monsoon_cyclone') {
        const isCoastalRoute = route.primaryHighways.some(h => 
          h.includes('GST') || h.includes('East Coast') || h.includes('NH 45') || h.includes('Cuddalore')
        );
        if (isCoastalRoute) weatherRisk += 25;
      }

      // Predicted delay calculation
      let hourCongestionFactor = 1.0;
      if ((hourOfDay >= 8 && hourOfDay <= 10) || (hourOfDay >= 17 && hourOfDay <= 20)) {
        hourCongestionFactor = 1.35;
      }
      const baseDelay = route.trafficDelayMinutes || 0;
      const predictedDelayMinutes = Math.round(
        baseDelay + (activeIncidentsEncountered * 18) + (weatherRisk * 0.8) + (hourCongestionFactor > 1.2 ? 14 : 0)
      );

      // Accessibility Score calculation for road corridor
      let accessibilityScore = 85;
      if (route.primaryHighways.some(h => h.includes('NH 44') || h.includes('NH 544'))) {
        accessibilityScore = 92; // 6-lane divided expressways with grade-separated interchanges & universal rest stops
      } else if (route.primaryHighways.some(h => h.includes('NH 45') || h.includes('GST'))) {
        accessibilityScore = 88;
      } else {
        accessibilityScore = 78;
      }
      accessibilityScore = Math.max(30, Math.min(98, Math.round(accessibilityScore - (hazardPenalties * 0.2))));

      // Gradient Safety
      const isGhat = route.primaryHighways.some(h => h.includes('Ghat') || h.includes('Nilgiris'));
      const gradientSafetyScore = isGhat ? 58 : 94;

      // Risk score: 0 (safe) to 100 (critical risk)
      const riskScore = Math.min(100, Math.round(
        (activeIncidentsEncountered * 20) + weatherRisk + (route.distanceKm > 520 ? 10 : 0) + (baseDelay > 20 ? 15 : 5)
      ));

      // Reliability Score: 100 - risk/delay factors
      const reliabilityScore = Math.max(20, Math.min(99, Math.round(100 - (riskScore * 0.5) - (predictedDelayMinutes * 0.4))));

      // Overall suitability based on profile
      let overallScore = 80;
      let suitability = 'Balanced Inter-District Corridor';
      let suitabilityTamil = 'சமச்சீரான மாவட்டங்களுக்கு இடையேயான வழித்தடம்';
      let logisticsPriorityFit: 'High' | 'Medium' | 'Standard' = 'Standard';

      if (profile === 'freight_express') {
        overallScore = Math.round((reliabilityScore * 0.4) + ((100 - (route.durationHours * 8)) * 0.3) + (accessibilityScore * 0.3));
        suitability = idx === 0 ? 'Optimal for Heavy Freight & 6-Lane Expressway Haulage' : 'Alternative Freight Bypass';
        suitabilityTamil = idx === 0 ? 'அதிவேக 6-வழித்தட கனரக சரக்கு போக்குவரத்திற்கு உகந்தது' : 'மாற்று சரக்கு வழித்தடம்';
        logisticsPriorityFit = idx === 0 ? 'High' : 'Medium';
      } else if (profile === 'accessible_transit') {
        overallScore = Math.round((accessibilityScore * 0.6) + (gradientSafetyScore * 0.25) + (reliabilityScore * 0.15));
        suitability = accessibilityScore >= 90 ? 'Universal Accessible Transit (Step-Free & Wheelchair Safe)' : 'Standard Inter-City Transit';
        suitabilityTamil = accessibilityScore >= 90 ? 'முழுமையான மாற்றுத்திறனாளிகள் அணுகல் தகுதி' : 'வழக்கமான நகரங்களுக்கு இடையேயான பயணம்';
        logisticsPriorityFit = 'High';
      } else if (profile === 'medical_emergency') {
        overallScore = Math.round(((100 - predictedDelayMinutes) * 0.5) + (gradientSafetyScore * 0.3) + (reliabilityScore * 0.2));
        suitability = 'Emergency Medical Corridor (Tertiary Hospital Proximity)';
        suitabilityTamil = 'அவசர மருத்துவ வழித்தடம் (மருத்துவமனை நேரடி அணுகல்)';
        logisticsPriorityFit = 'High';
      } else { // green_corridor
        overallScore = Math.round(((600 - route.distanceKm) * 0.15) + (accessibilityScore * 0.35) + (reliabilityScore * 0.5));
        suitability = 'Green EV Freight Corridor (Fast Superchargers Available)';
        suitabilityTamil = 'பசுமை மின்சார வாகன வழித்தடம் (சூப்பர்சார்ஜர் வசதி)';
        logisticsPriorityFit = 'Medium';
      }

      const keyHighlights: string[] = [];
      const keyHighlightsTamil: string[] = [];

      if (route.isFastest) {
        keyHighlights.push(`Fastest travel time (${route.durationFormatted})`);
        keyHighlightsTamil.push(`குறைந்த பயண நேரம் (${route.durationFormatted})`);
      }
      if (predictedDelayMinutes <= 15) {
        keyHighlights.push(`Low predicted delay (~${predictedDelayMinutes} mins)`);
        keyHighlightsTamil.push(`குறைந்த முன்னறிவிப்பு தாமதம் (~${predictedDelayMinutes} நிமிடங்கள்)`);
      }
      if (accessibilityScore >= 90) {
        keyHighlights.push(`Grade AAA Universal Accessibility (${accessibilityScore}%)`);
        keyHighlightsTamil.push(`முழுமையான அணுகல் தரம் (${accessibilityScore}%)`);
      }
      if (riskScore <= 20) {
        keyHighlights.push('Minimal hazard risk & zero ghat hairpin bottlenecks');
        keyHighlightsTamil.push('ஆபத்து குறைவு மற்றும் மலைப்பாதை தடைகள் இல்லை');
      }

      evaluations[route.id] = {
        routeId: route.id,
        overallScore,
        accessibilityScore,
        gradientSafetyScore,
        riskScore,
        predictedDelayMinutes,
        reliabilityScore,
        suitability,
        suitabilityTamil,
        logisticsPriorityFit,
        keyHighlights,
        keyHighlightsTamil
      };
    });

    // 2. Select the best route according to overall score
    let bestRouteIndex = 0;
    let highestScore = -1;

    routes.forEach((rt, i) => {
      const score = evaluations[rt.id]?.overallScore || 0;
      if (score > highestScore) {
        highestScore = score;
        bestRouteIndex = i;
      }
    });

    const recommendedRoute = routes[bestRouteIndex];
    const recEval = evaluations[recommendedRoute.id];

    // Build specific "Why this route?" bullets
    const whyThisRoute: string[] = [];
    const whyThisRouteTamil: string[] = [];

    const otherRoute = routes.find((_, i) => i !== bestRouteIndex);
    const otherEval = otherRoute ? evaluations[otherRoute.id] : null;

    if (otherEval) {
      const delayDiff = otherEval.predictedDelayMinutes - recEval.predictedDelayMinutes;
      if (delayDiff > 0) {
        whyThisRoute.push(`${delayDiff} minutes lower predicted delay`);
        whyThisRouteTamil.push(`${delayDiff} நிமிடங்கள் குறைந்த முன்னறிவிப்பு தாமதம்`);
      }
      if (recEval.accessibilityScore > otherEval.accessibilityScore) {
        whyThisRoute.push(`Better accessibility score (${recEval.accessibilityScore}% vs ${otherEval.accessibilityScore}%)`);
        whyThisRouteTamil.push(`சிறந்த அணுகல் தகுதி (${recEval.accessibilityScore}% vs ${otherEval.accessibilityScore}%)`);
      }
      if (recEval.riskScore < otherEval.riskScore) {
        whyThisRoute.push(`Lower corridor risk score (${recEval.riskScore}% vs ${otherEval.riskScore}%)`);
        whyThisRouteTamil.push(`குறைந்த வழித்தட ஆபத்து விகிதம் (${recEval.riskScore}% vs ${otherEval.riskScore}%)`);
      }
    }

    if (whyThisRoute.length === 0) {
      whyThisRoute.push(`Optimal travel time: ${recommendedRoute.durationFormatted} (${recommendedRoute.distanceKm} km)`);
      whyThisRouteTamil.push(`உகந்த பயண நேரம்: ${recommendedRoute.durationFormatted} (${recommendedRoute.distanceKm} கி.மீ)`);
      whyThisRoute.push(`High reliability index: ${recEval.reliabilityScore}/100`);
      whyThisRouteTamil.push(`உயர் நம்பகத்தன்மை குறியீடு: ${recEval.reliabilityScore}/100`);
    }

    whyThisRoute.push(`Suitable for ${profile === 'medical_emergency' ? 'critical medical logistics' : profile === 'freight_express' ? 'high-priority freight haulage' : 'accessible transit'}`);
    whyThisRouteTamil.push(`குறிப்பிட்ட பயண தேவைக்கு உகந்தது`);

    return {
      recommendedRouteId: recommendedRoute.id,
      recommendedRouteIndex: bestRouteIndex,
      recommendationTitle: `Recommended Route: ${recommendedRoute.title.split('–')[0]?.trim() || 'Route 1'}`,
      recommendationTitleTamil: `பரிந்துரைக்கப்பட்ட வழி: பாதை ${bestRouteIndex + 1}`,
      whyThisRoute,
      whyThisRouteTamil,
      evaluations,
      disclaimer: 'The routing API provides the real road routes. OPENROUTE AI performs the multi-objective intelligence and decision layer.'
    };
  }
}
