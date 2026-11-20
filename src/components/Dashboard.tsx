import React, { useState } from 'react';
import {
  ViewTab,
  WorkoutSession,
  PersonalRecord,
  WeightUnit,
  CompletedWorkout,
  toDisplayWeight,
} from '../types';
import { Trophy, ChevronRight, Lightbulb, X, Dumbbell, ClipboardList } from 'lucide-react';

interface DashboardProps {
  session: WorkoutSession;
  prs: PersonalRecord[];
  workoutHistory: CompletedWorkout[];
  username: string;
  setActiveTab: (tab: ViewTab) => void;
  weightUnit: WeightUnit;
}

const QUICK_TIPS = [
  {
    id: 1,
    title: 'Progressive Overload',
    tag: 'PRINCIPLE',
    color: '#ff4d00',
    body: 'Increase weight by 2.5-5 lbs when you can complete all target reps with clean form. This is the #1 driver of muscle and strength gains.',
    detail: `Progressive overload is the gradual increase of mechanical tension placed upon the body during training. It is the core principle behind measurable strength progression.

**How to apply it:**
- Add weight (2.5-5 lbs) once you hit the top of your rep range
- Add reps if you cannot increase load yet
- Tighten rest intervals to increase session density
- Maintain full range of motion on every rep
- Progress total weekly working sets across training blocks

Track every working set. Consistent logging removes guesswork.`,
  },
  {
    id: 2,
    title: 'Rest Timer Matters',
    tag: 'RECOVERY',
    color: '#1a1a1a',
    body: 'Compound lifts (squat, bench, deadlift) need 2-3 min rest. Isolation work needs only 60-90 sec.',
    detail: `Rest periods directly govern output on your next set. Resting too little cuts total force production; resting too long wastes gym time.

**Optimal rest by lift type:**
- Compound lifts (squat, bench, deadlift, OHP): 2-4 minutes
- Secondary compounds (rows, dips, lunges): 90-120 seconds
- Isolation work (curls, laterals, flyes): 60-90 seconds
- Antagonist supersets: 45-60 seconds between movements

Use the header rest timer after every working set to standardize session pacing.`,
  },
  {
    id: 3,
    title: 'Understanding RPE',
    tag: 'METRICS',
    color: '#1a1a1a',
    body: 'RPE 10 = absolute max, RPE 8 = 2 reps left in the tank. Aim for RPE 7-9 on working sets.',
    detail: `Rate of Perceived Exertion (RPE) measures how close a working set comes to muscular failure.

**RPE Scale:**
- RPE 10: Could not complete another rep, absolute limit
- RPE 9: Could complete exactly 1 more rep
- RPE 8: 2 reps in reserve, ideal target for hypertrophy work
- RPE 7: 3 reps in reserve, productive for volume accumulation
- RPE 6: 4+ reps in reserve, suited for warm-ups and technique sets

Training between RPE 7 and 9 drives strong stimulus without excessive central fatigue.`,
  },
  {
    id: 4,
    title: 'Compounds First',
    tag: 'TECHNIQUE',
    color: '#ff4d00',
    body: 'Perform multi-joint compound lifts at the start of your session when your focus and force output are highest.',
    detail: `Your nervous system and stabilizer muscles are freshest at the beginning of a session. Heavy barbell lifts require that fresh state for safe execution.

**Training order:**
1. Primary compound (squat, bench, deadlift, OHP)
2. Secondary compound (rows, lunges, dips)
3. Accessory isolation work
4. Core or direct arm work last

Keep isolation work after heavy compounds so grip and stabilizer fatigue never compromises big lifts.`,
  },
  {
    id: 5,
    title: 'Sleep = Recovery',
    tag: 'RECOVERY',
    color: '#1a1a1a',
    body: 'Muscle protein synthesis and tissue repair peak during deep sleep. Aim for 7-9 consistent hours each night.',
    detail: `Sleep is the primary recovery window for strength athletes. Training creates the stimulus, while recovery builds the adaptation.

**What happens during deep sleep:**
- Growth hormone pulses support connective and muscle tissue repair
- Muscle protein synthesis restores fatigued fibers
- Cortisol drops, aiding systemic recovery
- Neuromuscular readiness resets for your next session

**Improve sleep quality:**
- Keep a consistent sleep and wake window
- Keep your bedroom cool (65-68 F / 18-20 C)
- Avoid bright screens 30 minutes before sleep`,
  },
  {
    id: 6,
    title: 'Track Your PRs',
    tag: 'TRACKING',
    color: '#1a1a1a',
    body: 'Recording personal records builds an objective feedback loop. Memory fades quickly, while logged numbers stay accurate.',
    detail: `Lifters often misjudge progression without written numbers. Logging sets gives you exact targets for your next gym visit.

**What to track:**
- Weight x reps for every working set
- Estimated 1RM (Weight x (1 + Reps/30)) via the Epley formula
- Session duration and total tonnage moved
- RPE shifts at the same load across weeks

**Signs of steady progression:**
- Same load at a lower RPE
- More reps at the same load
- Higher load for the same rep target`,
  },
];

// Tip Detail Panel
const TipPanel: React.FC<{ tip: typeof QUICK_TIPS[0]; onClose: () => void }> = ({ tip, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end">
    <div className="absolute inset-0 bg-black/25 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white border-l-2 border-[#1a1a1a] h-full overflow-y-auto shadow-[-8px_0_0_#1a1a1a] flex flex-col">
      <div className="p-6 border-b-2 border-[#1a1a1a] sticky top-0 bg-white z-10">
        <div className="flex justify-between items-start">
          <span
            className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 text-white"
            style={{ backgroundColor: tip.color }}
          >
            {tip.tag}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tip panel"
            className="cursor-pointer text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] mt-3">{tip.title}</h2>
      </div>

      <div className="p-6 flex-1">
        <p className="font-mono text-xs text-[#1a1a1a]/70 leading-relaxed mb-6">{tip.body}</p>
        <div className="space-y-2">
          {tip.detail.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={i} className="font-mono text-[0.65rem] font-bold uppercase text-[#1a1a1a] pt-2">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <div key={i} className="flex gap-2.5 pl-1 items-start">
                  <span className="w-1.5 h-1.5 bg-[#ff4d00] mt-1.5 shrink-0" />
                  <p className="font-mono text-[0.65rem] text-[#1a1a1a]/80 leading-relaxed">
                    {line.slice(2)}
                  </p>
                </div>
              );
            }
            if (/^\d\./.test(line)) {
              return (
                <div key={i} className="flex gap-2 pl-2">
                  <span className="font-mono text-[0.65rem] font-bold text-[#ff4d00] shrink-0">{line.split('.')[0]}.</span>
                  <p className="font-mono text-[0.65rem] text-[#1a1a1a]/80 leading-relaxed">
                    {line.split('.').slice(1).join('.').trim()}
                  </p>
                </div>
              );
            }
            return (
              <p key={i} className="font-mono text-[0.65rem] text-[#1a1a1a]/70 leading-relaxed">{line}</p>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  session,
  prs,
  workoutHistory,
  username,
  setActiveTab,
  weightUnit,
}) => {
  const [selectedTip, setSelectedTip] = useState<typeof QUICK_TIPS[0] | null>(null);
  const totalSets = session.exerciseGroups.reduce((a, g) => a + g.sets.length, 0);

  // Filter PRs to SBD (Squat, Bench, Deadlift)
  const sbdPrs = prs.filter(pr => {
    const name = pr.exerciseName.toLowerCase();
    return name.includes('squat') || name.includes('bench') || name.includes('deadlift');
  });

  // Real 7-day weekly volume from persisted completed workouts + current active session
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentWorkouts = workoutHistory.filter(w => {
    const ts = Date.parse(w.completedAt || w.startedAt);
    return !Number.isNaN(ts) && ts >= sevenDaysAgo;
  });
  const historyWeeklyVolumeLbs = recentWorkouts.reduce((sum, w) => sum + (w.totalVolumeLbs || 0), 0);
  const realWeeklyVolumeLbs = historyWeeklyVolumeLbs + session.totalVolumeLbs;

  // Dynamic workout streak from real workout history + local active progress
  const savedStreak = parseInt(localStorage.getItem(`flexpulse_streak_${username || 'Athlete'}`) || '0', 10);
  const baseStreak = Math.max(Number.isNaN(savedStreak) ? 0 : savedStreak, workoutHistory.length);
  const currentStreak = baseStreak + (totalSets > 0 ? 1 : 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="border-2 border-[#1a1a1a] bg-white p-6 md:p-8 shadow-[4px_4px_0_#1a1a1a] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase font-bold text-[#ff4d00] tracking-widest">Training Command</p>
          <h1 className="font-oswald text-3xl md:text-4xl uppercase font-bold text-[#1a1a1a] tracking-tight">
            Strength &amp; Volume Command
          </h1>
          <p className="font-mono text-xs text-[#1a1a1a]/70 max-w-xl leading-relaxed">
            Log barbell and dumbbell sets, auto-detect Epley 1RM personal records, and follow structured multi-day splits.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('live_workout')}
            className="action-btn primary"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Log Today&apos;s Session</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            className="action-btn"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Browse Programs</span>
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Sessions Logged',
            val: `${currentStreak} ${currentStreak === 1 ? 'Session' : 'Sessions'}`,
            sub: totalSets > 0 ? 'Active session counted' : 'Log a set to start',
            red: true,
          },
          {
            label: 'Weekly Volume',
            val: toDisplayWeight(realWeeklyVolumeLbs, weightUnit).toLocaleString(),
            sub: `${weightUnit} in last 7 days`,
            red: false,
          },
          {
            label: 'Personal Records',
            val: `${sbdPrs.length} PRs`,
            sub: 'Squat, Bench & Deadlift',
            red: true,
          },
          {
            label: 'Sets Today',
            val: String(totalSets),
            sub: `${toDisplayWeight(session.totalVolumeLbs, weightUnit).toLocaleString()} ${weightUnit} moved`,
            red: false,
          },
        ].map(m => (
          <div key={m.label} className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[2px_2px_0_#1a1a1a]">
            <p className="font-mono text-[0.65rem] uppercase text-[#1a1a1a]/60 font-bold">{m.label}</p>
            <div className={`font-mono text-3xl font-bold mt-2 ${m.red ? 'text-[#ff4d00]' : 'text-[#1a1a1a]'}`}>{m.val}</div>
            <span className="font-mono text-[10px] text-[#1a1a1a]/60 font-bold mt-2 block">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Main grid: PRs + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRs */}
        <div className="lg:col-span-2 border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-[#1a1a1a] pb-4">
            <div>
              <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#ff4d00]" />
                Personal Records
              </h2>
              <p className="font-mono text-xs text-[#1a1a1a]/60 mt-0.5">Auto-detected on Squat, Bench &amp; Deadlift sets</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('live_workout')}
              className="font-mono text-xs text-[#ff4d00] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Start Lifting <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sbdPrs.length === 0 ? (
              <div className="text-center py-8 font-mono text-xs text-[#1a1a1a]/50 uppercase">
                No SBD PRs recorded yet. Log a Squat, Bench, or Deadlift set in Today to set your baseline.
              </div>
            ) : sbdPrs.map(pr => (
              <div key={pr.id} className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] flex items-center justify-between">
                <div>
                  <h3 className="font-oswald text-lg uppercase font-semibold text-[#1a1a1a]">{pr.exerciseName}</h3>
                  <span className="font-mono text-[0.65rem] text-[#1a1a1a]/70 block mt-0.5">
                    {pr.muscleGroup} | Est. 1RM:{' '}
                    <strong className="text-[#1a1a1a]">{toDisplayWeight(pr.estimated1RM, weightUnit)} {weightUnit}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-[#ff4d00]">
                    {toDisplayWeight(pr.weightLbs, weightUnit)} {weightUnit}
                  </span>
                  <span className="font-mono text-xs text-[#1a1a1a]/60 block">x {pr.reps} reps</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] space-y-4">
          <div className="border-b-2 border-[#1a1a1a] pb-4">
            <h2 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#ff4d00]" />
              Training Tips
            </h2>
            <p className="font-mono text-xs text-[#1a1a1a]/60 mt-0.5">Select any guide to view full details</p>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {QUICK_TIPS.map(tip => (
              <button
                key={tip.id}
                type="button"
                onClick={() => setSelectedTip(tip)}
                className="w-full text-left p-3 bg-[#f8f7f4] border border-[#1a1a1a] hover:border-[#ff4d00] hover:shadow-[2px_2px_0_#ff4d00] transition cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[0.55rem] font-bold uppercase px-1.5 py-0.5 text-white"
                    style={{ backgroundColor: tip.color }}
                  >
                    {tip.tag}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#1a1a1a]/30 group-hover:text-[#ff4d00] transition" />
                </div>
                <h3 className="font-oswald text-sm uppercase font-semibold text-[#1a1a1a] group-hover:text-[#ff4d00] transition">
                  {tip.title}
                </h3>
                <p className="font-mono text-[0.65rem] text-[#1a1a1a]/70 leading-relaxed line-clamp-2">
                  {tip.body}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tip detail panel */}
      {selectedTip && <TipPanel tip={selectedTip} onClose={() => setSelectedTip(null)} />}
    </div>
  );
};
