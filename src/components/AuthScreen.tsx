import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { formatApiError, isValidUsername, sanitizeInput, sanitizeText } from '../utils/security';

interface AuthScreenProps {
  onAuthSuccess: (token: string, username: string) => void;
  onOpenLegal?: (page: 'terms' | 'privacy') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onOpenLegal }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const API_BASE = '/api/auth';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegSuccess('');

    const cleanUsername = sanitizeText(loginUsername, 30);
    if (!isValidUsername(cleanUsername)) {
      setLoginError('Enter a valid username (3-30 chars: letters, numbers, _, -, .).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.access) {
        onAuthSuccess(data.access, cleanUsername);
      } else {
        setLoginError(formatApiError(data, 'Invalid username or password.'));
      }
    } catch {
      setLoginError('Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const cleanUsername = sanitizeText(regUsername, 30);
    const cleanEmail = sanitizeText(regEmail, 254).toLowerCase();

    if (!isValidUsername(cleanUsername)) {
      setRegError('Username must be 3-30 chars using letters, numbers, _, -, or . only.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password: regPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLoginUsername(cleanUsername);
        setLoginPassword('');
        setRegSuccess('Account created. Sign in with your new credentials.');
        setIsFlipped(false);
      } else {
        setRegError(formatApiError(data, 'Unable to create account. Check your details.'));
      }
    } catch {
      setRegError('Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#151518] text-[#1a1a1a] dark:text-white flex flex-col items-center justify-center p-6 font-oswald select-none">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 bg-[#f8f7f4] dark:bg-[#151518] border-4 border-[#1a1a1a] dark:border-zinc-800 shadow-[8px_8px_0_#1a1a1a] dark:shadow-[8px_8px_0_#000]">
            {/* 45 LBS Plate Spinning Loader */}
            <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center animate-spin border-4 border-dashed border-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
              <div className="absolute w-5 h-5 rounded-full bg-[#f8f7f4] border-2 border-[#1a1a1a]"></div>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(-14px)' }}>45</span>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(14px)' }}>LBS</span>
            </div>
            <div>
              <p className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] dark:text-white tracking-wider">Loading Lift Session...</p>
              <p className="font-mono text-[0.65rem] text-[#1a1a1a]/60 uppercase mt-1">Authenticating credentials</p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-5 mb-3">
          <div className="relative flex items-center justify-center w-12 h-12">
            <div className="block dark:hidden absolute -inset-2 rounded-full bg-[#ff4d00]/25 blur-md pointer-events-none" />
            <div
              className="hidden dark:flex absolute -inset-3 w-18 h-18 pointer-events-none items-center justify-center overflow-hidden rounded-full"
              style={{
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)',
                maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)',
              }}
            >
              <img
                src="/images/gif/aura.gif"
                alt="FlexPulse Emblem"
                className="w-full h-full object-cover mix-blend-screen opacity-100"
                style={{
                  filter: 'grayscale(100%) contrast(400%) brightness(140%) sepia(1) saturate(900%) hue-rotate(-28deg) drop-shadow(0 0 10px #ff4d00)',
                }}
              />
            </div>

            <Dumbbell
              className="relative z-10 w-9 h-9 text-[#ff4d00]"
              style={{
                filter: 'drop-shadow(0 0 8px #ff4d00)',
              }}
            />
          </div>

          <h1 className="text-4xl font-black uppercase tracking-[0.25em] text-[#1a1a1a] dark:text-white">
            FLEXPULSE
          </h1>
        </div>
        <p className="font-mono text-xs text-[#1a1a1a]/65 dark:text-white/65 max-w-sm leading-relaxed">
          Log barbell sets, track Epley 1RM records, and execute multi-day strength splits.
        </p>
      </div>

      {/* Flip Container */}
      <div className="relative w-full max-w-sm h-[520px]" style={{ perspective: '1000px' }}>
        <div
          className="w-full h-full absolute transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* LOGIN SIDE (Front) */}
          <div
            className="absolute w-full h-full bg-white dark:bg-[#111113] border-4 border-[#1a1a1a] dark:border-zinc-800 shadow-[12px_12px_0_#1a1a1a] dark:shadow-[12px_12px_0_#000] p-8 flex flex-col"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="text-3xl font-bold uppercase mb-5 text-center text-[#1a1a1a] dark:text-white">Login</h2>

            {regSuccess && (
              <div className="font-mono text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-600 p-2 mb-4 font-bold">
                {regSuccess}
              </div>
            )}

            {loginError && (
              <div className="font-mono text-xs bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-500 p-2 mb-4 font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  autoComplete="username"
                  value={loginUsername}
                  onChange={e => setLoginUsername(sanitizeInput(e.target.value, 30))}
                  className="w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="mt-auto w-full bg-[#ff4d00] text-[#f8f7f4] font-bold text-lg uppercase py-4 border-2 border-[#1a1a1a] dark:border-zinc-700 hover:bg-[#e64500] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1a1a1a] dark:hover:shadow-[4px_4px_0_#000] transition-all cursor-pointer"
              >
                Start Training
              </button>
            </form>

            <div className="mt-5 text-center font-mono text-xs text-[#1a1a1a]/60 dark:text-white/60">
              New here?{' '}
              <button
                type="button"
                onClick={() => { setLoginError(''); setIsFlipped(true); }}
                className="font-bold text-[#ff4d00] uppercase hover:underline cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>

          {/* REGISTER SIDE (Back) */}
          <div
            className="absolute w-full h-full bg-white dark:bg-[#111113] border-4 border-[#1a1a1a] dark:border-zinc-800 shadow-[12px_12px_0_#1a1a1a] dark:shadow-[12px_12px_0_#000] p-8 flex flex-col"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <h2 className="text-3xl font-bold uppercase mb-5 text-center text-[#1a1a1a] dark:text-white">Register</h2>

            {regError && (
              <div className="font-mono text-xs bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-500 p-2 mb-3 font-bold max-h-20 overflow-y-auto">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-3 flex-1">
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  autoComplete="username"
                  value={regUsername}
                  onChange={e => setRegUsername(sanitizeInput(e.target.value, 30))}
                  className="w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={regEmail}
                  onChange={e => setRegEmail(sanitizeInput(e.target.value, 254))}
                  className="w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Password (8+ chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-[#f8f7f4] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="mt-auto w-full bg-[#1a1a1a] dark:bg-white text-[#f8f7f4] dark:text-[#1a1a1a] font-bold text-lg uppercase py-4 border-2 border-[#1a1a1a] dark:border-zinc-700 hover:bg-[#333] dark:hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#ff4d00] transition-all cursor-pointer"
              >
                Create Account
              </button>
            </form>

            <div className="mt-5 text-center font-mono text-xs text-[#1a1a1a]/60 dark:text-white/60">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setRegError(''); setIsFlipped(false); }}
                className="font-bold text-[#ff4d00] uppercase hover:underline cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer Links */}
      {onOpenLegal && (
        <div className="mt-8 flex items-center gap-4 font-mono text-[0.65rem] uppercase text-[#1a1a1a]/60 dark:text-white/60">
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="hover:text-[#ff4d00] hover:underline cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-[#ff4d00] hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      )}
    </div>
  );
};
