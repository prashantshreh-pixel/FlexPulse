import { Exercise, WorkoutSession, PersonalRecord, WorkoutProgram } from '../types';



// ─────────────────────────────────────────────────────────────────────────────
// INITIAL PERSONAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_PRS: PersonalRecord[] = [
  { id: 'pr-1', exerciseName: 'Barbell Bench Press',       muscleGroup: 'Chest', weightLbs: 225, reps: 5, estimated1RM: 262, achievedAt: '2026-08-01T14:30:00Z' },
  { id: 'pr-2', exerciseName: 'Barbell Back Squat',        muscleGroup: 'Legs',  weightLbs: 315, reps: 5, estimated1RM: 367, achievedAt: '2026-08-04T16:00:00Z' },
  { id: 'pr-3', exerciseName: 'Barbell Conventional Deadlift', muscleGroup: 'Back', weightLbs: 405, reps: 3, estimated1RM: 445, achievedAt: '2026-08-08T18:15:00Z' },
];

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL SESSION — starts empty (user picks a routine)
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_WORKOUT: WorkoutSession = {
  id: `session-${Date.now()}`,
  title: "Today's Workout",
  startedAt: new Date().toISOString(),
  durationSeconds: 0,
  totalVolumeLbs: 0,
  status: 'IN_PROGRESS',
  exerciseGroups: [],
};
