import React, { useState } from 'react';
import { Exercise, WorkoutSession, MuscleGroup, WeightUnit, toDisplayWeight, toStorageLbs } from '../types';
import { Plus, Check, CalendarDays, Dumbbell, ChevronRight, Info, X } from 'lucide-react';

interface LiveWorkoutProps {
  session: WorkoutSession;
  exercises: Exercise[];
  weightUnit: WeightUnit;
  workoutComplete: boolean;
  onLogSet: (exerciseId: string, weightInDisplayUnit: number, reps: number, rpe?: number) => void;
  onAddExerciseToSession: (exercise: Exercise) => void;
  onFinishWorkout: () => void;
  onGoToRoutines: () => void;
  onResetWorkout: () => void;
}

const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getTodayLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const REST_IMAGES = [
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&h=400&fit=crop',
  'https://images.unsplash.com/photo-1516407718571-40c19babb26e?w=700&h=400&fit=crop',
];
const REST_QUOTES = [
  'Recovery is not the absence of training — it IS training.',
  'Your muscles grow during rest, not during the workout.',
  'Champions are built in the recovery room, not just the weight room.',
  'Rest days are part of the plan, not a break from it.',
];
const pickedImage = REST_IMAGES[Math.floor(Math.random() * REST_IMAGES.length)];
const pickedQuote = REST_QUOTES[Math.floor(Math.random() * REST_QUOTES.length)];

// ── RPE Info Tooltip ─────────────────────────────────────────────────────────
const RPE_TOOLTIP: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="absolute top-full left-0 mt-1 z-30 w-52 bg-[#1a1a1a] text-[#f8f7f4] p-3 shadow-[4px_4px_0_#ff4d00] border border-[#ff4d00]">
    <div className="flex justify-between items-center mb-2">
      <span className="font-mono text-[0.6rem] font-black uppercase text-[#ff4d00]">RPE Scale</span>
      <button onClick={onClose} className="cursor-pointer text-[#f8f7f4]/60 hover:text-[#f8f7f4]">
        <X className="w-3 h-3" />
      </button>
    </div>
    {[
      { val: 10, label: 'Max effort — no reps left', star: false },
      { val: 9,  label: '1 rep left in the tank',   star: false },
      { val: 8,  label: '2 reps left ★ Sweet spot', star: true  },
      { val: 7,  label: '3 reps left',              star: false },
      { val: 6,  label: '4+ reps — warm-up range',  star: false },
    ].map(r => (
      <div key={r.val} className={`flex gap-2 py-1 border-b border-white/10 last:border-0 ${r.star ? 'text-[#ff4d00] font-bold' : ''}`}>
        <span className="font-mono text-xs w-4 shrink-0">{r.val}</span>
        <span className="font-mono text-[0.6rem] leading-tight">{r.label}</span>
      </div>
    ))}
  </div>
);

export const LiveWorkout: React.FC<LiveWorkoutProps> = ({
  session, exercises, weightUnit, workoutComplete,
  onLogSet, onAddExerciseToSession, onFinishWorkout, onGoToRoutines, onResetWorkout,
}) => {
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [showRpeInfo, setShowRpeInfo]   = useState(false);
  const [showCompleteToast, setShowCompleteToast] = useState(true);

  const [inputStates, setInputStates] = useState<{
    [exerciseId: string]: { weight: number; reps: number; rpe: number };
  }>({});

  const muscleOptions: (MuscleGroup | 'All')[] = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const filteredExercises = exercises.filter(ex => {
    const q = searchQuery.toLowerCase();
    const matchSearch = ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
    const matchMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
    return matchSearch && matchMuscle;
  });

  const handleInputChange = (exerciseId: string, field: 'weight' | 'reps' | 'rpe', value: number) => {
    setInputStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { weight: weightUnit === 'kg' ? 60 : 135, reps: 10, rpe: 8 }),
        [field]: value,
      },
    }));
  };

  const handleLogSet = (e: React.FormEvent, exerciseId: string) => {
    e.preventDefault();
    const state = inputStates[exerciseId] || { weight: weightUnit === 'kg' ? 60 : 135, reps: 10, rpe: 8 };
    onLogSet(exerciseId, state.weight, state.reps, state.rpe);
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayWeight = (lbs: number) => toDisplayWeight(lbs, weightUnit);

  // ── WORKOUT COMPLETE STATE ─────────────────────────────────────────────────
  if (workoutComplete) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 fade-in-up">
        {/* Toast */}
        {showCompleteToast && (
          <div className="slide-in-right fixed top-6 right-6 z-50 w-80 bg-[#1a1a1a] text-[#f8f7f4] border-2 border-[#ff4d00] p-5 shadow-[4px_4px_0_#ff4d00]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-[0.55rem] font-black uppercase text-[#ff4d00]">Workout Complete!</span>
              <button onClick={() => setShowCompleteToast(false)} className="cursor-pointer text-[#f8f7f4]/60 hover:text-[#f8f7f4]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="font-oswald text-2xl uppercase font-semibold">Congratulations! 🎉</p>
            <p className="font-mono text-[0.65rem] text-[#f8f7f4]/70 mt-2 leading-relaxed">
              You logged{' '}
              <strong className="text-[#ff4d00]">{session.exerciseGroups.reduce((a, g) => a + g.sets.length, 0)} sets</strong>{' '}
              and moved{' '}
              <strong className="text-[#ff4d00]">{toDisplayWeight(session.totalVolumeLbs, weightUnit).toLocaleString()} {weightUnit}</strong>.
            </p>
          </div>
        )}

        {/* Rest day card */}
        <div className="border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0_#1a1a1a] overflow-hidden">
          <img
            src={pickedImage}
            alt="Rest and recover"
            className="w-full h-56 object-cover border-b-2 border-[#1a1a1a]"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="p-8 space-y-4">
            <p className="font-mono text-xs uppercase font-bold text-[#ff4d00] tracking-widest">Workout Complete</p>
            <h2 className="font-oswald text-4xl uppercase font-semibold text-[#1a1a1a]">
              Time to Recover 🛌
            </h2>
            <p className="font-mono text-sm text-[#1a1a1a]/60 italic leading-relaxed max-w-lg">
              "{pickedQuote}"
            </p>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-[#1a1a1a]">
              {[
                ['Duration', formatDuration(session.durationSeconds)],
                ['Total Volume', `${toDisplayWeight(session.totalVolumeLbs, weightUnit).toLocaleString()} ${weightUnit}`],
                ['Sets Logged', String(session.exerciseGroups.reduce((a, g) => a + g.sets.length, 0))],
              ].map(([label, val]) => (
                <div key={label} className="text-center">
                  <span className="font-mono text-[0.6rem] uppercase text-[#1a1a1a]/50 font-bold block">{label}</span>
                  <span className="font-mono text-lg font-bold text-[#1a1a1a] block">{val}</span>
                </div>
              ))}
            </div>

            {/* Rest day tips */}
            <div className="space-y-2 pt-2">
              <h3 className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60">Tomorrow's Recovery Checklist</h3>
              {[
                '💧 Drink at least 3L of water to rehydrate',
                '🥩 Eat 1.6–2.2g of protein per kg of bodyweight',
                '😴 Aim for 8+ hours of sleep for muscle synthesis',
                '🧘 Light stretching or walking — stay mobile',
              ].map(tip => (
                <p key={tip} className="font-mono text-[0.65rem] text-[#1a1a1a]/70 leading-relaxed">{tip}</p>
              ))}
            </div>

            <button
              onClick={onResetWorkout}
              className="mt-2 flex items-center gap-2 bg-[#1a1a1a] text-[#f8f7f4] border-2 border-[#1a1a1a] px-6 py-3 font-oswald uppercase text-sm font-semibold hover:bg-[#ff4d00] hover:border-[#ff4d00] transition cursor-pointer"
            >
              Start New Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EMPTY STATE ────────────────────────────────────────────────────────────
  if (session.exerciseGroups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-[#ff4d00]" />
          <span className="font-mono text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-widest">
            {getTodayLabel()}
          </span>
        </div>

        <div className="border-2 border-[#1a1a1a] bg-white p-10 shadow-[4px_4px_0_#1a1a1a] text-center space-y-6">
          <div className="w-20 h-20 bg-[#f8f7f4] border-2 border-[#1a1a1a] mx-auto grid place-items-center shadow-[2px_2px_0_#1a1a1a]">
            <Dumbbell className="w-10 h-10 text-[#1a1a1a]/30" />
          </div>
          <div>
            <h2 className="font-oswald text-3xl uppercase font-semibold text-[#1a1a1a]">
              No Workout Planned
            </h2>
            <p className="font-mono text-xs text-[#1a1a1a]/60 mt-2 leading-relaxed max-w-xs mx-auto">
              Pick a program from Routines and start a training day, or add individual exercises below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onGoToRoutines}
              className="flex items-center justify-center gap-2 bg-[#1a1a1a] text-[#f8f7f4] border-2 border-[#1a1a1a] px-6 py-3 font-oswald uppercase text-sm font-semibold hover:bg-[#ff4d00] hover:border-[#ff4d00] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              Browse Routines
            </button>
            <button
              onClick={() => setIsAddDrawerOpen(true)}
              className="flex items-center justify-center gap-2 bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] px-6 py-3 font-oswald uppercase text-sm font-semibold hover:bg-[#1a1a1a]/5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>
        </div>

        {isAddDrawerOpen && (
          <div className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0_#1a1a1a] space-y-4">
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="border-2 border-[#1a1a1a] p-2 font-mono text-sm flex-1 min-w-[160px] bg-white"
              />
              <div className="flex gap-1 flex-wrap">
                {muscleOptions.map(m => (
                  <button key={m} onClick={() => setSelectedMuscle(m)}
                    className={`font-mono text-[0.6rem] px-2 py-1 uppercase font-bold transition cursor-pointer border ${
                      selectedMuscle === m ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#1a1a1a]/30 text-[#1a1a1a] hover:border-[#1a1a1a]'
                    }`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredExercises.map(ex => (
                <div key={ex.id} onClick={() => { onAddExerciseToSession(ex); setIsAddDrawerOpen(false); }}
                  className="p-3 bg-[#f8f7f4] border border-[#1a1a1a] hover:bg-[#ff4d00] hover:text-white cursor-pointer transition flex items-center justify-between group">
                  <div>
                    <h4 className="font-oswald uppercase text-sm font-semibold">{ex.name}</h4>
                    <span className="font-mono text-[0.6rem] opacity-70">{ex.muscleGroup} • {ex.equipment}</span>
                  </div>
                  <Plus className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE WORKOUT ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Session header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b-2 border-[#1a1a1a]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-[#ff4d00]" />
            <span className="font-mono text-xs font-bold text-[#1a1a1a]/60 uppercase tracking-widest">
              {getTodayLabel()}
            </span>
          </div>
          <h2 className="font-oswald text-4xl md:text-5xl uppercase font-semibold text-[#1a1a1a] leading-tight">
            {session.title}
          </h2>
          <div className="font-mono text-xs text-[#1a1a1a]/60 mt-3 flex items-center gap-4 font-semibold">
            <span>{formatDuration(session.durationSeconds)} elapsed</span>
            <span>•</span>
            <span>{toDisplayWeight(session.totalVolumeLbs, weightUnit).toLocaleString()} {weightUnit} volume</span>
            <span>•</span>
            <span>{session.exerciseGroups.reduce((a, g) => a + g.sets.length, 0)} sets logged</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setIsAddDrawerOpen(v => !v)} className="action-btn">
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
          <button onClick={onFinishWorkout} className="action-btn primary">
            <Check className="w-4 h-4" />
            <span>Complete</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-2 border-[#1a1a1a] p-4 bg-white flex flex-col md:flex-row gap-4 items-center justify-between shadow-[2px_2px_0_#1a1a1a]">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter exercises..."
          className="font-mono text-sm border-none focus:outline-none flex-1 w-full bg-transparent"
        />
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {muscleOptions.map(m => (
            <button key={m} onClick={() => setSelectedMuscle(m)}
              className={`font-mono text-[0.65rem] px-2.5 py-1 uppercase font-semibold transition cursor-pointer border whitespace-nowrap ${
                selectedMuscle === m ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#1a1a1a]/20 bg-transparent text-[#1a1a1a] hover:border-[#1a1a1a]'
              }`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Add drawer */}
      {isAddDrawerOpen && (
        <div className="p-4 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#1a1a1a]/20">
            <span className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/70">
              Library ({filteredExercises.length} results)
            </span>
            <button onClick={() => setIsAddDrawerOpen(false)} className="font-mono text-xs text-[#ff4d00] font-bold hover:underline cursor-pointer">[CLOSE]</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {filteredExercises.map(ex => (
              <div key={ex.id} onClick={() => { onAddExerciseToSession(ex); setIsAddDrawerOpen(false); }}
                className="p-3 bg-[#f8f7f4] border border-[#1a1a1a] hover:bg-[#ff4d00] hover:text-white cursor-pointer transition flex items-center justify-between group">
                <div>
                  <h4 className="font-oswald uppercase text-sm font-semibold">{ex.name}</h4>
                  <span className="font-mono text-[0.6rem] opacity-70">{ex.muscleGroup} • {ex.equipment}</span>
                </div>
                <Plus className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise logging cards */}
      <div className="grid grid-cols-1 gap-8">
        {session.exerciseGroups.map(group => {
          const inputs = inputStates[group.exerciseId] || {
            weight: weightUnit === 'kg' ? 60 : 135,
            reps: 10,
            rpe: 8,
          };
          const targetSets  = group.targetSets;
          const done        = group.sets.length;
          const progress    = targetSets ? Math.min(done / targetSets, 1) : null;

          return (
            <div key={group.exerciseId} className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a]">
              {/* Card header */}
              <div className="flex justify-between items-start pb-3 mb-4 border-b-2 border-[#1a1a1a]">
                <div>
                  <h3 className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a]">
                    {group.exerciseName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="font-mono text-[0.6rem] text-[#1a1a1a]/60 uppercase">
                      {group.muscleGroup} • {group.equipment}
                    </span>
                    {group.targetSets && group.targetReps && (
                      <span className="font-mono text-[0.6rem] bg-[#ff4d00] text-white px-1.5 py-0.5 font-bold uppercase">
                        Target: {group.targetSets}×{group.targetReps}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[0.65rem] text-[#1a1a1a]/60 font-semibold uppercase block">
                    MAX: {displayWeight(group.previousMaxLbs)} {weightUnit}
                  </span>
                  {progress !== null && (
                    <div className="mt-2 w-24">
                      <div className="h-1.5 bg-[#1a1a1a]/10 border border-[#1a1a1a]/20">
                        <div className="h-full bg-[#ff4d00] transition-all" style={{ width: `${progress * 100}%` }} />
                      </div>
                      <span className="font-mono text-[0.55rem] text-[#1a1a1a]/50 uppercase">{done}/{targetSets} sets</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sets table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#1a1a1a]">
                      <th className="font-mono text-[0.6rem] uppercase p-3">Set</th>
                      <th className="font-mono text-[0.6rem] uppercase p-3">Previous</th>
                      <th className="font-mono text-[0.6rem] uppercase p-3">Weight ({weightUnit})</th>
                      <th className="font-mono text-[0.6rem] uppercase p-3">Reps</th>
                      <th className="font-mono text-[0.6rem] uppercase p-3 relative">
                        <span className="flex items-center gap-1">
                          RPE
                          <button
                            type="button"
                            onClick={() => setShowRpeInfo(v => !v)}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1a1a1a]/10 hover:bg-[#ff4d00] hover:text-white transition text-[0.5rem] font-black cursor-pointer"
                          >i</button>
                        </span>
                        {showRpeInfo && <RPE_TOOLTIP onClose={() => setShowRpeInfo(false)} />}
                      </th>
                      <th className="font-mono text-[0.6rem] uppercase p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Logged sets */}
                    {group.sets.map(setLog => (
                      <tr key={setLog.id}
                        className={setLog.isPR
                          ? 'bg-[#fffbeb] text-[#92400e] font-bold border-b border-[#1a1a1a]/10'
                          : 'bg-[#f0fdf4] text-[#166534] border-b border-[#1a1a1a]/10'}
                      >
                        <td className="font-mono text-sm p-3 font-semibold">0{setLog.setNumber}</td>
                        <td className="font-mono text-sm p-3">{displayWeight(setLog.weightLbs)}×{setLog.reps}</td>
                        <td className="font-mono text-sm p-3 font-bold">{displayWeight(setLog.weightLbs)}</td>
                        <td className="font-mono text-sm p-3 font-bold">{setLog.reps}</td>
                        <td className="font-mono text-sm p-3">{setLog.rpe || 8}</td>
                        <td className="font-mono text-xs p-3 text-right font-bold uppercase">
                          {setLog.isPR ? '🏆 NEW PR' : '✓ LOGGED'}
                        </td>
                      </tr>
                    ))}

                    {/* Input row */}
                    <tr>
                      <td className="font-mono text-sm p-3 font-semibold text-[#1a1a1a]">0{group.sets.length + 1}</td>
                      <td className="font-mono text-xs p-3 text-[#1a1a1a]/60">
                        {displayWeight(group.previousMaxLbs)} {weightUnit}
                      </td>
                      <td className="p-2">
                        <input type="number" step={weightUnit === 'kg' ? '0.25' : '2.5'} value={inputs.weight}
                          onChange={e => handleInputChange(group.exerciseId, 'weight', parseFloat(e.target.value) || 0)}
                          className="border-2 border-[#1a1a1a] p-1.5 w-20 font-mono text-sm bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input type="number" min={1} value={inputs.reps}
                          onChange={e => handleInputChange(group.exerciseId, 'reps', parseInt(e.target.value) || 0)}
                          className="border-2 border-[#1a1a1a] p-1.5 w-16 font-mono text-sm bg-white"
                        />
                      </td>
                      <td className="p-2">
                        <input type="number" min={1} max={10} step={1} value={inputs.rpe}
                          onChange={e => handleInputChange(group.exerciseId, 'rpe', parseInt(e.target.value) || 8)}
                          className="border-2 border-[#1a1a1a] p-1.5 w-16 font-mono text-sm bg-white"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <form onSubmit={e => handleLogSet(e, group.exerciseId)} className="inline-block">
                          <button type="submit"
                            className="bg-[#1a1a1a] text-[#f8f7f4] border-2 border-[#1a1a1a] px-4 py-1.5 font-oswald uppercase text-sm tracking-wider font-semibold cursor-pointer hover:bg-[#ff4d00] transition">
                            Log Set
                          </button>
                        </form>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
