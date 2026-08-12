import React, { useState } from 'react';
import { ViewTab, WorkoutSession, PersonalRecord, WeightUnit, toDisplayWeight } from '../types';
import { Zap, Trophy, ChevronRight, Lightbulb, ChevronDown, ChevronUp, X } from 'lucide-react';

interface DashboardProps {
  session: WorkoutSession;
  prs: PersonalRecord[];
  setActiveTab: (tab: ViewTab) => void;
  weightUnit: WeightUnit;
}

const QUICK_TIPS = [
  {
    id: 1,
    title: 'Progressive Overload',
    tag: 'PRINCIPLE',
    color: '#ff4d00',
    body: 'Increase weight by 2.5–5 lbs when you can complete all target reps with perfect form. This is the #1 driver of muscle and strength gains.',
    detail: `Progressive overload is the gradual increase of stress placed upon the body during training. It's the most fundamental principle in strength training.

**How to apply it:**
• Add weight (2.5–5 lbs) once you hit the top of your rep range
• Add reps if you can't add weight yet
• Reduce rest time to increase workout density
• Increase range of motion for more stimulus
• Add sets over weeks (volume progression)

Track every session. What gets measured gets improved.`,
  },
  {
    id: 2,
    title: 'Rest Timer Matters',
    tag: 'RECOVERY',
    color: '#1a1a1a',
    body: 'Compounds (squat, bench, deadlift) need 2–3 min rest. Isolation work needs only 60–90 sec.',
    detail: `Rest periods directly impact your performance on the next set. Going too short reduces strength output; going too long bleeds unnecessary time.

**Optimal rest by lift type:**
• Compound lifts (squat, bench, deadlift, OHP): 2–4 minutes
• Accessory compounds (rows, dips, lunges): 90–120 seconds  
• Isolation work (curls, laterals, flyes): 60–90 seconds
• Supersets: 45–60 seconds between movements

Use the built-in rest timer every set — consistency here is a game changer.`,
  },
  {
    id: 3,
    title: 'Understanding RPE',
    tag: 'METRICS',
    color: '#1a1a1a',
    body: 'RPE 10 = absolute max, RPE 8 = 2 reps left in the tank. Aim for RPE 7–9 on working sets.',
    detail: `Rate of Perceived Exertion (RPE) is a subjective measure of how hard a set feels relative to your maximum.

**RPE Scale:**
• RPE 10: Could not do another rep — absolute limit
• RPE 9: Could squeeze out exactly 1 more rep
• RPE 8: 2 reps left — ideal for hypertrophy work
• RPE 7: 3 reps left — great for building volume
• RPE 6: 4+ reps in reserve — warm-ups and technique work

Training at RPE 7–9 hits the sweet spot of muscle stimulus without excessive CNS fatigue. Avoid training at RPE 10 every set — it blunts recovery.`,
  },
  {
    id: 4,
    title: 'Compounds First',
    tag: 'TECHNIQUE',
    color: '#ff4d00',
    body: 'Always perform multi-joint compound lifts at the start of your session when your CNS is freshest.',
    detail: `Your central nervous system (CNS) and muscular coordination are at peak performance at the start of a workout. Multi-joint, high-skill lifts require this fresh state for maximum performance and safety.

**Training order:**
1. Primary compound (squat, bench, deadlift, OHP)
2. Secondary compound (rows, lunges, dips)
3. Accessory isolation work
4. Core / direct arm work last

Doing curls before deadlifts is leaving gains on the table. The compound lift is the engine — protect it.`,
  },
  {
    id: 5,
    title: 'Sleep = Gains',
    tag: 'RECOVERY',
    color: '#1a1a1a',
    body: 'Muscle protein synthesis peaks during deep sleep. Aim for 7–9 hours. Sleep deprivation reduces testosterone by up to 15%.',
    detail: `Sleep is the most anabolic (muscle-building) time in your day. Growth hormone is secreted primarily during deep sleep — no sleep, no growth.

**What happens while you sleep:**
• Growth hormone peaks in the first few hours of deep sleep
• Muscle protein synthesis repairs damaged muscle fibers
• Cortisol (stress hormone) decreases, allowing recovery
• Testosterone is replenished for the next day

**Improve sleep quality:**
• Set a consistent sleep/wake schedule (even weekends)
• Keep your room cold (65–68°F / 18–20°C)
• No screens 30 min before bed
• Magnesium glycinate 200mg before bed can help`,
  },
  {
    id: 6,
    title: 'Track Your PRs',
    tag: 'TRACKING',
    color: '#1a1a1a',
    body: 'Recording personal records creates a data-driven feedback loop. Your memory is unreliable — the data never lies.',
    detail: `Most lifters dramatically overestimate how much they've progressed without objective data. Tracking PRs creates accountability and motivation.

**What to track:**
• Weight × reps for every key lift
• Estimated 1RM (Weight × (1 + Reps/30)) — the Epley formula
• Session duration and total volume
• RPE trends — if RPE increases at the same weight, recovery is lagging

**Signs you're progressing:**
• Same weight at lower RPE
• More reps at the same weight
• Same reps at higher weight

Use this app to track every set. PRs are detected automatically.`,
  },
];

// ── Tip Detail Panel ─────────────────────────────────────────────────────────
const TipPanel: React.FC<{ tip: typeof QUICK_TIPS[0]; onClose: () => void }> = ({ tip, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white border-l-2 border-[#1a1a1a] h-full overflow-y-auto shadow-[-8px_0_0_#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b-2 border-[#1a1a1a] sticky top-0 bg-white z-10">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[0.55rem] font-bold uppercase px-2 py-0.5 text-white"
            style={{ backgroundColor: tip.color }}>{tip.tag}</span>
          <button onClick={onClose} className="cursor-pointer text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] mt-3">{tip.title}</h2>
      </div>

      {/* Body */}
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
            if (line.startsWith('•')) {
              return (
                <div key={i} className="flex gap-2 pl-2">
                  <span className="text-[#ff4d00] font-bold text-sm shrink-0">•</span>
                  <p className="font-mono text-[0.65rem] text-[#1a1a1a]/80 leading-relaxed">
                    {line.replace('• ', '')}
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

export const Dashboard: React.FC<DashboardProps> = ({ session, prs, setActiveTab, weightUnit }) => {
  const [selectedTip, setSelectedTip] = useState<typeof QUICK_TIPS[0] | null>(null);
  const totalSets = session.exerciseGroups.reduce((a, g) => a + g.sets.length, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="font-mono text-xs uppercase font-bold text-[#ff4d00]">Dashboard</p>
          <h2 className="font-oswald text-4xl font-semibold uppercase text-[#1a1a1a] mt-1">
            Workout OS v2.0
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/70 mt-2 max-w-xl leading-relaxed">
            Your personal training command center. Track sets, break PRs, and stick to your program.
          </p>
        </div>
        <button onClick={() => setActiveTab('live_workout')} className="action-btn primary shrink-0">
          <Zap className="w-4 h-4 fill-white" />
          <span>Today's Workout</span>
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Workout Streak',   val: '14 Days',      sub: '+2 days this week',                       red: true  },
          { label: 'Weekly Volume',    val: toDisplayWeight(session.totalVolumeLbs + 38800, weightUnit).toLocaleString(), sub: `${weightUnit} this week`, red: false },
          { label: 'Personal Records', val: `${prs.length} PRs`, sub: 'lifetime',                           red: true  },
          { label: 'Sets Today',       val: String(totalSets),   sub: `${toDisplayWeight(session.totalVolumeLbs, weightUnit).toLocaleString()} ${weightUnit}`, red: false },
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
              <h3 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#ff4d00]" />
                Personal Records
              </h3>
              <p className="font-mono text-xs text-[#1a1a1a]/60 mt-0.5">Auto-detected on every set</p>
            </div>
            <button onClick={() => setActiveTab('live_workout')}
              className="font-mono text-xs text-[#ff4d00] font-bold hover:underline flex items-center gap-1 cursor-pointer">
              Start Lifting <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {prs.length === 0 ? (
              <div className="text-center py-8 font-mono text-xs text-[#1a1a1a]/40 uppercase">
                No PRs yet — start your first workout!
              </div>
            ) : prs.map(pr => (
              <div key={pr.id} className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] flex items-center justify-between">
                <div>
                  <h4 className="font-oswald text-lg uppercase font-semibold text-[#1a1a1a]">{pr.exerciseName}</h4>
                  <span className="font-mono text-[0.65rem] text-[#1a1a1a]/70 block mt-0.5">
                    {pr.muscleGroup} • Est. 1RM:{' '}
                    <strong className="text-[#1a1a1a]">{toDisplayWeight(pr.estimated1RM, weightUnit)} {weightUnit}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-[#ff4d00]">
                    {toDisplayWeight(pr.weightLbs, weightUnit)} {weightUnit}
                  </span>
                  <span className="font-mono text-xs text-[#1a1a1a]/60 block">× {pr.reps} reps</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] space-y-4">
          <div className="border-b-2 border-[#1a1a1a] pb-4">
            <h3 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#ff4d00]" />
              Training Tips
            </h3>
            <p className="font-mono text-xs text-[#1a1a1a]/60 mt-0.5">Click any tip to learn more →</p>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {QUICK_TIPS.map(tip => (
              <button
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                className="w-full text-left p-3 bg-[#f8f7f4] border border-[#1a1a1a] hover:border-[#ff4d00] hover:shadow-[2px_2px_0_#ff4d00] transition cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.55rem] font-bold uppercase px-1.5 py-0.5 text-white"
                    style={{ backgroundColor: tip.color }}>{tip.tag}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#1a1a1a]/30 group-hover:text-[#ff4d00] transition" />
                </div>
                <h4 className="font-oswald text-sm uppercase font-semibold text-[#1a1a1a] group-hover:text-[#ff4d00] transition">
                  {tip.title}
                </h4>
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
