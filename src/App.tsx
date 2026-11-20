import React, { useState, useEffect, useCallback } from 'react';
import {
  ViewTab,
  WorkoutSession,
  Exercise,
  PersonalRecord,
  SetLogItem,
  WorkoutProgram,
  WorkoutDay,
  WeightUnit,
  CompletedWorkout,
  toStorageLbs,
} from './types';
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
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import {
  Menu,
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  ClipboardList,
  User,
  ShieldAlert,
  LogOut,
  FileText,
  ShieldCheck,
} from 'lucide-react';

function getInitialLegalRoute(): 'terms' | 'privacy' | null {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const pageParam = new URLSearchParams(window.location.search).get('page')?.toLowerCase();
  if (path === '/terms' || pageParam === 'terms') return 'terms';
  if (path === '/privacy' || pageParam === 'privacy') return 'privacy';
  return null;
}

export default function App() {
  const initialLegal = getInitialLegalRoute();
  const [activeTab, setActiveTab] = useState<ViewTab>(initialLegal || 'live_workout');
  const [publicLegalPage, setPublicLegalPage] = useState<'terms' | 'privacy' | null>(initialLegal);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    return (localStorage.getItem('flexpulse_unit') as WeightUnit) || 'lbs';
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('flexpulse_token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('flexpulse_username'));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('flexpulse_dark_mode') === 'true';
  });

  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [activeRoutineNextDayIndex, setActiveRoutineNextDayIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
      // Stale or corrupted storage: start fresh
    }
    return { ...INITIAL_WORKOUT, id: `session-${Date.now()}` };
  });

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const cached = localStorage.getItem('flexpulse_cached_exercises');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [programs, setPrograms] = useState<WorkoutProgram[]>(() => {
    try {
      const cached = localStorage.getItem('flexpulse_cached_programs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [workoutHistory, setWorkoutHistory] = useState<CompletedWorkout[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('flexpulse_token')) && !localStorage.getItem('flexpulse_cached_exercises');
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

  const handleLogout = useCallback(() => {
    const currentUsername = localStorage.getItem('flexpulse_username');
    setToken(null);
    setUsername(null);
    setIsAdmin(false);
    setPrs([]);
    setWorkoutHistory([]);
    localStorage.removeItem('flexpulse_token');
    localStorage.removeItem('flexpulse_username');
    setSession({ ...INITIAL_WORKOUT, id: `session-${Date.now()}` });
    if (currentUsername) {
      localStorage.removeItem(`flexpulse_session_${currentUsername}`);
    }
    localStorage.removeItem('flexpulse_session');
    setActiveRoutineId(null);
    setActiveRoutineNextDayIndex(0);
    setWorkoutComplete(false);
  }, []);

  // Sync URL with legal tabs
  useEffect(() => {
    const onPopState = () => {
      const route = getInitialLegalRoute();
      if (token) {
        if (route) setActiveTab(route);
      } else {
        setPublicLegalPage(route);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [token]);

  // Sync active routine state when user changes
  useEffect(() => {
    if (username) {
      setActiveRoutineId(localStorage.getItem(`flexpulse_active_routine_${username}`));
      const val = localStorage.getItem(`flexpulse_active_routine_day_${username}`);
      setActiveRoutineNextDayIndex(val ? parseInt(val, 10) || 0 : 0);
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
      } catch {
        // Ignore parse failures
      }
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

  // Fetch authenticated user profile, exercises, routines, PRs, and workouts
  useEffect(() => {
    if (!token) {
      setIsLoadingData(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setIsLoadingData(true);
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        const [profileRes, exRes, rtRes, prRes, workoutsRes] = await Promise.all([
          fetch('/api/profile/', { headers }),
          fetch('/api/exercises/', { headers }),
          fetch('/api/routines/', { headers }),
          fetch('/api/prs/', { headers }),
          fetch('/api/workouts/', { headers }),
        ]);

        if (
          profileRes.status === 401 ||
          profileRes.status === 403 ||
          exRes.status === 401 ||
          rtRes.status === 401
        ) {
          if (!cancelled) handleLogout();
          return;
        }

        if (!exRes.ok || !rtRes.ok) throw new Error('API response not ok');

        const profileData = profileRes.ok ? await profileRes.json() : null;
        const exData = await exRes.json();
        const rtData = await rtRes.json();
        const prData = prRes.ok ? await prRes.json() : [];
        const workoutsData = workoutsRes.ok ? await workoutsRes.json() : [];

        if (cancelled) return;

        if (profileData) {
          setIsAdmin(Boolean(profileData.is_staff));
          if (profileData.username) {
            setUsername(profileData.username);
            localStorage.setItem('flexpulse_username', profileData.username);
          }
        }

        const mappedPrs: PersonalRecord[] = Array.isArray(prData)
          ? prData.map((pr: Record<string, unknown>) => {
              const w = parseFloat(String(pr.weight_lbs || 0));
              const reps = Number(pr.reps || 1);
              return {
                id: `pr-${pr.id}`,
                exerciseName: String(pr.exercise_name || ''),
                muscleGroup: (pr.muscle_group as PersonalRecord['muscleGroup']) || 'Chest',
                weightLbs: w,
                reps,
                estimated1RM: Math.round(w * (1 + reps / 30)),
                achievedAt: String(pr.logged_at || new Date().toISOString()),
              };
            })
          : [];
        setPrs(mappedPrs);

        const mappedWorkouts: CompletedWorkout[] = Array.isArray(workoutsData)
          ? workoutsData.map((w: Record<string, unknown>) => ({
              id: `wk-${w.id}`,
              title: String(w.title || 'Workout'),
              startedAt: String(w.started_at || ''),
              completedAt: w.completed_at ? String(w.completed_at) : undefined,
              durationSeconds: Number(w.duration_seconds || 0),
              totalVolumeLbs: parseFloat(String(w.total_volume_lbs || 0)),
              status: String(w.status || 'COMPLETED'),
              setsCount: Array.isArray(w.sets) ? w.sets.length : 0,
            }))
          : [];
        setWorkoutHistory(mappedWorkouts);

        const mappedExercises: Exercise[] = Array.isArray(exData)
          ? exData.map((e: Record<string, unknown>) => ({
              id: `ex-${e.id}`,
              name: String(e.name || ''),
              muscleGroup: e.muscle_group as Exercise['muscleGroup'],
              equipment: e.equipment as Exercise['equipment'],
              category: e.category as Exercise['category'],
              instructions: String(e.instructions || ''),
              isCustom: Boolean(e.is_custom),
            }))
          : [];

        const mappedPrograms: WorkoutProgram[] = Array.isArray(rtData)
          ? rtData.map((r: Record<string, unknown>) => {
              const name = String(r.name || '');
              let chunkSize = 6;
              if (name.includes('Stronglifts')) chunkSize = 3;
              else if (name.includes('3')) chunkSize = 5;

              const rawExercises = Array.isArray(r.exercises) ? r.exercises : [];
              const days: WorkoutDay[] = [];
              for (let i = 0; i < rawExercises.length; i += chunkSize) {
                const chunk = rawExercises.slice(i, i + chunkSize);
                days.push({
                  id: `day-${r.id}-${i / chunkSize + 1}`,
                  label: `Day ${i / chunkSize + 1}`,
                  name: `Workout ${i / chunkSize + 1}`,
                  musclesFocus: [],
                  exercises: chunk.map((re: Record<string, unknown>) => {
                    const exObj = (re.exercise || {}) as Record<string, unknown>;
                    return {
                      exerciseId: `ex-${exObj.id}`,
                      sets: Number(re.target_sets || 3),
                      reps: String(re.target_reps || '10'),
                      restSeconds: 90,
                      notes: String(re.notes || ''),
                    };
                  }),
                });
              }

              return {
                id: `prog-${r.id}`,
                name,
                shortName: name.substring(0, 4).toUpperCase(),
                split: 'Custom',
                description: String(r.description || ''),
                frequency: 'Varies',
                difficulty: 'Intermediate',
                goal: 'General Fitness',
                days,
              };
            })
          : [];

        setExercises(mappedExercises);
        localStorage.setItem('flexpulse_cached_exercises', JSON.stringify(mappedExercises));

        let customPrograms: WorkoutProgram[] = [];
        try {
          const savedCustom = localStorage.getItem('flexpulse_custom_programs');
          customPrograms = savedCustom ? JSON.parse(savedCustom) : [];
        } catch {
          customPrograms = [];
        }
        const mergedPrograms = [...mappedPrograms, ...customPrograms];
        setPrograms(mergedPrograms);
        localStorage.setItem('flexpulse_cached_programs', JSON.stringify(mergedPrograms));
      } catch (err) {
        console.error('Failed to fetch data from Django API:', err);
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [token, handleLogout]);

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

  const getPreviousMaxForExercise = (exerciseName: string): number => {
    const matching = prs.filter(p => p.exerciseName.toLowerCase() === exerciseName.toLowerCase());
    if (matching.length === 0) return 0;
    return Math.max(...matching.map(p => p.weightLbs));
  };

  const handleToggleUnit = () =>
    setWeightUnit(prev => (prev === 'lbs' ? 'kg' : 'lbs'));

  const handleActivateRoutine = (routineId: string | null) => {
    setActiveRoutineId(routineId);
    setActiveRoutineNextDayIndex(0);
    setWorkoutComplete(false);
    if (username) {
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
      const exName = ex?.name || 'Exercise';
      return {
        exerciseId: item.exerciseId,
        exerciseName: exName,
        muscleGroup: ex?.muscleGroup || 'Chest',
        equipment: ex?.equipment || 'Barbell',
        previousMaxLbs: getPreviousMaxForExercise(exName),
        targetSets: item.sets,
        targetReps: item.reps,
        sets: [],
      };
    });
    setSession({
      id: `session-${Date.now()}`,
      title: `${programName} - ${day.name}`,
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
          previousMaxLbs: getPreviousMaxForExercise(exercise.name),
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
    const completedAt = new Date().toISOString();
    const setsPayload = session.exerciseGroups.flatMap(group =>
      group.sets.map(setLog => ({
        exercise_id: parseInt(group.exerciseId.replace('ex-', ''), 10),
        set_number: setLog.setNumber,
        weight_lbs: setLog.weightLbs,
        reps: setLog.reps,
        rpe: setLog.rpe,
      }))
    );

    const payload = {
      title: session.title,
      started_at: session.startedAt,
      completed_at: completedAt,
      duration_seconds: session.durationSeconds,
      status: 'COMPLETED',
      sets: setsPayload,
    };

    if (token) {
      try {
        setIsSaving(true);
        const res = await fetch('/api/workouts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }
        if (res.ok) {
          const created = await res.json();
          setWorkoutHistory(prev => [
            {
              id: `wk-${created.id}`,
              title: String(created.title || session.title),
              startedAt: String(created.started_at || session.startedAt),
              completedAt: created.completed_at ? String(created.completed_at) : completedAt,
              durationSeconds: Number(created.duration_seconds || session.durationSeconds),
              totalVolumeLbs: parseFloat(String(created.total_volume_lbs || session.totalVolumeLbs)),
              status: String(created.status || 'COMPLETED'),
              setsCount: setsPayload.length,
            },
            ...prev,
          ]);
        }
      } catch (err) {
        console.error('Failed to save workout to DB:', err);
      } finally {
        setIsSaving(false);
      }
    }

    const totalSets = session.exerciseGroups.reduce((a, g) => a + g.sets.length, 0);
    if (totalSets > 0) {
      const storageKey = `flexpulse_streak_${username || 'Athlete'}`;
      const currentStreakVal = parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;
      localStorage.setItem(storageKey, String(currentStreakVal + 1));
    }

    const activeProgram = programs.find(p => p.id !== undefined && String(p.id) === String(activeRoutineId));
    if (activeProgram && activeProgram.days.length > 0) {
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

  if (!token) {
    if (publicLegalPage === 'terms') {
      return (
        <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#151518] p-6 md:p-10 dot-bg">
          <TermsAndConditions
            onBack={() => {
              setPublicLegalPage(null);
              window.history.pushState({}, '', '/');
            }}
            onSwitchToPrivacy={() => {
              setPublicLegalPage('privacy');
              window.history.pushState({}, '', '/privacy');
            }}
          />
        </div>
      );
    }
    if (publicLegalPage === 'privacy') {
      return (
        <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#151518] p-6 md:p-10 dot-bg">
          <PrivacyPolicy
            onBack={() => {
              setPublicLegalPage(null);
              window.history.pushState({}, '', '/');
            }}
            onSwitchToTerms={() => {
              setPublicLegalPage('terms');
              window.history.pushState({}, '', '/terms');
            }}
          />
        </div>
      );
    }

    return (
      <AuthScreen
        onAuthSuccess={(newToken, newUsername) => {
          setToken(newToken);
          setUsername(newUsername);
          setPublicLegalPage(null);
          setActiveTab('live_workout');
          localStorage.setItem('flexpulse_token', newToken);
          localStorage.setItem('flexpulse_username', newUsername);
        }}
        onOpenLegal={page => {
          setPublicLegalPage(page);
          window.history.pushState({}, '', `/${page}`);
        }}
      />
    );
  }

  if (isLoadingData) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f8f7f4]">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 bg-[#f8f7f4] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a]">
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
    <div className="h-[100dvh] bg-[#F8F7F4] dark:bg-[#151518] text-[#111113] dark:text-white flex flex-col md:flex-row overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={username || 'Athlete'}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        exercisesCount={exercises.length}
        programsCount={programs.length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Header */}
        <div className="flex md:hidden items-center justify-between px-6 py-4 bg-[#f8f7f4] dark:bg-[#151518] border-b-2 border-[#1a1a1a] dark:border-zinc-800 select-none shrink-0">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#ff4d00]" />
            <span className="font-oswald uppercase text-xl font-bold tracking-tight text-[#1a1a1a] dark:text-white">FlexPulse</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 border-2 border-[#1a1a1a] dark:border-zinc-700 bg-white dark:bg-[#111113] text-[#1a1a1a] dark:text-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-[1px_1px_0_#1a1a1a] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <Header
          restTimerDuration={90}
          timerAutoStartKey={timerTriggerKey}
          activeSessionTitle={session.title}
          weightUnit={weightUnit}
          onToggleUnit={handleToggleUnit}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-10 dot-bg flex flex-col">
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <Dashboard
                session={session}
                prs={prs}
                workoutHistory={workoutHistory}
                username={username || 'Athlete'}
                setActiveTab={setActiveTab}
                weightUnit={weightUnit}
              />
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
                onUnauthorized={handleLogout}
              />
            )}
            {activeTab === 'terms' && (
              <TermsAndConditions
                onBack={() => setActiveTab('dashboard')}
                onSwitchToPrivacy={() => setActiveTab('privacy')}
              />
            )}
            {activeTab === 'privacy' && (
              <PrivacyPolicy
                onBack={() => setActiveTab('dashboard')}
                onSwitchToTerms={() => setActiveTab('terms')}
              />
            )}
          </div>

          {/* Site Footer */}
          <footer className="max-w-6xl w-full mx-auto mt-12 pt-4 border-t border-[#1a1a1a]/15 dark:border-white/15 flex flex-wrap items-center justify-between gap-4 font-mono text-[0.65rem] uppercase text-[#1a1a1a]/60 dark:text-white/60">
            <span>FlexPulse | flexpulse.app</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className="hover:text-[#ff4d00] hover:underline cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className="hover:text-[#ff4d00] hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </footer>
        </main>
      </div>

      {isSaving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm p-8 bg-[#f8f7f4] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a]">
            <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center animate-spin border-4 border-dashed border-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
              <div className="absolute w-5 h-5 rounded-full bg-[#f8f7f4] border-2 border-[#1a1a1a]"></div>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(-14px)' }}>45</span>
              <span className="text-[10px] font-bold text-white uppercase font-mono tracking-widest absolute" style={{ transform: 'translateY(14px)' }}>LBS</span>
            </div>
            <div>
              <p className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] tracking-wider">Racking the Weights...</p>
              <p className="font-mono text-[0.65rem] text-[#1a1a1a]/60 uppercase mt-1">Saving workout to FlexPulse</p>
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

      {/* Mobile Drawer Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0 z-0" onClick={() => setIsMobileMenuOpen(false)} />

          <div className="relative z-10 w-full bg-[#f8f7f4] dark:bg-[#151518] border-t-4 border-[#1a1a1a] dark:border-zinc-800 p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto shadow-[0_-8px_0_#1a1a1a] dark:shadow-[0_-8px_0_#000]">
            <div className="font-mono text-[0.65rem] uppercase tracking-widest text-[#1a1a1a]/60 dark:text-white/60 mb-2 border-b border-[#1a1a1a]/10 dark:border-white/10 pb-2">
              Menu Navigation
            </div>

            <nav className="flex flex-col border border-[#1a1a1a] dark:border-zinc-800 bg-white dark:bg-[#111113] divide-y divide-[#1a1a1a] dark:divide-zinc-800">
              {[
                { id: 'dashboard',    label: 'Dashboard', icon: LayoutDashboard },
                { id: 'live_workout', label: 'Today',     icon: Dumbbell, activeIndicator: true },
                { id: 'exercises',    label: 'Exercises', icon: BookOpen },
                { id: 'routines',     label: 'Routines',  icon: ClipboardList },
                { id: 'profile',      label: 'Profile',   icon: User },
                { id: 'terms',        label: 'Terms & Conditions', icon: FileText },
                { id: 'privacy',      label: 'Privacy Policy',     icon: ShieldCheck },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as ViewTab); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-4 text-left font-oswald uppercase text-[1.1rem] text-[#1a1a1a] dark:text-white hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />
                      <span>{item.label}</span>
                      {item.activeIndicator && <span className="w-2 h-2 bg-[#ff4d00] inline-block" />}
                    </div>
                    <span className="text-[#1a1a1a]/30 dark:text-white/30 font-bold">&gt;</span>
                  </button>
                );
              })}

              {isAdmin && (
                <a
                  href="/admin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-4 text-left font-oswald uppercase text-[1.1rem] text-[#1a1a1a] dark:text-white hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-[#1a1a1a]/50 dark:text-white/50" />
                    <span>Admin Console</span>
                  </div>
                  <span className="text-[#1a1a1a]/30 dark:text-white/30 font-bold">&gt;</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-4 text-left font-oswald uppercase text-[1.1rem] text-[#ff4d00] hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-[#ff4d00]" />
                  <span>Logout Account</span>
                </div>
                <span className="text-[#ff4d00]/30 font-bold">&gt;</span>
              </button>
            </nav>

            <button
              type="button"
              onClick={() => { setDarkMode(!darkMode); setIsMobileMenuOpen(false); }}
              className="mt-2 w-full py-3.5 border-2 border-[#1a1a1a] dark:border-zinc-700 bg-white dark:bg-[#111113] hover:bg-[#ff4d00] hover:text-white dark:hover:bg-[#ff4d00] dark:hover:text-white text-[#1a1a1a] dark:text-white font-oswald uppercase text-sm font-bold shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#000] active:translate-y-0.5 active:shadow-[1px_1px_0_#1a1a1a] transition-all cursor-pointer text-center"
            >
              Turn {darkMode ? 'Light' : 'Dark'} Mode On
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center font-mono text-xs uppercase font-bold text-[#1a1a1a]/50 dark:text-white/50 hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
