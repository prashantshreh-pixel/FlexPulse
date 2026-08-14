import React, { useState, useEffect } from 'react';
import { ViewTab, WorkoutSession, Exercise, PersonalRecord, SetLogItem, WorkoutProgram, WorkoutDay, WeightUnit, toStorageLbs } from './types';
import { INITIAL_PRS, INITIAL_WORKOUT } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PrModal } from './components/PrModal';
import { AuthScreen } from './components/AuthScreen';

import { Dashboard } from './components/Dashboard';
import { LiveWorkout } from './components/LiveWorkout';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { Routines } from './components/Routines';
import { Profile } from './components/Profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('live_workout');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    return (localStorage.getItem('flexpulse_unit') as WeightUnit) || 'lbs';
  });

  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('flexpulse_dark_mode') === 'true';
  });

  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [activeRoutineNextDayIndex, setActiveRoutineNextDayIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync active routine state when user changes
  useEffect(() => {
    if (username) {
      setActiveRoutineId(localStorage.getItem(`flexpulse_active_routine_${username}`));
      const val = localStorage.getItem(`flexpulse_active_routine_day_${username}`);
      setActiveRoutineNextDayIndex(val ? parseInt(val) : 0);
    } else {
      setActiveRoutineId(null);
      setActiveRoutineNextDayIndex(0);
    }
  }, [username]);

  // Sync session state when user changes
  useEffect(() => {
    if (username) {
      try {
        const saved = localStorage.getItem(`flexpulse_session_${username}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.id === 'string' && Array.isArray(parsed.exerciseGroups)) {
            setSession(parsed);
            return;
          }
        }
      } catch {}
    }
    setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });
  }, [username]);

  // Apply dark mode theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('flexpulse_dark_mode', String(darkMode));
  }, [darkMode]);

  const [session, setSession] = useState<WorkoutSession>(() => {
    const currentUsername = localStorage.getItem('flexpulse_username');
    try {
      const saved = localStorage.getItem(currentUsername ? `flexpulse_session_${currentUsername}` : 'flexpulse_session');
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

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const cached = localStorage.getItem('flexpulse_cached_exercises');
    return cached ? JSON.parse(cached) : [];
  });
  const [programs, setPrograms] = useState<WorkoutProgram[]>(() => {
    const cached = localStorage.getItem('flexpulse_cached_programs');
    return cached ? JSON.parse(cached) : [];
  });
  const [isLoadingData, setIsLoadingData] = useState(() => {
    return !localStorage.getItem('flexpulse_cached_exercises');
  });

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
          fetch('/api/exercises/', { headers }),
          fetch('/api/routines/', { headers }),
          token ? fetch('/api/prs/', { headers }) : Promise.resolve(null)
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
        localStorage.setItem('flexpulse_cached_exercises', JSON.stringify(mappedExercises));

        // Merge custom localStorage programs with DB templates
        const savedCustom = localStorage.getItem('flexpulse_custom_programs');
        const customPrograms: WorkoutProgram[] = savedCustom ? JSON.parse(savedCustom) : [];
        const mergedPrograms = [...mappedPrograms, ...customPrograms];
        setPrograms(mergedPrograms);
        localStorage.setItem('flexpulse_cached_programs', JSON.stringify(mergedPrograms));

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
    if (username) {
      localStorage.setItem(`flexpulse_session_${username}`, JSON.stringify(session));
    }
  }, [session, username]);

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

  const handleActivateRoutine = (routineId: string | null) => {
    setActiveRoutineId(routineId);
    setActiveRoutineNextDayIndex(0);
    setWorkoutComplete(false);
    if (username) {
      // Clear session state and storage when active routine changes or is removed
      localStorage.removeItem(`flexpulse_session_${username}`);
      localStorage.removeItem('flexpulse_session');
      setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });

      if (routineId) {
        localStorage.setItem(`flexpulse_active_routine_${username}`, String(routineId));
        localStorage.setItem(`flexpulse_active_routine_day_${username}`, '0');
        setActiveTab('live_workout');
      } else {
        localStorage.removeItem(`flexpulse_active_routine_${username}`);
        localStorage.removeItem(`flexpulse_active_routine_day_${username}`);
      }
    }
  };

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
        setIsSaving(true);
        await fetch('/api/workouts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to save workout to DB", err);
      } finally {
        setIsSaving(false);
      }
    }

    // If there is an active routine, increment day
    const activeProgram = programs.find(p => p.id !== undefined && String(p.id) === String(activeRoutineId));
    if (activeProgram) {
      const nextDayIdx = (activeRoutineNextDayIndex + 1) % activeProgram.days.length;
      setActiveRoutineNextDayIndex(nextDayIdx);
      if (username) {
        localStorage.setItem(`flexpulse_active_routine_day_${username}`, String(nextDayIdx));
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
    const currentUsername = username;
    setToken(null);
    setUsername(null);
    localStorage.removeItem('flexpulse_token');
    localStorage.removeItem('flexpulse_username');
    // Clear session so the new user doesn't see the old user's workout
    setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });
    if (currentUsername) {
      localStorage.removeItem(`flexpulse_session_${currentUsername}`);
    }
    localStorage.removeItem('flexpulse_session');
    setActiveRoutineId(null);
    setActiveRoutineNextDayIndex(0);
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

  if (isLoadingData) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f8f7f4]">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 bg-[#f8f7f4] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a]">
          {/* 45 LBS Plate Spinning Loader */}
          <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center animate-spin border-4 border-dashed border-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
            <div className="absolute w-5 h-5 rounded-full bg-[#f8f7f4] border-2 border-[#1a1a1a]"></div>
            <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(-14px)' }}>45</span>
            <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(14px)' }}>LBS</span>
          </div>
          <div>
            <p className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] tracking-wider">Loading FlexPulse...</p>
            <p className="font-mono text-[0.65rem] text-[#1a1a1a]/60 uppercase mt-1">Connecting to server</p>
          </div>
        </div>
      </div>
    );
  }

  const activeProgram = programs.find(p => p.id !== undefined && String(p.id) === String(activeRoutineId)) || null;
  const activeDay = activeProgram && activeProgram.days[activeRoutineNextDayIndex] ? activeProgram.days[activeRoutineNextDayIndex] : null;

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
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-10 dot-bg">
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
                  activeProgram={activeProgram}
                  activeDay={activeDay}
                  activeDayIndex={activeRoutineNextDayIndex}
                  onStartDay={handleStartDay}
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
                  activeRoutineId={activeRoutineId}
                  onActivateRoutine={handleActivateRoutine}
                />
              )}
              {activeTab === 'profile' && (
                <Profile
                  token={token}
                  username={username}
                  programs={programs}
                  activeRoutineId={activeRoutineId}
                  onActivateRoutine={handleActivateRoutine}
                  prs={prs}
                />
              )}
            </React.Suspense>
        </main>
      </div>

      {isSaving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 bg-[#f8f7f4] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a]">
            {/* 45 LBS Plate Spinning Loader */}
            <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center animate-spin border-4 border-dashed border-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
              <div className="absolute w-5 h-5 rounded-full bg-[#f8f7f4] border-2 border-[#1a1a1a]"></div>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(-14px)' }}>45</span>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(14px)' }}>LBS</span>
            </div>
            <div>
              <p className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] tracking-wider">Racking the Weights...</p>
              <p className="font-mono text-[0.65rem] text-[#1a1a1a]/60 uppercase mt-1">Saving workout to FlexPulse cloud</p>
            </div>
          </div>
        </div>
      )}

      <PrModal
        isOpen={prModalOpen}
        onClose={() => setPrModalOpen(false)}
        prDetails={currentPrDetails}
        weightUnit={weightUnit}
      />
    </div>
  );
}
