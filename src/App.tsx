import React, { useState, useEffect } from 'react';
import { ViewTab, WorkoutSession, Exercise, PersonalRecord, SetLogItem, WorkoutProgram, WorkoutDay, WeightUnit, toStorageLbs } from './types';
import { INITIAL_PRS, INITIAL_WORKOUT } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PrModal } from './components/PrModal';
import { AuthScreen } from './components/AuthScreen';

const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const LiveWorkout = React.lazy(() => import('./components/LiveWorkout').then(module => ({ default: module.LiveWorkout })));
const ExerciseLibrary = React.lazy(() => import('./components/ExerciseLibrary').then(module => ({ default: module.ExerciseLibrary })));
const Routines = React.lazy(() => import('./components/Routines').then(module => ({ default: module.Routines })));

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('live_workout');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    return (localStorage.getItem('flexpulse_unit') as WeightUnit) || 'lbs';
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem('flexpulse_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('flexpulse_username'));

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

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch static data from Django API
  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [exRes, rtRes, prRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/exercises/', { headers }),
          fetch('http://127.0.0.1:8000/api/routines/', { headers }),
          token ? fetch('http://127.0.0.1:8000/api/prs/', { headers }) : Promise.resolve(null)
        ]);
        
        if (!exRes.ok || !rtRes.ok) throw new Error("API response not ok");

        const exData = await exRes.json();
        const rtData = await rtRes.json();
        const prData = prRes && prRes.ok ? await prRes.json() : [];

        const mappedPrs: PersonalRecord[] = prData.map((pr: any) => ({
          id: `pr-${pr.id}`,
          exerciseName: pr.exercise_name,
          muscleGroup: pr.muscle_group,
          weightLbs: parseFloat(pr.weight_lbs),
          reps: pr.reps,
          estimated1RM: Math.round(parseFloat(pr.weight_lbs) * (1 + pr.reps / 30)),
          achievedAt: pr.logged_at,
        }));
        setPrs(mappedPrs.length > 0 ? mappedPrs : INITIAL_PRS);

        const mappedExercises: Exercise[] = exData.map((e: any) => ({
          id: `ex-${e.id}`, // match legacy format
          name: e.name,
          muscleGroup: e.muscle_group,
          equipment: e.equipment,
          category: e.category,
          instructions: e.instructions || '',
          isCustom: e.is_custom
        }));
        
        const mappedPrograms: WorkoutProgram[] = rtData.map((r: any) => {
          let chunkSize = 6;
          if (r.name.includes("Stronglifts")) chunkSize = 3;
          else if (r.name.includes("3")) chunkSize = 5;
          
          const days = [];
          for (let i = 0; i < r.exercises.length; i += chunkSize) {
            const chunk = r.exercises.slice(i, i + chunkSize);
            days.push({
              id: `day-${r.id}-${i/chunkSize + 1}`,
              label: `Day ${i/chunkSize + 1}`,
              name: `Workout ${i/chunkSize + 1}`,
              musclesFocus: [],
              exercises: chunk.map((re: any) => ({
                exerciseId: `ex-${re.exercise.id}`,
                sets: re.target_sets,
                reps: String(re.target_reps),
                restSeconds: 90,
                notes: re.notes || ''
              }))
            });
          }

          return {
            id: `prog-${r.id}`,
            name: r.name,
            shortName: r.name.substring(0, 4).toUpperCase(),
            split: 'Custom',
            description: r.description || '',
            frequency: 'Varies',
            difficulty: 'Intermediate',
            goal: 'General Fitness',
            days: days
          };
        });

        setExercises(mappedExercises);

        // Merge custom localStorage programs with DB templates
        const savedCustom = localStorage.getItem('flexpulse_custom_programs');
        const customPrograms: WorkoutProgram[] = savedCustom ? JSON.parse(savedCustom) : [];
        setPrograms([...mappedPrograms, ...customPrograms]);

      } catch (err) {
        console.error("Failed to fetch data from Django API:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [token]);

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

  const handleFinishWorkout = async () => {
    // Construct payload matching WorkoutLogSerializer
    const payload = {
      title: session.title,
      started_at: session.startedAt,
      completed_at: new Date().toISOString(),
      duration_seconds: session.durationSeconds,
      status: 'COMPLETED',
      sets: session.exerciseGroups.flatMap(group => 
        group.sets.map(setLog => ({
          exercise_id: parseInt(group.exerciseId.replace('ex-', '')),
          set_number: setLog.setNumber,
          weight_lbs: setLog.weightLbs,
          reps: setLog.reps,
          rpe: setLog.rpe
        }))
      )
    };

    if (token) {
      try {
        await fetch('http://127.0.0.1:8000/api/workouts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to save workout to DB", err);
      }
    }

    setSession(prev => ({ ...prev, status: 'COMPLETED' }));
    setWorkoutComplete(true);
  };

  const handleResetWorkout = () => {
    setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });
    setWorkoutComplete(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('flexpulse_token');
    localStorage.removeItem('flexpulse_username');
    // Clear session so the new user doesn't see the old user's workout
    setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });
    localStorage.removeItem('flexpulse_session');
    setWorkoutComplete(false);
  };

  if (!token) {
    return (
      <AuthScreen 
        onAuthSuccess={(newToken, newUsername) => {
          setToken(newToken);
          setUsername(newUsername);
          localStorage.setItem('flexpulse_token', newToken);
          localStorage.setItem('flexpulse_username', newUsername);
        }} 
      />
    );
  }

  return (
    <div className="h-[100dvh] bg-[#F8F7F4] text-[#111113] flex flex-col md:flex-row overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        username={username || 'Athlete'}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          restTimerDuration={90}
          timerAutoStartKey={timerTriggerKey}
          activeSessionTitle={session.title}
          weightUnit={weightUnit}
          onToggleUnit={handleToggleUnit}
        />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-10 dot-bg">
          {isLoadingData ? (
            <div className="flex items-center justify-center h-full font-mono text-sm uppercase text-[#1a1a1a]/50 flex-col gap-4">
              <div className="w-8 h-8 border-4 border-[#ff4d00] border-t-transparent rounded-full animate-spin"></div>
              Loading Data from Server...
            </div>
          ) : (
            <React.Suspense fallback={<div className="flex items-center justify-center h-full font-mono text-sm uppercase text-[#1a1a1a]/50">Loading Module...</div>}>
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
          )}
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
