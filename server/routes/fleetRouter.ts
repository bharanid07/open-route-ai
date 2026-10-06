import { Router, Request, Response } from 'express';
import { TN_FLEET_VEHICLES, TN_STATE_ORDERS } from '../../src/data/tnGeographicData';
import { TNStateVehicle, TNOrder } from '../../src/types';

export const fleetRouter = Router();

let currentFleet: TNStateVehicle[] = [...TN_FLEET_VEHICLES];
let currentOrders: TNOrder[] = [...TN_STATE_ORDERS];

fleetRouter.get('/', (req: Request, res: Response) => {
  return res.json({
    status: 'success',
    data: {
      vehicles: currentFleet,
      orders: currentOrders
    }
  });
});

fleetRouter.post('/dispatch', (req: Request, res: Response) => {
  const { orderId, vehicleId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const order = currentOrders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const assignedVehicleId = vehicleId || currentFleet.find(v => v.status === 'active')?.id || 'veh_tn_01';
  const vehicle = currentFleet.find(v => v.id === assignedVehicleId);

  order.status = 'dispatched';
  order.assignedVehicleId = assignedVehicleId;

  if (vehicle) {
    vehicle.status = 'in_transit';
    vehicle.currentCargo = order.cargoName;
  }

  return res.json({
    status: 'success',
    message: 'Consignment successfully dispatched with accessible last-mile compliance.',
    data: {
      order,
      vehicle
    }
  });
});
