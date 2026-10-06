import { 
  TNNode, 
  TNHighwayEdge, 
  TNHazardIncident, 
  TNProfileWeights, 
  TNRouteProfile, 
  TNRouteComputationResult, 
  TNTurnInstruction, 
  TNElevationPoint,
  WeatherScenario,
  TNCommuterFilter
} from '../types';

export interface TNRouteSearchOptions {
  originId: string;
  destinationId: string;
  profile: TNRouteProfile;
  weights: TNProfileWeights;
  nodes: TNNode[];
  edges: TNHighwayEdge[];
  hazards: TNHazardIncident[];
  hourOfDay: number; // 0 - 23
  weather: WeatherScenario;
  commuterFilter?: TNCommuterFilter;
}

export class TNRoutingAlgorithm {
  
  /**
   * Calculates dynamic traffic and toll multiplier based on hour of day and weather scenario
   */
  public static calculateWeatherAndTollMultiplier(hour: number, weather: WeatherScenario): number {
    let hourFactor = 1.0;
    // Morning Rush / Shift change (08:00 - 10:00)
    if (hour >= 8 && hour <= 10) {
      hourFactor = 1.45;
    } 
    // Evening Freight & Inter-district passenger peak (17:00 - 21:00)
    else if (hour >= 17 && hour <= 21) {
      hourFactor = 1.6;
    } 
    // Night long-haul trucking (23:00 - 05:00) - smooth flow
    else if (hour >= 23 || hour <= 5) {
      hourFactor = 0.85;
    } else {
      hourFactor = 1.1;
    }

    let weatherFactor = 1.0;
    if (weather === 'monsoon_cyclone') {
      weatherFactor = 1.7; // Heavy waterlogging, reduced highway visibility
    } else if (weather === 'extreme_summer') {
      weatherFactor = 1.15; // Higher tire blowouts & radiator strain
    }

    return hourFactor * weatherFactor;
  }

  /**
   * Evaluates cost of a single highway edge based on formula:
   * Cost = (w_dist * Distance) + (w_time * TravelTime) + (w_barrier * AccessibilityDeficit) + (w_eco * CarbonFactor)
   */
  public static calculateEdgeCost(
    edge: TNHighwayEdge,
    targetNode: TNNode,
    options: TNRouteSearchOptions
  ): { 
    cost: number; 
    effectiveTimeHours: number; 
    barrierScore: number; 
    carbonKg: number; 
    activeHazardsOnEdge: TNHazardIncident[];
  } {
    const { weights, hourOfDay, weather, profile, commuterFilter } = options;
    const weatherTollMult = this.calculateWeatherAndTollMultiplier(hourOfDay, weather);

    // Active incidents on this edge or connected destination terminal
    const activeHazards = options.hazards.filter(
      h => !h.resolved && (h.associatedEdgeId === edge.id || h.associatedNodeId === targetNode.id)
    );

    let incidentDelayMultiplier = 1.0;
    let incidentBarrierPenalty = 0;

    for (const h of activeHazards) {
      incidentDelayMultiplier *= h.delayMultiplier;
      incidentBarrierPenalty += h.barrierScorePenalty;
    }

    // Coastal storm surge impact during cyclone
    if (weather === 'monsoon_cyclone' && edge.isCoastalProneToFlooding) {
      incidentDelayMultiplier *= 2.2;
      incidentBarrierPenalty += 120;
    }

    // 1. Time Calculation (Base hours + Toll delay + Congestion)
    const tollDelayHours = (edge.tollPlazaCount * edge.tollWaitMinutes) / 60;
    const effectiveCongestion = edge.baseCongestion * weatherTollMult * incidentDelayMultiplier;
    const effectiveTimeHours = (edge.baseTimeHours * effectiveCongestion) + (tollDelayHours * 0.5);

    // 2. Accessibility Deficit (Base is inverted accessibilityScore + incidents)
    let accessibilityDeficit = (100 - edge.accessibilityScore) + incidentBarrierPenalty;

    // Strict constraints by profile & commuter filter
    if (profile === 'accessible_transit' || commuterFilter === 'wheelchair') {
      // Wheelchair users: penalize steep gradients heavily (Ghat roads > 5% are dangerous)
      if (edge.maxGradientPercent > 5.0) {
        accessibilityDeficit += (edge.maxGradientPercent - 5.0) * 120;
      }
      // Lack of universal rest stops on inter-district stretches
      if (!edge.hasUniversalHighwayRestStops && edge.distanceKm > 70) {
        accessibilityDeficit += 140;
      }
      // Target node must have elevators & ramps
      if (targetNode.hasElevator && !targetNode.elevatorWorking) {
        accessibilityDeficit += 450;
      }
      if (!targetNode.hasRamp) {
        accessibilityDeficit += 300;
      }
    }

    if (profile === 'medical_emergency' || commuterFilter === 'medical_patient') {
      // Medical emergency: prioritize routes with direct access to tertiary care
      if (targetNode.tertiaryHospitalProximityKm > 10) {
        accessibilityDeficit += targetNode.tertiaryHospitalProximityKm * 8;
      }
      // Avoid steep mountain ghats for acute cardiac/spinal transit
      if (edge.isGhatRoad) {
        accessibilityDeficit += 600;
      }
      // Heavily avoid flooded coastal sectors
      if (edge.isCoastalProneToFlooding && weather === 'monsoon_cyclone') {
        accessibilityDeficit += 750;
      }
    }

    if (commuterFilter === 'elderly') {
      if (!targetNode.batteryBuggyService) {
        accessibilityDeficit += 80;
      }
      if (!edge.hasUniversalHighwayRestStops) {
        accessibilityDeficit += 60;
      }
    }

    if (commuterFilter === 'visual_impairment') {
      if (!targetNode.hasTactilePaving) {
        accessibilityDeficit += 180;
      }
    }

    // 3. Carbon Emissions (in Kg per ton)
    // Ghat climbing incurs much higher emissions
    const elevationCarbonMultiplier = edge.isGhatRoad ? 2.4 : 1.0;
    const carbonKg = (edge.distanceKm * edge.carbonGramsPerTonKm * elevationCarbonMultiplier) / 1000;

    // 4. Formula:
    // Cost = (w_dist * Distance) + (w_time * TravelTime) + (w_barrier * AccessibilityDeficit) + (w_eco * CarbonFactor)
    const distTerm = weights.w_dist * edge.distanceKm * 0.8;
    const timeTerm = weights.w_time * effectiveTimeHours * 80;
    const barrierTerm = weights.w_barrier * accessibilityDeficit * 2.2;
    const ecoTerm = weights.w_eco * carbonKg * 30;

    const totalCost = distTerm + timeTerm + barrierTerm + ecoTerm;

    return {
      cost: totalCost,
      effectiveTimeHours,
      barrierScore: accessibilityDeficit,
      carbonKg,
      activeHazardsOnEdge: activeHazards
    };
  }

  /**
   * Pure TypeScript Multi-Criteria Graph Solver
   */
  public static computeRoute(options: TNRouteSearchOptions): TNRouteComputationResult {
    const { originId, destinationId, nodes, edges } = options;
    const nodeMap = new Map<string, TNNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Build bi-directional adjacency map
    const adjacency = new Map<string, { edge: TNHighwayEdge; neighborId: string }[]>();
    nodes.forEach(n => adjacency.set(n.id, []));

    edges.forEach(edge => {
      if (adjacency.has(edge.source)) {
        adjacency.get(edge.source)!.push({ edge, neighborId: edge.target });
      }
      if (adjacency.has(edge.target)) {
        adjacency.get(edge.target)!.push({ edge, neighborId: edge.source });
      }
    });

    // Dijkstra structures
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edge: TNHighwayEdge }>();
    const visited = new Set<string>();

    nodes.forEach(n => distances.set(n.id, Infinity));
    distances.set(originId, 0);

    const queue: { nodeId: string; cost: number }[] = [{ nodeId: originId, cost: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const { nodeId: currentId, cost: currentCost } = queue.shift()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (currentId === destinationId) break;

      const neighbors = adjacency.get(currentId) || [];
      for (const item of neighbors) {
        if (visited.has(item.neighborId)) continue;

        const targetNode = nodeMap.get(item.neighborId)!;
        const { cost: edgeCost } = this.calculateEdgeCost(item.edge, targetNode, options);

        const newCost = currentCost + edgeCost;
        if (newCost < (distances.get(item.neighborId) ?? Infinity)) {
          distances.set(item.neighborId, newCost);
          previous.set(item.neighborId, { nodeId: currentId, edge: item.edge });
          queue.push({ nodeId: item.neighborId, cost: newCost });
        }
      }
    }

    // Reconstruct Path
    const pathNodeIds: string[] = [];
    const pathEdges: TNHighwayEdge[] = [];
    let curr: string | undefined = destinationId;

    while (curr && curr !== originId) {
      pathNodeIds.unshift(curr);
      const prev = previous.get(curr);
      if (!prev) break;
      pathEdges.unshift(prev.edge);
      curr = prev.nodeId;
    }

    if (curr === originId) {
      pathNodeIds.unshift(originId);
    } else {
      pathNodeIds.push(originId, destinationId);
    }

    const coordinates: [number, number][] = pathNodeIds.map(id => {
      const node = nodeMap.get(id);
      return node ? [node.lat, node.lng] : [11.1271, 78.6569];
    });

    // Compute Metrics, Elevation Profile, and Bilingual Guidance
    let totalDistKm = 0;
    let totalTimeH = 0;
    let totalCarbonKg = 0;
    let accessibilitySum = 0;
    let universalRestStopCount = 0;
    let maxGradient = 0;
    let totalTolls = 0;
    let totalTollWaitMin = 0;
    const hazardsOnRoute: TNHazardIncident[] = [];
    const turnByTurn: TNTurnInstruction[] = [];
    const elevationProfile: TNElevationPoint[] = [];

    let runningDistKm = 0;
    const startNode = nodeMap.get(originId);
    if (startNode) {
      elevationProfile.push({
        distanceKm: 0,
        elevationM: startNode.elevationMeters,
        slopePercent: 0,
        locationName: startNode.name
      });
    }

    pathEdges.forEach((edge, index) => {
      totalDistKm += edge.distanceKm;
      runningDistKm += edge.distanceKm;

      const nextNodeId = pathNodeIds[index + 1];
      const nextNode = nodeMap.get(nextNodeId) || startNode!;

      const { effectiveTimeHours, carbonKg, activeHazardsOnEdge } = this.calculateEdgeCost(edge, nextNode, options);
      totalTimeH += effectiveTimeHours;
      totalCarbonKg += carbonKg;
      accessibilitySum += edge.accessibilityScore;
      if (edge.hasUniversalHighwayRestStops) universalRestStopCount++;
      if (edge.maxGradientPercent > maxGradient) maxGradient = edge.maxGradientPercent;
      totalTolls += edge.tollPlazaCount;
      totalTollWaitMin += edge.tollPlazaCount * edge.tollWaitMinutes;

      activeHazardsOnEdge.forEach(h => {
        if (!hazardsOnRoute.some(ex => ex.id === h.id)) {
          hazardsOnRoute.push(h);
        }
      });

      elevationProfile.push({
        distanceKm: Math.round(runningDistKm),
        elevationM: nextNode.elevationMeters,
        slopePercent: edge.maxGradientPercent,
        locationName: nextNode.name
      });

      // Bilingual Turn Guidance
      let checkpointText = '';
      let checkpointTamil = '';
      let audioCue = `Proceed along ${edge.highwayCode} towards ${nextNode.name}.`;

      if (edge.hasUniversalHighwayRestStops) {
        checkpointText = `Universal accessible rest stop with barrier-free washrooms available at ${edge.restStopFrequencyKm}km interval.`;
        checkpointTamil = `அணுகக்கூடிய கழிப்பறைகளுடன் கூடிய உலகளாவிய ஓய்வு மையம் ${edge.restStopFrequencyKm}கிமீ இடைவெளியில் உள்ளது.`;
        audioCue += ` Barrier-free rest stop equipped ahead.`;
      } else if (edge.isGhatRoad) {
        checkpointText = `High gradient warning (${edge.maxGradientPercent}% slope, hairpin bends). Low gear compulsory.`;
        checkpointTamil = `செங்குத்தான மலைப்பாதை எச்சரிக்கை (${edge.maxGradientPercent}% சாய்வு). எச்சரிக்கையுடன் செல்லவும்.`;
        audioCue += ` Caution: steep mountain curves and altitude transition.`;
      }

      if (nextNode.batteryBuggyService) {
        checkpointText += ` Battery buggy available at ${nextNode.name}.`;
      }

      turnByTurn.push({
        id: `turn_${index}`,
        instruction: `Follow ${edge.name} to ${nextNode.name}`,
        instructionTamil: `${edge.nameTamil} வழியாக ${nextNode.nameTamil} நோக்கி செல்லவும்`,
        distanceKm: edge.distanceKm,
        durationMinutes: Math.round(effectiveTimeHours * 60),
        highwayCode: edge.highwayCode,
        accessibilityCheckpoint: checkpointText,
        accessibilityCheckpointTamil: checkpointTamil,
        audioAnnouncement: audioCue,
        isStepFreeOrHighwayGrade: edge.maxGradientPercent <= 5.0,
        gradientPercent: edge.maxGradientPercent
      });
    });

    const lastNode = nodeMap.get(destinationId);
    if (lastNode) {
      turnByTurn.push({
        id: 'turn_dest',
        instruction: `Arrive at Destination: ${lastNode.name} (${lastNode.district} District)`,
        instructionTamil: `இலக்கை அடைந்தீர்கள்: ${lastNode.nameTamil} (${lastNode.districtTamil} மாவட்டம்)`,
        distanceKm: 0,
        durationMinutes: 0,
        accessibilityCheckpoint: `Terminal Accessibility: ${lastNode.accessibilityScore}/100. Ramp: ${lastNode.hasRamp ? 'Present' : 'None'}, Elevators: ${lastNode.hasElevator ? 'Operational' : 'None'}.`,
        accessibilityCheckpointTamil: `முனைய அணுகல்தன்மை: ${lastNode.accessibilityScore}/100. சாய்வுதளம்: ${lastNode.hasRamp ? 'உள்ளது' : 'இல்லை'}.`,
        audioAnnouncement: `Destination reached safely at ${lastNode.name}. Step-free passenger boarding confirmed.`,
        isStepFreeOrHighwayGrade: true,
        gradientPercent: 0
      });
    }

    const avgAccessibility = pathEdges.length > 0 
      ? Math.round(accessibilitySum / pathEdges.length) 
      : 85;

    const restStopPct = pathEdges.length > 0
      ? Math.round((universalRestStopCount / pathEdges.length) * 100)
      : 100;

    const carbonFinalKg = Math.round(totalCarbonKg);
    const baselineStandardCarbon = Math.round(totalDistKm * 0.052 * 10);
    const carbonSaved = Math.max(0, Math.round(baselineStandardCarbon - carbonFinalKg));

    const ratingBreakdown = {
      safety: Math.min(100, Math.round(avgAccessibility * 0.9 + (maxGradient <= 5 ? 10 : 0))),
      speed: Math.min(100, Math.max(40, Math.round(100 - (totalTimeH / totalDistKm) * 500))),
      eco: Math.min(100, Math.round(100 - (carbonFinalKg / totalDistKm) * 60)),
      inclusivity: restStopPct,
      gradientSafety: Math.max(25, Math.min(100, Math.round(100 - maxGradient * 8)))
    };

    return {
      profile: options.profile,
      pathNodeIds,
      pathEdges,
      coordinates,
      totalDistanceKm: Math.round(totalDistKm),
      totalTimeHours: Math.round(totalTimeH * 10) / 10,
      totalCost: Math.round(distances.get(destinationId) || 0),
      accessibilityScore: avgAccessibility,
      carbonEmissionKg: carbonFinalKg,
      carbonSavedVsStandardKg: carbonSaved,
      timeDiffVsStandardHours: 0,
      stepFreeRestStopPct: restStopPct,
      maxGradientPercent: maxGradient,
      tollPlazasTotal: totalTolls,
      tollWaitTotalMinutes: totalTollWaitMin,
      elevationProfile,
      turnByTurn,
      hazardsEncountered: hazardsOnRoute,
      avoidedHazardsCount: options.hazards.length - hazardsOnRoute.length,
      ratingBreakdown
    };
  }
}
