import { Router, Request, Response } from 'express';
import { TN_INITIAL_HAZARDS } from '../../src/data/tnGeographicData';
import { TNPredictiveTrafficEngine } from '../../src/engine/predictiveTraffic';
import { TNHazardIncident, TNHazardType } from '../../src/types';

export const hazardsRouter = Router();

// In-memory state
let currentHazards: TNHazardIncident[] = [...TN_INITIAL_HAZARDS];

hazardsRouter.get('/', (req: Request, res: Response) => {
  const { activeOnly } = req.query;
  const list = activeOnly === 'true' 
    ? currentHazards.filter(h => !h.resolved) 
    : currentHazards;

  return res.json({
    status: 'success',
    count: list.length,
    data: list
  });
});

hazardsRouter.post('/spawn', (req: Request, res: Response) => {
  const { type, lat, lng, title, titleTamil, associatedEdgeId, associatedNodeId } = req.body;

  if (!type || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'type, lat, and lng are required.' });
  }

  const newHazard = TNPredictiveTrafficEngine.createDisruption(
    type as TNHazardType,
    Number(lat),
    Number(lng),
    {
      title,
      titleTamil,
      associatedEdgeId,
      associatedNodeId
    }
  );

  currentHazards.unshift(newHazard);

  return res.status(201).json({
    status: 'success',
    message: 'Disruption incident spawned on Tamil Nadu network.',
    data: newHazard
  });
});

hazardsRouter.post('/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const hazard = currentHazards.find(h => h.id === id);

  if (!hazard) {
    return res.status(404).json({ error: 'Hazard not found' });
  }

  hazard.resolved = true;

  return res.json({
    status: 'success',
    message: 'Hazard marked resolved. Corridor restored.',
    data: hazard
  });
});
