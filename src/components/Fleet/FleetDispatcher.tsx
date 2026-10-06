import React from 'react';
import { 
  Truck, 
  Sparkles, 
  ShieldAlert, 
  Battery, 
  Send, 
  CheckCircle2, 
  Package, 
  Leaf, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  Clock,
  Zap,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FleetDispatcher: React.FC = () => {
  const { 
    language,
    fleet, 
    orders, 
    dispatchOrder, 
    currentRoute, 
    setOriginId, 
    setDestinationId 
  } = useApp();

  const isTamil = language === 'ta';

  const handleDispatchOrder = (orderId: string, origin: string, dest: string) => {
    setOriginId(origin);
    setDestinationId(dest);
    dispatchOrder(orderId);
  };

  return (
    <div className="space-y-4">
      {/* 🤖 STATE TRANSPORTATION INTELLIGENCE (Requirement #8) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 p-4 rounded-xl space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <span>{isTamil ? '🤖 மாநில போக்குவரத்து நுண்ணறிவு முடிவு ஆதரவு' : '🤖 STATE TRANSPORTATION INTELLIGENCE'}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                State-level executive decision support synthesizing logistics efficiency, universal accessibility, and risk mitigation.
              </p>
            </div>
          </div>
          <span className="text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800 self-start">
            DEMO / SIMULATED DATA
          </span>
        </div>

        {/* Current Situation Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Logistics Efficiency</span>
              <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">89 / 100</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Universal Accessibility</span>
              <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">84 / 100</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Infrastructure Risk</span>
              <div className="text-base font-extrabold text-sky-400 font-mono mt-0.5">MEDIUM</div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">3 Hotspots</div>
          </div>
        </div>

        {/* AI Priority & Action Plan */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>AI State Priority: "Improve 3 infrastructure blackspots along high-volume freight corridors."</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">1</span>
              <span className="text-slate-200">Upgrade Coimbatore logistics junction & multimodal ramps</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">2</span>
              <span className="text-slate-200">Improve Salem corridor accessibility & railway crossing flyovers</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">3</span>
              <span className="text-slate-200">Add accessible infrastructure near Tiruchirappalli freight depot</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">4</span>
              <span className="text-slate-200">Improve alternate freight connectivity & dynamic rerouting telemetry</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Statewide Logistics KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isTamil ? 'மாநில சரக்கு கடற்படை' : 'Active State Fleet'}</span>
            <Truck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-extrabold text-white">
            {fleet.filter(v => v.status !== 'docked').length} <span className="text-xs font-normal text-slate-500">/ {fleet.length} Units</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
            EV & High-Capacity Freight
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isTamil ? 'நிலுவையிலுள்ள சரக்குகள்' : 'Pending Consignments'}</span>
            <Package className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-lg font-extrabold text-orange-400">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {orders.filter(o => o.priority === 'critical').length} Critical Medical
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isTamil ? 'கரிம உமிழ்வு சேமிப்பு' : 'CO2 Avoided'}</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-emerald-400">
            {currentRoute.carbonSavedVsStandardKg} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">
            vs. Diesel Standard Corridor
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isTamil ? 'சுங்கச்சாவடி தாமதம்' : 'Toll Plaza Wait'}</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-lg font-extrabold text-sky-400 font-mono">
            {currentRoute.tollWaitTotalMinutes} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {currentRoute.tollPlazasTotal} Toll Plazas Crossed
          </div>
        </div>
      </div>

      {/* State-wide Fleet Telemetry Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            {isTamil ? 'தமிழ்நாடு சரக்கு வாகனங்கள் கண்காணிப்பு' : 'State Logistics Fleet Telemetry & Haulers'}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">GPS Corridors Polling</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {fleet.map((vehicle) => {
            const isDelivering = vehicle.status === 'in_transit';
            return (
              <div
                key={vehicle.id}
                className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${vehicle.type === 'electric_semi' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : vehicle.type === 'accessible_ambulance' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    <span className="text-xl">{vehicle.type === 'electric_semi' ? '⚡' : vehicle.type === 'heavy_container_hauler' ? '🚛' : vehicle.type === 'reefer_coldchain' ? '❄️' : '🚑'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{vehicle.code}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full uppercase ${isDelivering ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                      {vehicle.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Capacity: {vehicle.currentPayloadTons}/{vehicle.capacityTons} Tons • Cargo: <span className="text-amber-400">{vehicle.currentCargo || 'Available'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-xs font-mono font-bold text-slate-300">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{vehicle.batteryOrFuelPct}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {vehicle.isZeroEmission ? 'Zero Emission EV' : 'Euro VI Clean'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statewide Order Dispatch Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-orange-400" />
            {isTamil ? 'மாநில சரக்கு அனுப்பும் வரிசை' : 'Inter-District Dispatch Queue'}
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono">Gradient & Toll Optimized</span>
        </div>

        <div className="space-y-2.5">
          {orders.map((order) => {
            const isCritical = order.priority === 'critical';
            const isExpress = order.priority === 'express';
            const isDispatched = order.status === 'dispatched';

            return (
              <div
                key={order.id}
                className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : isExpress ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{order.consignmentNo}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : isExpress ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {order.priority}
                      </span>
                      {order.isColdChain && (
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-full font-medium">
                          ❄️ Cold-Chain Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">
                      {isTamil ? order.cargoNameTamil : order.cargoName}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Weight: {order.weightTons} Tons</span>
                      <span>•</span>
                      <span>ETA: ~{order.etaHours} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isDispatched ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isTamil ? 'பயணத்தில் உள்ளது' : 'In Transit'} ({order.assignedVehicleId})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDispatchOrder(order.id, order.originNodeId, order.destinationNodeId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-700/20 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isTamil ? 'உகந்த பாதையில் அனுப்புக' : 'Dispatch via AI Corridor'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
