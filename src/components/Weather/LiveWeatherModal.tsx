import React, { useState } from 'react';
import { 
  X, 
  CloudSun, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Thermometer, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Navigation, 
  Search,
  CheckCircle2,
  Sparkles,
  Clock,
  Umbrella
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LiveWeatherModal: React.FC = () => {
  const { 
    language, 
    isWeatherModalOpen, 
    setIsWeatherModalOpen, 
    liveWeatherStations, 
    corridorWeather,
    refreshLiveWeather,
    originId,
    destinationId,
    setOriginId,
    setDestinationId,
    setWeather,
    weather: currentSimWeather
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'corridor' | 'statewide'>('corridor');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isWeatherModalOpen) return null;

  const isTamil = language === 'ta';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshLiveWeather();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApplyToSimulation = () => {
    if (!corridorWeather) return;
    if (corridorWeather.hasRainAlongRoute || corridorWeather.originWeather.conditionType === 'heavy_rain' || corridorWeather.destinationWeather.conditionType === 'heavy_rain') {
      setWeather('monsoon_cyclone');
      setSyncFeedback(isTamil ? 'மழை/புயல் இடர் மாதிரி செயல்படுத்தப்பட்டது!' : 'Monsoon/Rain routing model activated!');
    } else if (corridorWeather.originWeather.temperature > 37 || corridorWeather.destinationWeather.temperature > 37) {
      setWeather('extreme_summer');
      setSyncFeedback(isTamil ? 'கோடை வெப்ப மாதிரி செயல்படுத்தப்பட்டது!' : 'Summer extreme heat model activated!');
    } else {
      setWeather('clear');
      setSyncFeedback(isTamil ? 'சீரான வானிலை மாதிரி உறுதிப்படுத்தப்பட்டது!' : 'Clear weather model synchronized!');
    }

    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const getWeatherIcon = (type: string, isDay: boolean = true) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-6 h-6 text-amber-400 animate-pulse" />;
      case 'partly_cloudy':
        return <CloudSun className="w-6 h-6 text-amber-300" />;
      case 'rain':
      case 'heavy_rain':
      case 'drizzle':
        return <CloudRain className="w-6 h-6 text-sky-400" />;
      case 'thunderstorm':
        return <CloudLightning className="w-6 h-6 text-purple-400" />;
      default:
        return <CloudSun className="w-6 h-6 text-slate-300" />;
    }
  };

  const filteredStations = liveWeatherStations.filter(st => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return st.name.toLowerCase().includes(q) || 
           st.district.toLowerCase().includes(q) || 
           st.nameTamil.includes(q);
  });

  const activeHourlyForecast = corridorWeather?.destinationWeather?.rainForecast?.next12Hours || 
                               (liveWeatherStations[0]?.rainForecast?.next12Hours || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <CloudSun className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {isTamil ? 'தமிழ்நாடு நேரலை வானிலை & மழை முன்னறிவிப்பு' : 'Tamil Nadu Real-Time Weather & Rain Forecast'}
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  OPEN-METEO LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isTamil ? 'நேரலை வெப்பநிலை மற்றும் எப்போது மழை பெய்யும் என்ற துல்லியமான முன்னறிவிப்பு' : 'Real-time temperatures, hourly rain probabilities, and exact rainfall timings'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
              title="Refresh Live Meteorological Observations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setIsWeatherModalOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('corridor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'corridor'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isTamil ? 'செயலில் உள்ள வழித்தட வானிலை & மழை' : 'Corridor Weather & Rain Timing'}</span>
          </button>
          <button
            onClick={() => setActiveTab('statewide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'statewide'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>{isTamil ? 'மாநில முழுமை ரேடார் (15 மையங்கள்)' : 'Statewide Radar (15 Hubs)'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'corridor' && (
            <div className="space-y-5">
              {/* Corridor Summary Banner */}
              {corridorWeather && (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  corridorWeather.hasRainAlongRoute 
                    ? 'bg-sky-950/40 border-sky-600/40 text-sky-200' 
                    : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
                      {corridorWeather.hasRainAlongRoute ? (
                        <Umbrella className="w-6 h-6 text-sky-400 animate-bounce-gentle" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {isTamil ? 'வழித்தட மழை & வானிலை நிலை' : 'Corridor Rain & Transit Feasibility'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300">
                          {isTamil ? corridorWeather.rainTimingSummaryTamil : corridorWeather.rainTimingSummary}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {isTamil ? corridorWeather.overallAdvisoryTamil : corridorWeather.overallAdvisory}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleApplyToSimulation}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isTamil ? 'வழித்தட மாதிரியுடன் இணை' : 'Sync with Route Engine'}</span>
                    </button>
                  </div>
                </div>
              )}

              {syncFeedback && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{syncFeedback}</span>
                </div>
              )}

              {/* Dual Station Comparison Cards */}
              {corridorWeather ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Station */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-bold text-amber-400 uppercase tracking-wider">
                          📍 {isTamil ? 'தொடக்க மையம்' : 'Origin Hub'}
                        </span>
                        <span>{corridorWeather.originWeather.district}</span>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black text-white">
                            {isTamil ? corridorWeather.originWeather.nameTamil : corridorWeather.originWeather.name}
                          </h3>
                          <p className="text-xs text-slate-300 font-medium">
                            {isTamil ? corridorWeather.originWeather.conditionTamil : corridorWeather.originWeather.condition}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(corridorWeather.originWeather.conditionType, corridorWeather.originWeather.isDay)}
                          <span className="text-3xl font-black text-white font-mono">
                            {corridorWeather.originWeather.temperature}°C
                          </span>
                        </div>
                      </div>

                      {/* Explicit Rain Timing Section */}
                      <div className="mt-3 p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sky-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {isTamil ? 'மழை பெய்யும் நேரம்:' : 'Next Rain Timing:'}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                            {corridorWeather.originWeather.rainForecast?.nextRainProbability || 0}% Prob.
                          </span>
                        </div>
                        <p className="text-white font-medium text-[11px]">
                          {isTamil 
                            ? corridorWeather.originWeather.rainForecast?.rainSummaryTamil 
                            : corridorWeather.originWeather.rainForecast?.rainSummary}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Droplets className="w-3.5 h-3.5 text-sky-400" />
                          <span>{corridorWeather.originWeather.humidity}% Hum.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Wind className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{corridorWeather.originWeather.windSpeed} km/h</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Feels {corridorWeather.originWeather.feelsLike}°C</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                      💡 {isTamil ? corridorWeather.originWeather.advisoryTamil : corridorWeather.originWeather.advisory}
                    </div>
                  </div>

                  {/* Destination Station */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-bold text-red-400 uppercase tracking-wider">
                          🏁 {isTamil ? 'இலக்கு மையம்' : 'Destination Hub'}
                        </span>
                        <span>{corridorWeather.destinationWeather.district}</span>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black text-white">
                            {isTamil ? corridorWeather.destinationWeather.nameTamil : corridorWeather.destinationWeather.name}
                          </h3>
                          <p className="text-xs text-slate-300 font-medium">
                            {isTamil ? corridorWeather.destinationWeather.conditionTamil : corridorWeather.destinationWeather.condition}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(corridorWeather.destinationWeather.conditionType, corridorWeather.destinationWeather.isDay)}
                          <span className="text-3xl font-black text-white font-mono">
                            {corridorWeather.destinationWeather.temperature}°C
                          </span>
                        </div>
                      </div>

                      {/* Explicit Rain Timing Section */}
                      <div className="mt-3 p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sky-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {isTamil ? 'மழை பெய்யும் நேரம்:' : 'Next Rain Timing:'}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                            {corridorWeather.destinationWeather.rainForecast?.nextRainProbability || 0}% Prob.
                          </span>
                        </div>
                        <p className="text-white font-medium text-[11px]">
                          {isTamil 
                            ? corridorWeather.destinationWeather.rainForecast?.rainSummaryTamil 
                            : corridorWeather.destinationWeather.rainForecast?.rainSummary}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Droplets className="w-3.5 h-3.5 text-sky-400" />
                          <span>{corridorWeather.destinationWeather.humidity}% Hum.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Wind className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{corridorWeather.destinationWeather.windSpeed} km/h</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Feels {corridorWeather.destinationWeather.feelsLike}°C</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                      💡 {isTamil ? corridorWeather.destinationWeather.advisoryTamil : corridorWeather.destinationWeather.advisory}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {isTamil ? 'வானிலை தகவல்கள் ஏற்றப்படுகின்றன...' : 'Loading corridor meteorological data...'}
                </div>
              )}

              {/* 12-Hour Hourly Rain & Precipitation Forecast Bar */}
              {activeHourlyForecast.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-sky-400" />
                      {isTamil ? 'அடுத்த 12 மணி நேர மழை வாய்ப்பு சதவீதம்' : 'Next 12-Hour Rain Probability (%)'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isTamil ? 'நேரலை முன்னறிவிப்பு' : 'Hourly Precipitation Forecast'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                    {activeHourlyForecast.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded-lg text-center border flex flex-col items-center justify-between gap-1 transition-all ${
                          item.isRainLikely 
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-200' 
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400">{item.timeFormatted}</span>
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 my-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.probability >= 50 ? 'bg-sky-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.max(5, item.probability)}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-black font-mono ${item.probability >= 30 ? 'text-sky-300' : 'text-slate-400'}`}>
                          {item.probability}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'statewide' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isTamil ? 'மாவட்டங்கள் அல்லது மையங்களைத் தேடுங்கள் (எ.கா. சேலம், சென்னை, ஊட்டி)...' : 'Filter by hub or district (e.g. Salem, Chennai, Ooty)...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-500"
                />
              </div>

              {/* Station Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStations.map((station) => {
                  const isOrigin = station.id === originId;
                  const isDest = station.id === destinationId;

                  return (
                    <div
                      key={station.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isOrigin
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : isDest
                          ? 'bg-red-500/10 border-red-500/50'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-white">
                              {isTamil ? station.nameTamil : station.name}
                            </h4>
                            {isOrigin && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 uppercase">
                                Origin
                              </span>
                            )}
                            {isDest && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500 text-white uppercase">
                                Dest
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{station.district}</p>
                        </div>

                        <div className="flex items-center gap-1.5 text-right">
                          {getWeatherIcon(station.conditionType, station.isDay)}
                          <span className="font-mono text-base font-black text-white">
                            {station.temperature}°C
                          </span>
                        </div>
                      </div>

                      {/* Rain Timing Pill */}
                      <div className="mt-2 py-1 px-2 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>{isTamil ? 'மழை:' : 'Rain:'}</span>
                          <span className="text-slate-200 font-semibold truncate max-w-[130px]">
                            {station.rainForecast?.nextRainTime ? station.rainForecast.nextRainTime : (isTamil ? 'மழை இல்லை' : 'No rain 24h')}
                          </span>
                        </span>
                        <span className="font-mono font-bold text-sky-400">
                          {station.rainForecast?.nextRainProbability || 0}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-800/60">
                        <span className="text-slate-400 truncate max-w-[140px]">
                          {isTamil ? station.conditionTamil : station.condition}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>💧 {station.humidity}%</span>
                          <span>💨 {station.windSpeed} km/h</span>
                        </div>
                      </div>

                      {/* Quick Route Actions */}
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/40 text-[10px]">
                        <button
                          onClick={() => {
                            setOriginId(station.id);
                            setSyncFeedback(isTamil ? `தொடக்க மையம் ${station.nameTamil} என மாற்றப்பட்டது` : `Origin set to ${station.name}`);
                            setTimeout(() => setSyncFeedback(null), 2500);
                          }}
                          className="flex-1 py-1 rounded bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold transition-colors border border-slate-800 text-center"
                        >
                          Set Origin
                        </button>
                        <button
                          onClick={() => {
                            setDestinationId(station.id);
                            setSyncFeedback(isTamil ? `இலக்கு ${station.nameTamil} என மாற்றப்பட்டது` : `Destination set to ${station.name}`);
                            setTimeout(() => setSyncFeedback(null), 2500);
                          }}
                          className="flex-1 py-1 rounded bg-slate-900 hover:bg-red-500 hover:text-white text-slate-300 font-semibold transition-colors border border-slate-800 text-center"
                        >
                          Set Dest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>📡 Meteorological Source: Open-Meteo High-Resolution Weather API</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Active Simulation Mode: <b className="text-amber-400 uppercase">{currentSimWeather}</b></span>
          </div>
          <button
            onClick={() => setIsWeatherModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            {isTamil ? 'மூடு' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
