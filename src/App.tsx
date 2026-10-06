import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navigation/Navbar';
import { RoutingControls } from './components/Controls/RoutingControls';
import { MapView } from './components/Map/MapView';
import { AiAlertBanner } from './components/Incidents/AiAlertBanner';
import { TelemetryDrawer } from './components/Analytics/TelemetryDrawer';
import { FleetDispatcher } from './components/Fleet/FleetDispatcher';
import { CommuterView } from './components/Commuter/CommuterView';
import { PlannerView } from './components/Planner/PlannerView';
import { AuditModal } from './components/Accessibility/AuditModal';
import { AiCopilotDrawer } from './components/AI/AiCopilotDrawer';
import { LoginModal } from './components/Auth/LoginModal';
import { LiveWeatherModal } from './components/Weather/LiveWeatherModal';
import { Navigation, Truck, Accessibility, Building2, X } from 'lucide-react';
import { TNPersonaType } from './types';

const DashboardContent: React.FC = () => {
  const { 
    persona, 
    setPersona, 
    language, 
    isAuthModalOpen, 
    setIsAuthModalOpen,
    viewLayout,
    setViewLayout
  } = useApp();
  const isTamil = language === 'ta';
  const [isPlannerOpen, setIsPlannerOpen] = useState<boolean>(true);

  const personas: { id: TNPersonaType; label: string; labelTamil: string; icon: React.ReactNode }[] = [
    { 
      id: 'commander', 
      label: 'Logistics Commander (Fleet & Freight)', 
      labelTamil: 'சரக்கு மேலாண்மை',
      icon: <Truck className="w-4 h-4" />
    },
    { 
      id: 'navigator', 
      label: 'Accessible Commuter (Step-Free & Lifts)', 
      labelTamil: 'பாதுகாப்பான அணுகல் பயணம்',
      icon: <Accessibility className="w-4 h-4" />
    },
    { 
      id: 'planner', 
      label: 'State Policy & 38-District Infrastructure', 
      labelTamil: '38 மாவட்ட உட்கட்டமைப்பு',
      icon: <Building2 className="w-4 h-4" />
    }
  ];

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar 
        viewLayout={viewLayout} 
        setViewLayout={setViewLayout} 
        isPlannerOpen={isPlannerOpen}
        setIsPlannerOpen={setIsPlannerOpen}
      />

      {/* Dynamic AI Rerouting / Incident Alert Banner */}
      <AiAlertBanner />

      {/* Main Workspace Body */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* VIEW MODE 1: STATE MAP (Clean, spacious, hero map) */}
        {viewLayout === 'map' && (
          <div className="relative w-full h-full flex flex-col">
            {/* Map Canvas */}
            <div className="flex-1 relative w-full h-full">
              <MapView />

              {/* Floating Route Planner Drawer / Card */}
              {isPlannerOpen ? (
                <div className="absolute top-4 left-4 z-[1050] max-w-[calc(100vw-2rem)]">
                  <RoutingControls 
                    isFloating={true} 
                    onClose={() => setIsPlannerOpen(false)} 
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsPlannerOpen(true)}
                  className="absolute top-4 left-4 z-[1050] flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs transition-all hover:scale-105 active:scale-95 border border-amber-400/40"
                  title="Open Route Planner"
                >
                  <Navigation className="w-4 h-4 text-white transform -rotate-45" />
                  <span>{isTamil ? 'வழித்தட திட்டம்' : 'Plan Corridor'}</span>
                </button>
              )}
            </div>

            {/* Bottom Collapsible Telemetry Bar */}
            <TelemetryDrawer />
          </div>
        )}

        {/* VIEW MODE 2: FULL OPERATIONS DASHBOARD (Spacious, organized) */}
        {viewLayout === 'dashboard' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
            {/* Persona Switcher Sub-header */}
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isTamil ? 'செயல்பாட்டு மையம்:' : 'Operations View:'}
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {personas.map((p) => {
                    const isActive = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        {p.icon}
                        <span>{isTamil ? p.labelTamil : p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setViewLayout('map')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 transform -rotate-45" />
                <span>{isTamil ? 'வரைபடத்திற்கு செல்' : 'Back to Map'}</span>
              </button>
            </div>

            {/* Persona Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
              <div className="max-w-7xl mx-auto">
                {persona === 'commander' && <FleetDispatcher />}
                {persona === 'navigator' && <CommuterView />}
                {persona === 'planner' && <PlannerView />}
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: SPLIT VIEW (Side-by-side) */}
        {viewLayout === 'split' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col lg:flex-row relative h-full overflow-hidden">
              {/* Left Side: Map with compact route controls */}
              <div className="w-full lg:w-7/12 h-1/2 lg:h-full relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
                <div className="flex-1 relative">
                  <MapView />

                  {/* Close Map (Switch to Full Dashboard) Button on Map */}
                  <div className="absolute top-4 right-4 z-[1050]">
                    <button
                      onClick={() => setViewLayout('dashboard')}
                      className="flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-850 text-amber-400 hover:text-white px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                      title="Close Map and Switch to Full Operations Dashboard"
                    >
                      <X className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTamil ? 'வரைபடத்தை மூடு' : 'Close Map'}</span>
                    </button>
                  </div>

                  {isPlannerOpen ? (
                    <div className="absolute top-4 left-4 z-[1050] max-w-[340px]">
                      <RoutingControls 
                        isFloating={true} 
                        onClose={() => setIsPlannerOpen(false)} 
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsPlannerOpen(true)}
                      className="absolute top-4 left-4 z-[1050] flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-xl shadow-xl font-bold text-xs"
                    >
                      <Navigation className="w-3.5 h-3.5 transform -rotate-45" />
                      <span>{isTamil ? 'வழித்தடம்' : 'Corridor'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Persona Dashboard */}
              <div className="w-full lg:w-5/12 h-1/2 lg:h-full overflow-y-auto p-4 bg-slate-950">
                {/* Persona Switcher & Close Map Action */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    {personas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          persona === p.id ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.icon}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setViewLayout('dashboard')}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-xl border border-amber-500/30 transition-all shrink-0"
                    title="Close Map and Expand Full Hub"
                  >
                    <X className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTamil ? 'வரைபடத்தை மூடு' : 'Close Map'}</span>
                  </button>
                </div>

                {persona === 'commander' && <FleetDispatcher />}
                {persona === 'navigator' && <CommuterView />}
                {persona === 'planner' && <PlannerView />}
              </div>
            </div>

            {/* Bottom Collapsible Telemetry Bar */}
            <TelemetryDrawer />
          </div>
        )}
      </div>

      {/* Statewide Accessibility Audit Modal */}
      <AuditModal />

      {/* Real-Time Meteorological Intelligence Modal */}
      <LiveWeatherModal />

      {/* Backend-Connected Authentication Modal */}
      <LoginModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Groq-Powered AI Copilot Drawer */}
      <AiCopilotDrawer />

      {/* ARIA Live Region for Screen-Reader Audio Accessibility */}
      <div className="sr-only" aria-live="polite" id="accessibility-announcer">
        OPENROUTE AI is active. Ready to guide barrier-free journeys across Tamil Nadu.
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
