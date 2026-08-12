import React from 'react';
import { Trophy, X } from 'lucide-react';
import { WeightUnit, toDisplayWeight } from '../types';

interface PrModalProps {
  isOpen: boolean;
  onClose: () => void;
  prDetails: {
    exerciseName: string;
    weightLbs: number;
    reps: number;
    muscleGroup?: string;
  } | null;
  weightUnit: WeightUnit;
}

export const PrModal: React.FC<PrModalProps> = ({ isOpen, onClose, prDetails, weightUnit }) => {
  if (!isOpen || !prDetails) return null;

  const displayWeight = toDisplayWeight(prDetails.weightLbs, weightUnit);
  const est1RM = toDisplayWeight(Math.round(prDetails.weightLbs * (1 + prDetails.reps / 30)), weightUnit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="max-w-sm w-full text-center relative bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-[#1a1a1a]/60 hover:text-[#1a1a1a] cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-[#1a1a1a] text-[#ff4d00] flex items-center justify-center mx-auto mb-4 border-2 border-[#1a1a1a] pulse-glow">
          <Trophy className="w-8 h-8" />
        </div>

        <p className="font-mono text-xs uppercase font-bold text-[#ff4d00]">New Personal Record!</p>
        <h3 className="font-oswald text-3xl font-semibold uppercase text-[#1a1a1a] tracking-tight mt-1">
          {prDetails.exerciseName}
        </h3>

        <div className="my-6 p-4 bg-[#f8f7f4] border-2 border-[#1a1a1a] flex items-center justify-center gap-3">
          <span className="font-mono text-2xl font-bold text-[#ff4d00]">
            {displayWeight} {weightUnit}
          </span>
          <span className="font-mono text-[#1a1a1a]/40 text-xl">×</span>
          <span className="font-mono text-xl font-bold text-[#1a1a1a]">
            {prDetails.reps} reps
          </span>
        </div>

        <p className="font-mono text-[10px] text-[#1a1a1a]/50 mb-4">
          Est. 1RM: <strong className="text-[#1a1a1a]">{est1RM} {weightUnit}</strong>
        </p>

        <button onClick={onClose} className="action-btn primary w-full justify-center">
          Keep Crushing It
        </button>
      </div>
    </div>
  );
};
