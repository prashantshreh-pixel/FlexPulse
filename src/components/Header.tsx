import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { WeightUnit } from '../types';

interface HeaderProps {
  restTimerDuration: number;
  timerAutoStartKey: number;
  activeSessionTitle: string;
  weightUnit: WeightUnit;
  onToggleUnit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  restTimerDuration,
  timerAutoStartKey,
  activeSessionTitle,
  weightUnit,
  onToggleUnit,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(restTimerDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start timer when a set is logged
  useEffect(() => {
    if (timerAutoStartKey === 0) return;
    setSecondsLeft(restTimerDuration);
    setIsRunning(true);
  }, [timerAutoStartKey, restTimerDuration]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = secondsLeft / restTimerDuration;

  return (
    <header className="shrink-0 border-b-2 border-[#1a1a1a] bg-[#f8f7f4] px-6 py-3 flex items-center justify-between gap-6">
      {/* Session title */}
      <div className="hidden md:block min-w-0">
        <p className="font-mono text-[0.6rem] uppercase text-[#1a1a1a]/60 font-bold tracking-widest">Active Session</p>
        <p className="font-oswald text-sm uppercase font-semibold text-[#1a1a1a] truncate">{activeSessionTitle}</p>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* KG / LBS TOGGLE */}
        <div className="flex border-2 border-[#1a1a1a] overflow-hidden">
          <button
            onClick={onToggleUnit}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition cursor-pointer ${
              weightUnit === 'lbs' ? 'bg-[#1a1a1a] text-[#f8f7f4]' : 'bg-transparent text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
            }`}
          >
            LBS
          </button>
          <button
            onClick={onToggleUnit}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition cursor-pointer border-l-2 border-[#1a1a1a] ${
              weightUnit === 'kg' ? 'bg-[#1a1a1a] text-[#f8f7f4]' : 'bg-transparent text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
            }`}
          >
            KG
          </button>
        </div>

        {/* REST TIMER */}
        <div className="flex items-center gap-3 border-2 border-[#1a1a1a] bg-white px-4 py-2 shadow-[2px_2px_0_#1a1a1a]">
          <Timer className="w-4 h-4 text-[#ff4d00] shrink-0" />
          <div className="w-16">
            <p className="font-mono text-[0.55rem] uppercase text-[#1a1a1a]/60 font-bold leading-none">Rest Timer</p>
            <p
              className={`font-mono text-lg font-bold leading-tight ${
                secondsLeft <= 10 && isRunning ? 'text-[#ff4d00]' : 'text-[#1a1a1a]'
              }`}
            >
              {formatTime(secondsLeft)}
            </p>
          </div>

          {/* Progress ring */}
          <div className="relative w-8 h-8 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e5e5" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={secondsLeft <= 10 && isRunning ? '#ff4d00' : '#1a1a1a'}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setIsRunning(r => !r)}
              className="p-1.5 border border-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition cursor-pointer"
            >
              {isRunning
                ? <Pause className="w-3.5 h-3.5" />
                : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { setSecondsLeft(restTimerDuration); setIsRunning(false); }}
              className="p-1.5 border border-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
