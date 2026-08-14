export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
export type EquipmentType = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight';
export type ProgramSplit = 'PPL' | 'Arnold Split' | 'Bro Split' | 'Stronglifts 5×5' | 'Upper/Lower' | 'Full Body' | 'Custom';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type FitnessGoal = 'Hypertrophy' | 'Strength' | 'Power' | 'General Fitness';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  category: 'Compound' | 'Isolation';
  instructions: string;
  isCustom?: boolean;
}

export interface SetLogItem {
  id: string;
  setNumber: number;
  weightLbs: number;
  reps: number;
  rpe?: number;
  isPR?: boolean;
  loggedAt: string;
}

export interface ExerciseSetGroup {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  previousMaxLbs: number;
  targetSets?: number;
  targetReps?: string;
  sets: SetLogItem[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  totalVolumeLbs: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DISCARDED';
  exerciseGroups: ExerciseSetGroup[];
  notes?: string;
}

// ── Legacy single-day template (kept for compatibility) ──────────────────────
export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  isTemplate: boolean;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps: number;
  }[];
}

// ── New full-program system ──────────────────────────────────────────────────
export interface ProgramExercise {
  exerciseId: string;
  sets: number;
  reps: string;        // e.g. "5" | "8-10" | "12-15"
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  label?: string;       // "Day 1", "Push A"
  name: string;        // "Push Day — Chest & Shoulders"
  musclesFocus?: MuscleGroup[];
  exercises: ProgramExercise[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  shortName?: string;
  split?: ProgramSplit;
  description: string;
  frequency?: string;   // "6 days/week"
  difficulty?: DifficultyLevel;
  goal?: FitnessGoal;
  isCustom?: boolean;
  days: WorkoutDay[];
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  weightLbs: number;
  reps: number;
  estimated1RM: number;
  achievedAt: string;
}

export type ViewTab = 'dashboard' | 'live_workout' | 'exercises' | 'routines' | 'profile';
export type WeightUnit = 'lbs' | 'kg';

// ── Weight conversion helpers ────────────────────────────────────────────────
export const toDisplayWeight = (lbs: number, unit: WeightUnit): number =>
  unit === 'kg' ? Math.round((lbs / 2.205) * 4) / 4 : lbs;

export const toStorageLbs = (value: number, unit: WeightUnit): number =>
  unit === 'kg' ? Math.round(value * 2.205 * 2) / 2 : value;

export const unitLabel = (unit: WeightUnit): string => unit;
