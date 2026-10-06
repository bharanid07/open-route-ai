import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  Building2, 
  Truck, 
  Accessibility, 
  MapPin, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { UserProfile, TNPersonaType } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    language, 
    setPersona, 
    setOriginId, 
    nodes,
    viewLayout,
    setViewLayout,
    setIsAuthModalOpen
  } = useApp();

  const isTamil = language === 'ta';
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState<string>('admin@smartpath.tn.gov.in');
  const [password, setPassword] = useState<string>('admin123');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<TNPersonaType>('commander');
  const [district, setDistrict] = useState<string>('Coimbatore');
  const [designation, setDesignation] = useState<string>('Logistics Dispatch Officer');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, setIsAuthModalOpen]);

  if (!isOpen) return null;

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { user } = await AuthService.login({ email, password });
      setCurrentUser(user);
      setPersona(user.role);
      
      // If user was in split mode, close the map and switch directly to operations dashboard
      if (viewLayout === 'split') {
        setViewLayout('dashboard');
      }

      setSuccessMsg(`Welcome, ${user.name}! Authenticated via backend.`);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        onClose();
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { user } = await AuthService.register({
        name,
        email,
        password,
        role,
        district,
        designation
      });
      setCurrentUser(user);
      setPersona(user.role);
      
      // Always switch to full operations dashboard upon signup (closes map in split or map mode)
      setViewLayout('dashboard');

      setSuccessMsg(`Account created and stored in backend! Welcome, ${user.name}.`);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        onClose();
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins for instant evaluation
  const setQuickDemoUser = (demoEmail: string, demoPass: string, demoRole: TNPersonaType) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('signin');
    setError(null);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsAuthModalOpen(false);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"></div>

        {/* Modal Close Button */}
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          title="Close Dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-orange-600/30 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white tracking-wide">
                  {isTamil ? 'தமிழ்நாடு ஸ்மார்ட்பாத் அங்கீகாரம்' : 'OPENROUTE AI Official Portal'}
                </h3>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Backend Auth
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isTamil ? 'அரசு அதிகாரிகள் & பயனர்கள் உள்நுழைவு' : 'Authorized Highway & Logistics System Access'}
              </p>
            </div>
          </div>

          {/* Toggle Tabs: Sign In / Register */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isTamil ? 'உள்நுழைக (Sign In)' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isTamil ? 'பதிவு செய்க (Register)' : 'New Account'}
            </button>
          </div>

          {/* Error & Success Feedback */}
          {error && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM: Sign In */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  {isTamil ? 'மின்னஞ்சல் (Official Email):' : 'Official Email:'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@smartpath.tn.gov.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  {isTamil ? 'கடவுச்சொல் (Password):' : 'Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-[0.98] disabled:opacity-60 border border-amber-400/40"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-amber-200" />
                    <span>{isTamil ? 'சரிபார்க்கிறது...' : 'Authenticating with Backend...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isTamil ? 'உள்நுழைக' : 'Sign In to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Accounts Selection */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-amber-400" />
                  Quick Official Demo Credentials:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickDemoUser('admin@smartpath.tn.gov.in', 'admin123', 'commander')}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-500 text-left truncate flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">State Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDemoUser('officer@coimbatore.tn.gov.in', 'coimbatore123', 'commander')}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-500 text-left truncate flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="truncate">Coimbatore Dispatch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDemoUser('transit@chennai.tn.gov.in', 'transit123', 'navigator')}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-500 text-left truncate flex items-center gap-1"
                  >
                    <Accessibility className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">Transit Lead</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDemoUser('planner@tndc.gov.in', 'planner123', 'planner')}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-500 text-left truncate flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">Policy Analyst</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* FORM: Register */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  {isTamil ? 'முழு பெயர் (Full Name):' : 'Full Name:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bharani Selvam"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  {isTamil ? 'மின்னஞ்சல் (Email):' : 'Email Address:'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="bharani@smartpath.tn.gov.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  {isTamil ? 'கடவுச்சொல் (Password):' : 'Create Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Role / Module:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as TNPersonaType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="commander">Logistics Commander</option>
                    <option value="navigator">Accessible Transit</option>
                    <option value="planner">State Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    District:
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Erode', 'Tiruppur', 'Vellore', 'Kanchipuram'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-60 border border-emerald-400/40"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>{isTamil ? 'சேமிக்கப்படுகிறது...' : 'Storing in Backend DB...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isTamil ? 'கணக்கை உருவாக்கு' : 'Create Official Account'}</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Backend storage notice footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Data stored persistently in backend database (<code className="font-mono text-slate-400">server/data/users.json</code>)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
