import React, { useState } from 'react';
import { 
  Navigation, 
  Truck, 
  Accessibility, 
  Building2, 
  Volume2, 
  VolumeX, 
  Eye, 
  Sparkles,
  Languages,
  PlayCircle,
  Map,
  LayoutDashboard,
  SplitSquareVertical,
  Settings2,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  CloudSun
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TNPersonaType } from '../../types';


interface NavbarProps {
  viewLayout: 'map' | 'split' | 'dashboard';
  setViewLayout: (layout: 'map' | 'split' | 'dashboard') => void;
  isPlannerOpen?: boolean;
  setIsPlannerOpen?: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewLayout,
  setViewLayout,
  isPlannerOpen,
  setIsPlannerOpen
}) => {
  const { 
    language,
    setLanguage,
    persona, 
    setPersona, 
    demoScenarios,
    activeScenarioId,
    loadDemoScenario,
    highContrastMode, 
    toggleHighContrast, 
    fontScale, 
    setFontScale, 
    voiceMuted, 
    toggleVoiceMute,
    currentUser,
    setIsAuthModalOpen,
    logout,
    corridorWeather,
    liveWeatherStations,
    setIsWeatherModalOpen
  } = useApp();

  const isTamil = language === 'ta';
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);


  const personas: { id: TNPersonaType; label: string; labelTamil: string; icon: React.ReactNode }[] = [
    { 
      id: 'commander', 
      label: 'Logistics Commander', 
      labelTamil: 'சரக்கு மேலாண்மை',
      icon: <Truck className="w-3.5 h-3.5" />
    },
    { 
      id: 'navigator', 
      label: 'Accessible Transit', 
      labelTamil: 'பாதுகாப்பான பயணம்',
      icon: <Accessibility className="w-3.5 h-3.5" />
    },
    { 
      id: 'planner', 
      label: 'State Infrastructure', 
      labelTamil: 'உட்கட்டமைப்பு திட்டம்',
      icon: <Building2 className="w-3.5 h-3.5" />
    }
  ];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-emerald-500 flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
          <Navigation className="w-4 h-4 text-white transform -rotate-45" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent">
              OPENROUTE AI
            </span>
            <span className="hidden sm:inline-flex text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {isTamil ? 'தமிழ்நாடு' : 'Tamil Nadu'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden md:block leading-none">
            {isTamil ? 'அனைவருக்குமான சரக்கு & அணுகல் தளம்' : 'Logistics & Accessibility Platform'}
          </p>
        </div>
      </div>

      {/* Main View Mode Navigation Tabs */}
      <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 shadow-inner">
        <button
          onClick={() => {
            setViewLayout('map');
            if (setIsPlannerOpen) setIsPlannerOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewLayout === 'map'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Full State Map View"
        >
          <Map className="w-3.5 h-3.5" />
          <span>{isTamil ? 'வரைபடம் & வழித்தடம்' : 'State Map'}</span>
        </button>

        <button
          onClick={() => setViewLayout('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewLayout === 'dashboard'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Operations Hub & Analytics Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>{isTamil ? 'செயல்பாட்டு மையம்' : 'Operations Hub'}</span>
        </button>

        <button
          onClick={() => setViewLayout('split')}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewLayout === 'split'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Split Map & Dashboard View"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{isTamil ? 'இருபிரிவு' : 'Split'}</span>
        </button>
      </nav>

      {/* Persona Selector (Visible when on Dashboard or Split) */}
      {(viewLayout === 'dashboard' || viewLayout === 'split') && (
        <div className="hidden xl:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {personas.map((p) => {
            const isActive = persona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.icon}
                <span>{isTamil ? p.labelTamil : p.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Action Group: Scenarios, Language, Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Demo Scenario Selector */}
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
          <PlayCircle className="w-3.5 h-3.5 text-amber-400 hidden sm:block flex-shrink-0" />
          <select
            value={activeScenarioId || ''}
            onChange={(e) => loadDemoScenario(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
            title="Load demo scenario"
          >
            {demoScenarios.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-100">
                {isTamil ? sc.titleTamil : sc.title}
              </option>
            ))}
          </select>
        </div>

        {/* Live Weather Radar Button */}
        <button
          onClick={() => setIsWeatherModalOpen(true)}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/70 text-xs transition-all hover:scale-[1.02] shadow-sm group"
          title={isTamil ? "நேரலை வானிலை ரேடாரைத் திற" : "Open Live Meteorological Radar"}
        >
          <div className="relative flex items-center justify-center">
            <CloudSun className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className="text-white font-mono">
              {corridorWeather 
                ? `${corridorWeather.originWeather.temperature}°C` 
                : (liveWeatherStations.length > 0 ? `${liveWeatherStations[0].temperature}°C` : '27°C')}
            </span>
            <span className="hidden md:inline text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/30">
              {corridorWeather 
                ? (isTamil ? corridorWeather.originWeather.district : corridorWeather.originWeather.district) 
                : 'Live'}
            </span>
          </div>
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(isTamil ? 'en' : 'ta')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-400 hover:border-amber-500 font-bold transition-colors"
          title="Switch Language / மொழி"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{isTamil ? 'ENG' : 'தமிழ்'}</span>
        </button>

        {/* User Account / Login Button */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/70 transition-all text-xs"
              title="Official User Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[11px] font-bold text-white leading-tight max-w-[100px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-amber-400 leading-none capitalize">
                  {currentUser.district}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold text-white truncate text-xs">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Official Role:</span>
                    <span className="font-bold text-amber-400 capitalize">{currentUser.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jurisdiction:</span>
                    <span className="font-bold text-sky-400">{currentUser.district} District</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage:</span>
                    <span className="font-mono text-emerald-400 text-[10px]">Backend DB Active</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center justify-center gap-1.5 transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isTamil ? 'வெளியேறு (Sign Out)' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 border border-amber-400/40 transition-all hover:scale-105 active:scale-95"
            title="Sign In / Register"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isTamil ? 'உள்நுழைக' : 'Sign In'}</span>
          </button>
        )}

        {/* Settings & Accessibility Dropdown */}
        <div className="relative">

          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-2 rounded-xl border transition-all ${
              showSettingsMenu || highContrastMode
                ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Accessibility & Audio Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 text-xs z-40 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                <span>Accessibility & Audio</span>
                <button onClick={() => setShowSettingsMenu(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>

              {/* High Contrast Mode */}
              <button
                onClick={toggleHighContrast}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  highContrastMode
                    ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>High Contrast</span>
                </span>
                <span className="text-[10px] font-bold">{highContrastMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Voice Mute/Unmute */}
              <button
                onClick={toggleVoiceMute}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  !voiceMuted
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>Voice Audio</span>
                </span>
                <span className="text-[10px] font-bold">{voiceMuted ? 'MUTED' : 'ACTIVE'}</span>
              </button>

              {/* Font Sizing */}
              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Font Scale</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFontScale(Math.max(0.9, fontScale - 0.1))}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold"
                  >
                    A-
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(fontScale * 100)}%</span>
                  <button
                    onClick={() => setFontScale(Math.min(1.25, fontScale + 0.1))}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
