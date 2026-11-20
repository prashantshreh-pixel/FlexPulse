import { WorkoutSession, PersonalRecord } from '../types';

// Initial personal records start empty until authenticated records load from the API
export const INITIAL_PRS: PersonalRecord[] = [];

// Initial session starts empty until the user selects a routine or adds an exercise
export const INITIAL_WORKOUT: WorkoutSession = {
  id: `session-${Date.now()}`,
  title: "Today's Workout",
  startedAt: new Date().toISOString(),
  durationSeconds: 0,
  totalVolumeLbs: 0,
  status: 'IN_PROGRESS',
  exerciseGroups: [],
};
