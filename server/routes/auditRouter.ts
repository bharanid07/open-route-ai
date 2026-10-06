import { Router, Request, Response } from 'express';
import { TNAccessibilityScorer } from '../../src/engine/accessibilityScorer';
import { TN_STATE_NODES, TN_HIGHWAY_EDGES, TN_INITIAL_HAZARDS } from '../../src/data/tnGeographicData';

export const auditRouter = Router();

auditRouter.post('/terminal', (req: Request, res: Response) => {
  const { nodeId } = req.body;
  const node = TN_STATE_NODES.find(n => n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: 'Terminal node not found' });
  }

  const report = TNAccessibilityScorer.scoreTerminal(node, TN_INITIAL_HAZARDS);
  return res.json({ status: 'success', data: report });
});

auditRouter.post('/highway', (req: Request, res: Response) => {
  const { edgeId } = req.body;
  const edge = TN_HIGHWAY_EDGES.find(e => e.id === edgeId);

  if (!edge) {
    return res.status(404).json({ error: 'Highway edge not found' });
  }

  const report = TNAccessibilityScorer.scoreHighway(edge, TN_INITIAL_HAZARDS);
  return res.json({ status: 'success', data: report });
});
