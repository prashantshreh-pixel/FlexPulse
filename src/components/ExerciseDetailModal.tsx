import React, { useState } from 'react';
import { Exercise, WeightUnit } from '../types';
import { X, Plus, Info, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

// ── Exercise animation per muscle group ──────────────────────────────────────
const AnimationBox: React.FC<{ muscleGroup: string; category: string }> = ({ muscleGroup, category }) => {
  const config: Record<string, { animation: string; color: string; bg: string; label: string; icon: string }> = {
    Chest:     { animation: 'ex-push 1.8s ease-in-out infinite',    color: '#ef4444', bg: '#fef2f2', label: 'HORIZONTAL PUSH',   icon: '⇄' },
    Back:      { animation: 'ex-pull 1.8s ease-in-out infinite',    color: '#3b82f6', bg: '#eff6ff', label: 'HORIZONTAL PULL',   icon: '⇄' },
    Legs:      { animation: 'ex-squat 2s ease-in-out infinite',     color: '#10b981', bg: '#f0fdf4', label: 'VERTICAL PRESS',    icon: '⇅' },
    Shoulders: { animation: 'ex-press 1.8s ease-in-out infinite',   color: '#f59e0b', bg: '#fffbeb', label: 'VERTICAL PUSH',     icon: '↑' },
    Arms:      { animation: 'ex-curl 2s ease-in-out infinite',      color: '#f97316', bg: '#fff7ed', label: 'HINGE / CURL',      icon: '⤵' },
    Core:      { animation: 'ex-crunch 2s ease-in-out infinite',    color: '#8b5cf6', bg: '#f5f3ff', label: 'FLEXION',           icon: '◎' },
  };

  const c = config[muscleGroup] || config.Chest;

  return (
    <div
      className="relative flex items-center justify-center rounded-none border-2 border-[#1a1a1a] overflow-hidden"
      style={{ background: c.bg, height: '200px' }}
    >
      {/* Moving shape representing exercise movement */}
      <div
        style={{ animation: c.animation, color: c.color, fontSize: '5rem', lineHeight: 1, transformOrigin: 'bottom center' }}
      >
        {muscleGroup === 'Chest' && '🏋️'}
        {muscleGroup === 'Back' && '🚣'}
        {muscleGroup === 'Legs' && '🦵'}
        {muscleGroup === 'Shoulders' && '💪'}
        {muscleGroup === 'Arms' && '💪'}
        {muscleGroup === 'Core' && '🧘'}
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
        <span
          className="font-mono text-[0.55rem] font-black uppercase px-2 py-0.5 text-white"
          style={{ backgroundColor: c.color }}
        >
          {c.label}
        </span>
        <span className="font-mono text-[0.55rem] uppercase font-bold text-[#1a1a1a]/40">
          {category}
        </span>
      </div>
    </div>
  );
};

// ── Step-by-step instruction parser ─────────────────────────────────────────
function parseSteps(instructions: string): string[] {
  // Split on sentence boundaries
  const raw = instructions.split(/(?<=[.!])\s+/);
  return raw.filter(s => s.trim().length > 0);
}

// ── Form cues per muscle group ───────────────────────────────────────────────
const FORM_CUES: Record<string, string[]> = {
  Chest:     ['Retract and depress your shoulder blades before unracking', 'Keep your feet flat on the floor', 'Drive through the bar, not just push it', 'Breathe in on the way down, exhale at the top'],
  Back:      ['Maintain a neutral spine throughout the lift', 'Initiate the pull with your elbows, not your hands', 'Squeeze your shoulder blades together at peak contraction', 'Avoid rounding the lower back under load'],
  Legs:      ['Break at the hips and knees simultaneously', 'Keep your knees tracking over your toes', 'Drive through the full foot — heel and ball', 'Brace your core as if taking a punch'],
  Shoulders: ['Avoid excessive lumbar arch — tuck your ribs', 'Press in a slight J-curve to avoid hitting your chin', 'Lock out at the top with ears between arms', 'Keep the bar close to your face on the way up'],
  Arms:      ['Pin your elbows to your sides — no swinging', 'Control the eccentric (lowering) for more growth', 'Full range of motion is more effective than heavy partials', 'Squeeze at peak contraction and hold for 1 second'],
  Core:      ['Never hold your breath — exhale on contraction', 'Slow and controlled beats fast and sloppy', 'Posterior pelvic tilt to protect the lower back', 'Think about compressing, not crunching'],
};

const COMMON_MISTAKES: Record<string, string[]> = {
  Chest:     ['Bouncing the bar off the chest', 'Flaring elbows to 90° (causes shoulder impingement)', 'Incomplete range of motion'],
  Back:      ['Using momentum instead of muscle', 'Not fully extending at the bottom', 'Shrugging the traps on the pull'],
  Legs:      ['Knees caving inward', 'Rising on your toes at the bottom', 'Good morning squats (hips rise faster than torso)'],
  Shoulders: ['Pressing behind the neck', 'Hyperextending the lower back', 'Not reaching full lockout overhead'],
  Arms:      ['Swinging the torso to cheat the weight up', 'Partial range of motion curls', 'Dropping the weight without control'],
  Core:      ['Pulling on the neck during crunches', 'Holding breath', 'Using hip flexors instead of abs'],
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise, isOpen, onClose, onAdd,
}) => {
  const [showMistakes, setShowMistakes] = useState(false);

  if (!isOpen || !exercise) return null;

  const steps = parseSteps(exercise.instructions);
  const cues = FORM_CUES[exercise.muscleGroup] || [];
  const mistakes = COMMON_MISTAKES[exercise.muscleGroup] || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60">
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-[#f8f7f4] border-2 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] my-8">
          {/* Header */}
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
            <button onClick={onClose} className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition cursor-pointer shrink-0 mt-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Animation */}
            <AnimationBox muscleGroup={exercise.muscleGroup} category={exercise.category} />

            {/* Step-by-step */}
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

            {/* Form cues */}
            {cues.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-mono text-[0.65rem] uppercase font-bold text-[#1a1a1a]/60 tracking-widest">
                  Key Form Cues
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cues.map((cue, i) => (
                    <div key={i} className="flex gap-2 items-start p-2.5 bg-white border border-[#1a1a1a]/30">
                      <span className="text-[#ff4d00] font-bold text-sm shrink-0">✓</span>
                      <p className="font-mono text-[0.65rem] text-[#1a1a1a] leading-relaxed">{cue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common mistakes (collapsible) */}
            {mistakes.length > 0 && (
              <div className="border border-[#1a1a1a]/30 bg-white">
                <button
                  onClick={() => setShowMistakes(v => !v)}
                  className="w-full flex items-center justify-between p-3 font-mono text-[0.65rem] uppercase font-bold text-[#1a1a1a]/70 hover:text-[#1a1a1a] cursor-pointer"
                >
                  <span>⚠ Common Mistakes to Avoid</span>
                  {showMistakes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showMistakes && (
                  <div className="border-t border-[#1a1a1a]/20 p-3 space-y-1.5">
                    {mistakes.map((m, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-red-500 font-bold text-sm shrink-0">✗</span>
                        <p className="font-mono text-[0.65rem] text-[#1a1a1a]/80 leading-relaxed">{m}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t-2 border-[#1a1a1a] bg-white flex gap-3">
            <button
              onClick={() => { onAdd(exercise); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#ff4d00] text-white border-2 border-[#ff4d00] px-5 py-3 font-oswald uppercase text-base font-semibold hover:bg-[#e03d00] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add to Today's Workout
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 border-2 border-[#1a1a1a] font-oswald uppercase text-sm font-semibold hover:bg-[#1a1a1a]/5 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
