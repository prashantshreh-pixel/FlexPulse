import React, { useState, useEffect } from 'react';
import { ViewTab, WorkoutSession, Exercise, PersonalRecord, SetLogItem, WorkoutProgram, WorkoutDay, WeightUnit, toStorageLbs } from './types';
import { INITIAL_EXERCISES, INITIAL_PROGRAMS, INITIAL_PRS, INITIAL_WORKOUT } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PrModal } from './components/PrModal';

const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const LiveWorkout = React.lazy(() => import('./components/LiveWorkout').then(module => ({ default: module.LiveWorkout })));
const ExerciseLibrary = React.lazy(() => import('./components/ExerciseLibrary').then(module => ({ default: module.ExerciseLibrary })));
const Routines = React.lazy(() => import('./components/Routines').then(module => ({ default: module.Routines })));

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('live_workout');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    return (localStorage.getItem('flexpulse_unit') as WeightUnit) || 'lbs';
  });

  const [session, setSession] = useState<WorkoutSession>(() => {
    try {
      const saved = localStorage.getItem('flexpulse_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.id === 'string' && Array.isArray(parsed.exerciseGroups)) {
          return parsed;
        }
      }
    } catch {
      // stale / corrupted data — start fresh
    }
    return { ...INITIAL_WORKOUT, id: `session-${Date.now()}` };
  });

  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);

  const [programs, setPrograms] = useState<WorkoutProgram[]>(() => {
    try {
      const saved = localStorage.getItem('flexpulse_custom_programs');
      const custom: WorkoutProgram[] = saved ? JSON.parse(saved) : [];
      return [...INITIAL_PROGRAMS, ...custom];
    } catch {
      return [...INITIAL_PROGRAMS];
    }
  });

  const [prs, setPrs] = useState<PersonalRecord[]>(INITIAL_PRS);
  const [timerTriggerKey, setTimerTriggerKey] = useState<number>(0);

  // PR modal
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [currentPrDetails, setCurrentPrDetails] = useState<{
    exerciseName: string; weightLbs: number; reps: number; muscleGroup?: string;
  } | null>(null);

  // Workout complete state
  const [workoutComplete, setWorkoutComplete] = useState(false);

  // Persist session
  useEffect(() => {
    localStorage.setItem('flexpulse_session', JSON.stringify(session));
  }, [session]);

  // Persist unit preference
  useEffect(() => {
    localStorage.setItem('flexpulse_unit', weightUnit);
  }, [weightUnit]);

  // Session timer (only when active and has exercises)
  useEffect(() => {
    if (session.status !== 'IN_PROGRESS' || session.exerciseGroups.length === 0) return;
    const interval = setInterval(() => {
      setSession(prev => ({ ...prev, durationSeconds: prev.durationSeconds + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.status, session.exerciseGroups.length]);

  const handleToggleUnit = () =>
    setWeightUnit(prev => prev === 'lbs' ? 'kg' : 'lbs');

  const handleSaveCustomProgram = (program: WorkoutProgram) => {
    setPrograms(prev => {
      const updated = [...prev, program];
      const customOnly = updated.filter(p => p.isCustom);
      localStorage.setItem('flexpulse_custom_programs', JSON.stringify(customOnly));
      return updated;
    });
  };

  const handleStartDay = (day: WorkoutDay, programName: string) => {
    const newGroups = day.exercises.map(item => {
      const ex = exercises.find(e => e.id === item.exerciseId);
      return {
        exerciseId: item.exerciseId,
        exerciseName: ex?.name || 'Exercise',
        muscleGroup: ex?.muscleGroup || 'Chest',
        equipment: ex?.equipment || 'Barbell',
        previousMaxLbs: 135,
        targetSets: item.sets,
        targetReps: item.reps,
        sets: [],
      };
    });
    setSession({
      id: `session-${Date.now()}`,
      title: `${programName} — ${day.name}`,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      totalVolumeLbs: 0,
      status: 'IN_PROGRESS',
      exerciseGroups: newGroups,
    });
    setWorkoutComplete(false);
    setActiveTab('live_workout');
  };

  const handleAddExerciseToSession = (exercise: Exercise) => {
    if (session.exerciseGroups.some(g => g.exerciseId === exercise.id)) return;
    setSession(prev => ({
      ...prev,
      exerciseGroups: [
        ...prev.exerciseGroups,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          previousMaxLbs: 135,
          sets: [],
        },
      ],
    }));
  };

  const handleLogSet = (exerciseId: string, weightInDisplayUnit: number, reps: number, rpe?: number) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    const exerciseName = exercise?.name || 'Exercise';
    const weightLbs = toStorageLbs(weightInDisplayUnit, weightUnit);
    const group = session.exerciseGroups.find(g => g.exerciseId === exerciseId);
    const isPR = weightLbs > (group?.previousMaxLbs || 0) && reps >= 1;

    const newSetLog: SetLogItem = {
      id: `set-${Date.now()}`,
      setNumber: (group?.sets.length || 0) + 1,
      weightLbs,
      reps,
      rpe: rpe || 8,
      isPR,
      loggedAt: new Date().toISOString(),
    };

    setSession(prev => ({
      ...prev,
      totalVolumeLbs: prev.totalVolumeLbs + weightLbs * reps,
      exerciseGroups: prev.exerciseGroups.map(g =>
        g.exerciseId === exerciseId
          ? { ...g, previousMaxLbs: Math.max(g.previousMaxLbs, weightLbs), sets: [...g.sets, newSetLog] }
          : g
      ),
    }));

    setTimerTriggerKey(prev => prev + 1);

    if (isPR) {
      const newPr: PersonalRecord = {
        id: `pr-${Date.now()}`,
        exerciseName,
        muscleGroup: exercise?.muscleGroup || 'Chest',
        weightLbs,
        reps,
        estimated1RM: Math.round(weightLbs * (1 + reps / 30)),
        achievedAt: new Date().toISOString(),
      };
      setPrs(prev => [newPr, ...prev]);
      setCurrentPrDetails({ exerciseName, weightLbs, reps, muscleGroup: exercise?.muscleGroup });
      setPrModalOpen(true);
    }
  };

  const handleFinishWorkout = () => {
    setSession(prev => ({ ...prev, status: 'COMPLETED' }));
    setWorkoutComplete(true);
  };

  const handleResetWorkout = () => {
    setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });
    setWorkoutComplete(false);
  };

  return (
    <div className="h-full bg-[#F8F7F4] text-[#111113] flex flex-col md:flex-row overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          restTimerDuration={90}
          timerAutoStartKey={timerTriggerKey}
          activeSessionTitle={session.title}
          weightUnit={weightUnit}
          onToggleUnit={handleToggleUnit}
        />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-10 dot-bg">
          <React.Suspense fallback={<div className="flex items-center justify-center h-full font-mono text-sm uppercase text-[#1a1a1a]/50">Loading...</div>}>
            {activeTab === 'dashboard' && (
              <Dashboard session={session} prs={prs} setActiveTab={setActiveTab} weightUnit={weightUnit} />
            )}
            {activeTab === 'live_workout' && (
              <LiveWorkout
                session={session}
                exercises={exercises}
                weightUnit={weightUnit}
                workoutComplete={workoutComplete}
                onLogSet={handleLogSet}
                onAddExerciseToSession={handleAddExerciseToSession}
                onFinishWorkout={handleFinishWorkout}
                onGoToRoutines={() => setActiveTab('routines')}
                onResetWorkout={handleResetWorkout}
              />
            )}
            {activeTab === 'exercises' && (
              <ExerciseLibrary
                exercises={exercises}
                weightUnit={weightUnit}
                onAddExercise={handleAddExerciseToSession}
              />
            )}
            {activeTab === 'routines' && (
              <Routines
                programs={programs}
                exercises={exercises}
                onStartDay={handleStartDay}
                onSaveCustomProgram={handleSaveCustomProgram}
              />
            )}
          </React.Suspense>
        </main>
      </div>

      <PrModal
        isOpen={prModalOpen}
        onClose={() => setPrModalOpen(false)}
        prDetails={currentPrDetails}
        weightUnit={weightUnit}
      />
    </div>
  );
}
