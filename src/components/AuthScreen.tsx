import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (token: string, username: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
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

  const [isLoading, setIsLoading] = useState(false);
  const API_BASE = 'http://127.0.0.1:8000/api/auth';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.access, loginUsername);
      } else {
        setLoginError(data.detail || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword })
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-login after registration
        setLoginUsername(regUsername);
        setLoginPassword(regPassword);
        setIsFlipped(false);
      } else {
        setRegError(JSON.stringify(data));
      }
    } catch (err) {
      setRegError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-6 font-oswald text-[#1a1a1a]">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 bg-[#f8f7f4] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a]">
            {/* 45 LBS Plate Spinning Loader */}
            <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center animate-spin border-4 border-dashed border-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
              <div className="absolute w-5 h-5 rounded-full bg-[#f8f7f4] border-2 border-[#1a1a1a]"></div>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(-14px)' }}>45</span>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(14px)' }}>LBS</span>
            </div>
            <div>
              <p className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] tracking-wider">Loading Lift Session...</p>
              <p className="font-mono text-[0.65rem] text-[#1a1a1a]/60 uppercase mt-1">Authenticating credentials</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 pulse-glow">
        <Dumbbell className="w-10 h-10 text-[#ff4d00]" />
        <h1 className="text-4xl font-black uppercase tracking-tighter">FlexPulse</h1>
      </div>

      {/* Flip Container */}
      <div className="relative w-full max-w-sm h-[480px]" style={{ perspective: '1000px' }}>
        
        {/* Flip Inner */}
        <div 
          className="w-full h-full absolute transition-transform duration-700 ease-in-out"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
          }}
        >
          
          {/* LOGIN SIDE (Front) */}
          <div 
            className="absolute w-full h-full bg-white border-4 border-[#1a1a1a] shadow-[12px_12px_0_#1a1a1a] p-8 flex flex-col"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="text-3xl font-bold uppercase mb-6 text-center">Login</h2>
            
            {loginError && (
              <div className="font-mono text-xs bg-red-100 text-red-600 border-2 border-red-600 p-2 mb-4 font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full bg-[#f8f7f4] border-2 border-[#1a1a1a] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#f8f7f4] border-2 border-[#1a1a1a] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] transition-colors"
                />
              </div>
              
              <button 
                type="submit" 
                className="mt-auto w-full bg-[#ff4d00] text-[#f8f7f4] font-bold text-lg uppercase py-4 border-2 border-[#1a1a1a] hover:bg-[#e64500] hover:-translate-y-1 hover:shadow-[4px_4px_0_#1a1a1a] transition-all cursor-pointer"
              >
                Let's Work
              </button>
            </form>

            <div className="mt-6 text-center font-mono text-xs text-[#1a1a1a]/60">
              New here? <button onClick={() => setIsFlipped(true)} className="font-bold text-[#ff4d00] uppercase hover:underline cursor-pointer">Register</button>
            </div>
          </div>


          {/* REGISTER SIDE (Back) */}
          <div 
            className="absolute w-full h-full bg-white border-4 border-[#1a1a1a] shadow-[12px_12px_0_#1a1a1a] p-8 flex flex-col"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <h2 className="text-3xl font-bold uppercase mb-6 text-center">Register</h2>
            
            {regError && (
              <div className="font-mono text-xs bg-red-100 text-red-600 border-2 border-red-600 p-2 mb-4 font-bold">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4 flex-1">
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  className="w-full bg-[#f8f7f4] border-2 border-[#1a1a1a] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Email</label>
                <input 
                  type="email" 
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-[#f8f7f4] border-2 border-[#1a1a1a] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-[#f8f7f4] border-2 border-[#1a1a1a] px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] transition-colors"
                />
              </div>
              
              <button 
                type="submit" 
                className="mt-auto w-full bg-[#1a1a1a] text-[#f8f7f4] font-bold text-lg uppercase py-4 border-2 border-[#1a1a1a] hover:bg-[#333] hover:-translate-y-1 hover:shadow-[4px_4px_0_#ff4d00] transition-all cursor-pointer"
              >
                Join Now
              </button>
            </form>

            <div className="mt-6 text-center font-mono text-xs text-[#1a1a1a]/60">
              Already have an account? <button onClick={() => setIsFlipped(false)} className="font-bold text-[#ff4d00] uppercase hover:underline cursor-pointer">Login</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
