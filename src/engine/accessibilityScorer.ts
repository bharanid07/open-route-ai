import { TNNode, TNHighwayEdge, TNHazardIncident } from '../types';

export interface TNAccessibilityAuditReport {
  id: string;
  name: string;
  nameTamil: string;
  district: string;
  type: 'node' | 'highway';
  overallScore: number; // 0 - 100
  complianceGrade: 'AAA (Optimal Universal)' | 'AA (Compliant)' | 'A (Basic Access)' | 'Fail (Major Barrier)';
  complianceGradeTamil: string;
  criteria: {
    title: string;
    titleTamil: string;
    score: number;
    weight: number;
    details: string;
    detailsTamil: string;
    status: 'pass' | 'warning' | 'fail';
  }[];
  terrainAlert?: {
    isHighRisk: boolean;
    maxGradient: number;
    altitudeMeters: number;
    warningMessage: string;
    warningMessageTamil: string;
  };
  recommendations: string[];
  recommendationsTamil: string[];
  activeHazards: TNHazardIncident[];
}

export class TNAccessibilityScorer {

  /**
   * Evaluates a statewide hub, railway junction, or port terminal
   */
  public static scoreTerminal(node: TNNode, hazards: TNHazardIncident[]): TNAccessibilityAuditReport {
    const activeHazards = hazards.filter(h => !h.resolved && h.associatedNodeId === node.id);
    const criteria = [];

    // 1. Vertical Transition (Elevators & Skywalks)
    let elevatorScore = 100;
    if (!node.hasElevator) elevatorScore = 50;
    else if (!node.elevatorWorking) elevatorScore = 15;
    criteria.push({
      title: 'Elevator & Vertical Platform Access',
      titleTamil: 'மின் தூக்கி & தள அணுகல் வசதி',
      score: elevatorScore,
      weight: 0.25,
      details: node.hasElevator ? (node.elevatorWorking ? 'Dual functioning hydraulic lifts' : 'Lift out of service!') : 'Ramps only, no vertical lift',
      detailsTamil: node.hasElevator ? (node.elevatorWorking ? 'இயங்கும் மின்தூக்கி வசதி உள்ளது' : 'மின்தூக்கி பழுதாகியுள்ளது!') : 'மின்தூக்கி வசதி இல்லை',
      status: (elevatorScore >= 80 ? 'pass' : elevatorScore >= 50 ? 'warning' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    // 2. Ramp Slope & Handrails (Target <= 4.0%)
    const rampScore = node.hasRamp ? Math.max(20, Math.round(100 - node.rampSlopePercent * 8)) : 25;
    criteria.push({
      title: 'Low-Gradient Wheelchair Ramp (<= 4.0%)',
      titleTamil: 'சக்கர நாற்காலி சாய்வுதளம் (<= 4.0%)',
      score: rampScore,
      weight: 0.20,
      details: node.hasRamp ? `${node.rampSlopePercent}% gradient slope with dual-height handrails` : 'No continuous ramp access',
      detailsTamil: node.hasRamp ? `${node.rampSlopePercent}% சாய்வு வீதம் மற்றும் கைப்பிடிகள்` : 'சாய்வுதள வசதி இல்லை',
      status: (rampScore >= 75 ? 'pass' : rampScore >= 50 ? 'warning' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    // 3. Tactile Paving & Audio Visual Displays
    const tactileScore = node.hasTactilePaving ? 95 : 25;
    criteria.push({
      title: 'Tactile Ground Indicators & Braille Navigation',
      titleTamil: 'தொடுஉணர்வு தரை வழிகாட்டி & பிரெய்லி பலகை',
      score: tactileScore,
      weight: 0.20,
      details: node.hasTactilePaving ? 'Directional warning blister tiles across all concourses' : 'Missing tactile guidance for blind passengers',
      detailsTamil: node.hasTactilePaving ? 'பார்வையற்றோருக்கான தொடுஉணர்வு தரை ஓடுகள் உள்ளன' : 'தொடுஉணர்வு தரை வழிகாட்டிகள் இல்லை',
      status: (node.hasTactilePaving ? 'pass' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    // 4. Accessible Universal Washrooms
    const restroomScore = node.accessibleRestrooms ? 95 : 20;
    criteria.push({
      title: 'Universal Accessible Restrooms (Disability Act 2016)',
      titleTamil: 'மாற்றுத்திறனாளிகளுக்கான பிரத்யேக கழிப்பறை',
      score: restroomScore,
      weight: 0.15,
      details: node.accessibleRestrooms ? 'Outward swinging doors, grab bars & emergency call button' : 'Non-compliant or narrow restroom doors',
      detailsTamil: node.accessibleRestrooms ? 'அவசர அழைப்பு பொத்தான் மற்றும் கைப்பிடிகள் உள்ளன' : 'சரியான அணுகல் கழிப்பறை இல்லை',
      status: (node.accessibleRestrooms ? 'pass' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    // 5. Battery Buggy Service for Seniors & PwDs
    const buggyScore = node.batteryBuggyService ? 100 : 30;
    criteria.push({
      title: 'Battery Buggy Ferry Assistance (Senior Citizens)',
      titleTamil: 'முதியோருக்கான மின்கல ஊர்தி சேவை',
      score: buggyScore,
      weight: 0.10,
      details: node.batteryBuggyService ? 'Free platform battery car service on call' : 'Long walking distances without motorized assistance',
      detailsTamil: node.batteryBuggyService ? 'இலவச மின்கல ஊர்தி உதவி சேவை இயங்குகிறது' : 'மின்கல ஊர்தி சேவை இல்லை',
      status: (node.batteryBuggyService ? 'pass' : 'warning') as 'pass' | 'warning' | 'fail'
    });

    // 6. Proximity to Tertiary Care Hospital
    let medicalScore = 100;
    if (node.tertiaryHospitalProximityKm > 20) medicalScore = 40;
    else if (node.tertiaryHospitalProximityKm > 8) medicalScore = 70;
    criteria.push({
      title: 'Tertiary Medical Care Access',
      titleTamil: 'உயர் சிறப்பு மருத்துவமனை அருகாமை',
      score: medicalScore,
      weight: 0.10,
      details: `${node.tertiaryHospitalProximityKm}km to nearest multi-specialty government/private medical center`,
      detailsTamil: `அருகிலுள்ள மருத்துவமனை தொலைவு: ${node.tertiaryHospitalProximityKm} கி.மீ`,
      status: (medicalScore >= 80 ? 'pass' : medicalScore >= 60 ? 'warning' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    let overall = criteria.reduce((sum, c) => sum + c.score * c.weight, 0);
    if (activeHazards.length > 0) {
      overall = Math.max(10, overall - 25);
    }
    overall = Math.round(overall);

    let complianceGrade: TNAccessibilityAuditReport['complianceGrade'] = 'AAA (Optimal Universal)';
    let complianceGradeTamil = 'தரம் AAA (முழுமையான அணுகல்தன்மை)';
    if (overall >= 90) {
      complianceGrade = 'AAA (Optimal Universal)';
      complianceGradeTamil = 'தரம் AAA (முழுமையான அணுகல்தன்மை)';
    } else if (overall >= 75) {
      complianceGrade = 'AA (Compliant)';
      complianceGradeTamil = 'தரம் AA (ஏற்றுக்கொள்ளக்கூடிய தரம்)';
    } else if (overall >= 55) {
      complianceGrade = 'A (Basic Access)';
      complianceGradeTamil = 'தரம் A (அடிப்படை வசதி மட்டும்)';
    } else {
      complianceGrade = 'Fail (Major Barrier)';
      complianceGradeTamil = 'தோல்வி (கடுமையான தடைகள் உள்ளன)';
    }

    // Terrain & Altitude warning for Ghat nodes
    let terrainAlert: TNAccessibilityAuditReport['terrainAlert'] = undefined;
    if (node.elevationMeters > 1000 || node.rampSlopePercent > 7.0) {
      terrainAlert = {
        isHighRisk: true,
        maxGradient: node.rampSlopePercent,
        altitudeMeters: node.elevationMeters,
        warningMessage: `High mountain terrain (${node.elevationMeters}m MSL). Low oxygen pressure and steep gradients require advanced wheelchair anchoring and cardiac precautions.`,
        warningMessageTamil: `உயர் மலைப்பகுதி (${node.elevationMeters}மீ உயரம்). குறைந்த காற்றழுத்தம் மற்றும் செங்குத்தான பாதைகள் உள்ளதால் முதியோர் & இதய நோயாளிகள் எச்சரிக்கையுடன் பயணிக்க வேண்டும்.`
      };
    }

    const recommendations = [];
    const recommendationsTamil = [];
    if (!node.hasElevator) {
      recommendations.push('Install hydraulic through-floor lift for wheelchair transit.');
      recommendationsTamil.push('சக்கர நாற்காலி பயணத்திற்கு மின்தூக்கி நிறுவ வேண்டும்.');
    }
    if (!node.hasTactilePaving) {
      recommendations.push('Retrofit bright yellow polyurethane blister pavers along passenger walkways.');
      recommendationsTamil.push('பார்வையற்றோருக்கு மஞ்சள் நிற தொடு வழிகாட்டி ஓடுகளை பதிக்க வேண்டும்.');
    }
    if (!node.batteryBuggyService) {
      recommendations.push('Deploy 2 dedicated EV passenger buggies for senior citizen boarding.');
      recommendationsTamil.push('முதியோருக்காக 2 மின்கல ஊர்திகளை இயக்க வேண்டும்.');
    }

    return {
      id: node.id,
      name: node.name,
      nameTamil: node.nameTamil,
      district: node.district,
      type: 'node',
      overallScore: overall,
      complianceGrade,
      complianceGradeTamil,
      criteria,
      terrainAlert,
      recommendations,
      recommendationsTamil,
      activeHazards
    };
  }

  /**
   * Evaluates highway corridor accessibility & rest stops
   */
  public static scoreHighway(edge: TNHighwayEdge, hazards: TNHazardIncident[]): TNAccessibilityAuditReport {
    const activeHazards = hazards.filter(h => !h.resolved && h.associatedEdgeId === edge.id);
    const criteria = [];

    // 1. Rest Stop Frequency & Accessibility
    const restScore = edge.hasUniversalHighwayRestStops ? 95 : 35;
    criteria.push({
      title: 'Universal Highway Rest Infrastructure',
      titleTamil: 'நெடுஞ்சாலை உலகளாவிய ஓய்வு உட்கட்டமைப்பு',
      score: restScore,
      weight: 0.35,
      details: edge.hasUniversalHighwayRestStops ? `Standardized barrier-free rest stops every ${edge.restStopFrequencyKm}km` : 'Gaps exceeding 60km without accessible facilities',
      detailsTamil: edge.hasUniversalHighwayRestStops ? `ஒவ்வொரு ${edge.restStopFrequencyKm} கி.மீ-க்கும் அணுகக்கூடிய ஓய்வு மையம் உள்ளது` : '60 கி.மீ-க்கு மேல் அணுகல் வசதிகள் இல்லை',
      status: (restScore >= 80 ? 'pass' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    // 2. Slope & Longitudinal Gradient
    let slopeScore = 100;
    if (edge.maxGradientPercent > 8) slopeScore = 25;
    else if (edge.maxGradientPercent > 5) slopeScore = 60;
    criteria.push({
      title: 'Highway Gradient & Slope Safety',
      titleTamil: 'நெடுஞ்சாலை சாய்வு & பாதுகாப்பு தரம்',
      score: slopeScore,
      weight: 0.30,
      details: `${edge.maxGradientPercent}% maximum incline (Ghat standard: safe wheelchair transfer <= 5%)`,
      detailsTamil: `அதிகபட்ச சாய்வு: ${edge.maxGradientPercent}% (பாதுகாப்பான அளவு: <= 5%)`,
      status: (slopeScore >= 80 ? 'pass' : slopeScore >= 50 ? 'warning' : 'fail') as 'pass' | 'warning' | 'fail'
    });

    // 3. Lane Width & Emergency Shoulders
    const laneScore = edge.lanes >= 6 ? 98 : edge.lanes >= 4 ? 88 : 45;
    criteria.push({
      title: 'Carriageway Capacity & Paved Shoulders',
      titleTamil: 'சாலை அகலம் & அவசர கால வழித்தடம்',
      score: laneScore,
      weight: 0.20,
      details: `${edge.lanes}-Lane ${edge.surfaceQuality.replace('_', ' ')} with paved breakdown lane`,
      detailsTamil: `${edge.lanes} வழிப்பாதை மற்றும் அவசர கால தடம்`,
      status: (laneScore >= 80 ? 'pass' : 'warning') as 'pass' | 'warning' | 'fail'
    });

    // 4. Flood Resilience
    const floodScore = edge.isCoastalProneToFlooding ? 50 : 95;
    criteria.push({
      title: 'Monsoon Flood Resilience',
      titleTamil: 'பருவமழை வெள்ளத் தடுப்பு திறன்',
      score: floodScore,
      weight: 0.15,
      details: edge.isCoastalProneToFlooding ? 'Coastal flood risk during cyclone storm surges' : 'Elevated embankment with non-submersible culverts',
      detailsTamil: edge.isCoastalProneToFlooding ? 'புயல் காலங்களில் கடலோர வெள்ளப்பெருக்கு அபாயம் உள்ளது' : 'வெள்ளத்தால் பாதிக்கப்படாத உயர் சாலை',
      status: (floodScore >= 80 ? 'pass' : 'warning') as 'pass' | 'warning' | 'fail'
    });

    let overall = criteria.reduce((sum, c) => sum + c.score * c.weight, 0);
    if (activeHazards.length > 0) overall = Math.max(10, overall - 20);
    overall = Math.round(overall);

    let complianceGrade: TNAccessibilityAuditReport['complianceGrade'] = 'AAA (Optimal Universal)';
    let complianceGradeTamil = 'தரம் AAA';
    if (overall >= 90) complianceGrade = 'AAA (Optimal Universal)';
    else if (overall >= 75) complianceGrade = 'AA (Compliant)';
    else if (overall >= 55) complianceGrade = 'A (Basic Access)';
    else complianceGrade = 'Fail (Major Barrier)';

    let terrainAlert = undefined;
    if (edge.isGhatRoad) {
      terrainAlert = {
        isHighRisk: true,
        maxGradient: edge.maxGradientPercent,
        altitudeMeters: 2240,
        warningMessage: `Severe Ghat Incline (${edge.maxGradientPercent}% slope). Unsuitable for standard wheelchair vans or non-assisted medical transfers.`,
        warningMessageTamil: `கடுமையான மலைப்பாதை (${edge.maxGradientPercent}% சாய்வு). சாதாரண வாகனங்களில் செல்லும் மாற்றுத்திறனாளிகள் சிறப்பு உதவி பெற வேண்டும்.`
      };
    }

    return {
      id: edge.id,
      name: edge.name,
      nameTamil: edge.nameTamil,
      district: 'Inter-District Corridor',
      type: 'highway',
      overallScore: overall,
      complianceGrade,
      complianceGradeTamil,
      criteria,
      terrainAlert,
      recommendations: edge.hasUniversalHighwayRestStops ? [] : ['Mandate construction of 2 accessible highway rest stops with disabled-friendly facilities.'],
      recommendationsTamil: edge.hasUniversalHighwayRestStops ? [] : ['மாற்றுத்திறனாளிகளுக்கான 2 பிரத்யேக நெடுஞ்சாலை ஓய்வு மையங்களை உடனடியாக அமைக்க வேண்டும்.'],
      activeHazards
    };
  }
}
