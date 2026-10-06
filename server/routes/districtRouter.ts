import { Router, Request, Response } from 'express';
import { TN_DISTRICT_SCORECARDS } from '../../src/data/tnGeographicData';

export const districtRouter = Router();

districtRouter.get('/scorecards', (req: Request, res: Response) => {
  return res.json({
    status: 'success',
    count: TN_DISTRICT_SCORECARDS.length,
    data: TN_DISTRICT_SCORECARDS
  });
});

districtRouter.post('/budget-simulate', (req: Request, res: Response) => {
  const { capitalCrores = 35 } = req.body;
  const budget = Number(capitalCrores);

  const totalCovered = Math.min(
    TN_DISTRICT_SCORECARDS.length,
    Math.round((budget / 50) * TN_DISTRICT_SCORECARDS.length) + 2
  );
  const restStopsAdded = Math.round(budget * 0.8);
  const equityGain = Math.round(budget * 0.35);
  const citizensBenefitedLakhs = Math.round(budget * 1.8 * 10) / 10;

  return res.json({
    status: 'success',
    data: {
      budgetAllocatedCrores: budget,
      targetedDistrictsCount: totalCovered,
      newUniversalRestStops: restStopsAdded,
      projectedEquityIndexGain: equityGain,
      citizensBenefitedLakhs
    }
  });
});
