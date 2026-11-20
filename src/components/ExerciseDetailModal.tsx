import React, { useState } from 'react';
import { Exercise } from '../types';
import {
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  XCircle,
  Dumbbell,
  Activity,
  Flame,
  Target,
  Zap,
  Shield,
} from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
  readOnly?: boolean;
}

// Exercise preview & movement fallback per muscle group
const AnimationBox: React.FC<{ muscleGroup: string; category: string; exerciseName: string }> = ({
  muscleGroup,
  category,
  exerciseName,
}) => {
  const [imageError, setImageError] = useState(false);

  const config: Record<string, { animation: string; color: string; bg: string; label: string; Icon: React.ElementType }> = {
    Chest:     { animation: 'ex-push 1.8s ease-in-out infinite',   color: '#ef4444', bg: '#fef2f2', label: 'HORIZONTAL PUSH', Icon: Dumbbell },
    Back:      { animation: 'ex-pull 1.8s ease-in-out infinite',   color: '#3b82f6', bg: '#eff6ff', label: 'HORIZONTAL PULL', Icon: Activity },
    Legs:      { animation: 'ex-squat 2s ease-in-out infinite',    color: '#10b981', bg: '#f0fdf4', label: 'LOWER BODY DRIVE', Icon: Flame },
    Shoulders: { animation: 'ex-press 1.8s ease-in-out infinite',  color: '#f59e0b', bg: '#fffbeb', label: 'VERTICAL PUSH',   Icon: Zap },
    Arms:      { animation: 'ex-curl 2s ease-in-out infinite',     color: '#f97316', bg: '#fff7ed', label: 'HINGE / CURL',    Icon: Target },
    Core:      { animation: 'ex-crunch 2s ease-in-out infinite',   color: '#0d9488', bg: '#f0fdfa', label: 'CORE BRACING',    Icon: Shield },
  };

  const c = config[muscleGroup] || config.Chest;
  const FallbackIcon = c.Icon;

  if (!imageError) {
    const getSanitizedName = (name: string) => {
      if (name === 'Pec Deck / Chest Fly Machine') return 'Pec Deck,Chest Fly Machine';
      if (name === 'Pull-Up / Chin-Up') return 'Pull-Up - Chin-Up';
      return name;
    };
    const imageUrl = `/images/exercises/${getSanitizedName(exerciseName)}.jpg`;
    return (
      <div className="relative flex items-center justify-center rounded-none border-2 border-[#1a1a1a] overflow-hidden bg-white dark:bg-[#111113] p-2" style={{ height: '200px' }}>
        <img
          src={imageUrl}
          alt={exerciseName}
          className="w-full h-full object-contain dark:invert dark:mix-blend-lighten"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center rounded-none border-2 border-[#1a1a1a] overflow-hidden"
      style={{ background: c.bg, height: '200px' }}
    >
      <div
        className="z-10 flex items-center justify-center w-20 h-20 border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0_#1a1a1a]"
        style={{ animation: c.animation, color: c.color }}
      >
        <FallbackIcon className="w-10 h-10" />
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-20">
        <span
          className="font-mono text-[0.55rem] font-black uppercase px-2 py-0.5 text-white"
          style={{ backgroundColor: c.color }}
        >
          {c.label}
        </span>
        <span className="font-mono text-[0.55rem] uppercase font-bold text-[#1a1a1a]/60">
          {category}
        </span>
      </div>
    </div>
  );
};

function parseSteps(instructions: string): string[] {
  const raw = instructions.split(/(?<=[.!])\s+/);
  return raw.filter(s => s.trim().length > 0);
}

const FORM_CUES: Record<string, string[]> = {
  Chest: [
    'Retract and depress your shoulder blades before unracking',
    'Keep your feet planted firmly on the floor',
    'Drive yourself into the bench as you press upward',
    'Inhale during the descent and exhale through lockout',
  ],
  Back: [
    'Maintain a neutral spine throughout the lift',
    'Initiate the pull with your elbows, not your hands',
    'Squeeze your shoulder blades together at peak contraction',
    'Avoid rounding the lower back under load',
  ],
  Legs: [
    'Break at the hips and knees simultaneously',
    'Keep your knees tracking in line with your toes',
    'Drive through the full foot: heel and midfoot',
    'Brace your core tightly before initiating the descent',
  ],
  Shoulders: [
    'Avoid excessive lumbar arch by bracing your ribcage down',
    'Press in a clean vertical path over midfoot',
    'Lock out overhead with biceps aligned near your ears',
    'Keep the bar path close to your centerline',
  ],
  Arms: [
    'Keep your elbows anchored to avoid torso swing',
    'Control the lowering phase for steady tension',
    'Use full range of motion rather than heavy partials',
    'Pause briefly at peak contraction on every rep',
  ],
  Core: [
    'Exhale steadily on contraction rather than holding your breath',
    'Use a slow, controlled tempo on every rep',
    'Maintain posterior pelvic tilt to protect the lower back',
    'Focus on flexing the ribcage toward the pelvis',
  ],
};

const COMMON_MISTAKES: Record<string, string[]> = {
  Chest: ['Bouncing the bar off the chest', 'Flaring elbows out to 90 degrees', 'Stopping short of full range of motion'],
  Back: ['Using torso momentum instead of back tension', 'Cutting the stretch short at the bottom', 'Shrugging traps excessively during rows'],
  Legs: ['Allowing knees to cave inward', 'Shifting weight onto toes at the bottom', 'Letting hips rise faster than the chest'],
  Shoulders: ['Pressing behind the neck', 'Hyperextending the lower back', 'Missing full overhead lockout'],
  Arms: ['Swinging the torso to heave the load', 'Using partial reps only', 'Dropping the eccentric without control'],
  Core: ['Pulling on the neck during trunk flexion', 'Holding breath across multiple reps', 'Letting hip flexors dominate the movement'],
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise, isOpen, onClose, onAdd, readOnly = false,
}) => {
  const [showMistakes, setShowMistakes] = useState(false);

  if (!isOpen || !exercise) return null;

  const steps = parseSteps(exercise.instructions);
  const cues = FORM_CUES[exercise.muscleGroup] || [];
  const mistakes = COMMON_MISTAKES[exercise.muscleGroup] || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#f8f7f4] border-l-2 border-[#1a1a1a] h-full overflow-y-auto shadow-[-8px_0_0_#1a1a1a] flex flex-col slide-in-right">
        <div className="flex items-start justify-between gap-4 p-6 border-b-2 border-[#1a1a1a] bg-white">
          <div>
            <div className="flex gap-2 flex-wrap mb-2">
              <span className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 bg-[#ff4d00] text-white">
                {exercise.muscleGroup}
              </span>
              <span className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 border border-[#1a1a1a] text-[#1a1a1a]">
                {exercise.equipment}
              </span>
              <span className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 border border-[#1a1a1a] text-[#1a1a1a]">
                {exercise.category}
              </span>
            </div>
            <h2 className="font-oswald text-3xl uppercase font-semibold text-[#1a1a1a]">
              {exercise.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition cursor-pointer shrink-0 mt-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <AnimationBox muscleGroup={exercise.muscleGroup} category={exercise.category} exerciseName={exercise.name} />

          <div className="space-y-3">
            <h3 className="font-mono text-[0.65rem] uppercase font-bold text-[#1a1a1a]/60 tracking-widest">
              Step-by-Step Execution
            </h3>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 p-3 bg-white border border-[#1a1a1a]">
                  <span className="font-mono text-xs font-black text-[#ff4d00] shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="font-mono text-xs text-[#1a1a1a] leading-relaxed">{step.trim()}</p>
                </div>
              ))}
            </div>
          </div>

          {cues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-mono text-[0.65rem] uppercase font-bold text-[#1a1a1a]/60 tracking-widest">
                Key Form Cues
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cues.map((cue, i) => (
                  <div key={i} className="flex gap-2 items-start p-2.5 bg-white border border-[#1a1a1a]/30">
                    <Check className="w-3.5 h-3.5 text-[#ff4d00] shrink-0 mt-0.5" />
                    <p className="font-mono text-[0.65rem] text-[#1a1a1a] leading-relaxed">{cue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mistakes.length > 0 && (
            <div className="border border-[#1a1a1a]/30 bg-white">
              <button
                type="button"
                onClick={() => setShowMistakes(v => !v)}
                className="w-full flex items-center justify-between p-3 font-mono text-[0.65rem] uppercase font-bold text-[#1a1a1a]/70 hover:text-[#1a1a1a] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff4d00]" />
                  Common Mistakes to Avoid
                </span>
                {showMistakes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showMistakes && (
                <div className="border-t border-[#1a1a1a]/20 p-3 space-y-1.5">
                  {mistakes.map((m, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <p className="font-mono text-[0.65rem] text-[#1a1a1a]/80 leading-relaxed">{m}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t-2 border-[#1a1a1a] bg-white flex gap-3">
          {!readOnly && (
            <button
              type="button"
              onClick={() => { onAdd(exercise); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#ff4d00] text-white border-2 border-[#ff4d00] px-5 py-3 font-oswald uppercase text-base font-semibold hover:bg-[#e03d00] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add to Today&apos;s Workout
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${readOnly ? 'flex-1' : ''} px-5 py-3 border-2 border-[#1a1a1a] font-oswald uppercase text-sm font-semibold hover:bg-[#1a1a1a]/5 transition cursor-pointer`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
