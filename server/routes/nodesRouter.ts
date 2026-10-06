import { Router, Request, Response } from 'express';
import { TN_STATE_NODES, TN_HIGHWAY_EDGES } from '../../src/data/tnGeographicData';

export const nodesRouter = Router();

nodesRouter.get('/', (req: Request, res: Response) => {
  const { category, district } = req.query;
  let filteredNodes = TN_STATE_NODES;

  if (category) {
    filteredNodes = filteredNodes.filter(n => n.category === category);
  }
  if (district) {
    filteredNodes = filteredNodes.filter(n => n.district.toLowerCase() === String(district).toLowerCase());
  }

  return res.json({
    status: 'success',
    count: filteredNodes.length,
    data: filteredNodes
  });
});

nodesRouter.get('/highways', (req: Request, res: Response) => {
  const { code } = req.query;
  let filteredEdges = TN_HIGHWAY_EDGES;

  if (code) {
    filteredEdges = filteredEdges.filter(e => e.highwayCode === code);
  }

  return res.json({
    status: 'success',
    count: filteredEdges.length,
    data: filteredEdges
  });
});

nodesRouter.get('/:id', (req: Request, res: Response) => {
  const node = TN_STATE_NODES.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ error: 'Node not found' });
  }
  return res.json({ status: 'success', data: node });
});
