import { ObjectId } from "mongodb";

// User types
export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  image?: string;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  currentPhase: 1 | 2 | 3;
  currentWeek: 1 | 2 | 3 | 4 | 5 | 6; // 6 = deload
  startDate?: Date;
  bodyWeight?: number;
  weightUnit: "kg" | "lbs";
  defaultRestTime?: number; // in seconds
  darkMode?: boolean;
}

// Workout types
export type SessionType = "Push 1" | "Pull 1" | "Push 2" | "Pull 2";

export interface Workout {
  _id: ObjectId;
  userId: ObjectId;
  date: Date;
  phase: 1 | 2 | 3;
  week: 1 | 2 | 3 | 4 | 5 | 6;
  session: SessionType;
  isDeload: boolean;
  exercises: ExerciseLog[];
  notes?: string;
  duration?: number; // in minutes
  isSeed?: boolean; // for seed data identification
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseLog {
  letter: string;
  exerciseName: string;
  progression: ExerciseProgression;
  sets: SetLog[];
  notes?: string;
}

export interface ExerciseProgression {
  variant: string; // Free text - e.g., "Band assisted", "Negative only", "Full ROM"
  ringHeight?: string; // Ring strap number or landmark
  addedWeight?: number; // For weighted progressions (kg/lbs)
  notes?: string;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  repsLeft?: number; // For unilateral exercises
  repsRight?: number; // For unilateral exercises
  time?: number; // For timed exercises (seconds)
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string; // Per-set notes (e.g., "2 partials", "felt easy")
}

// Exercise Progress types
export interface ExerciseProgress {
  _id: ObjectId;
  userId: ObjectId;
  exerciseName: string;
  history: ProgressDataPoint[];
  usedVariants: string[];
  personalBests: Record<string, PersonalBest>;
  currentProgression: CurrentProgression;
  updatedAt: Date;
}

export interface ProgressDataPoint {
  date: Date;
  phase: number;
  week: number;
  variant: string;
  ringHeight?: string;
  addedWeight?: number;
  totalSets: number;
  totalReps: number;
  avgRepsPerSet: number;
  totalVolume: number;
  bestSet: number;
  notes?: string;
}

export interface PersonalBest {
  maxReps: { value: number; date: Date };
  maxVolume: { value: number; date: Date };
  maxSets: { value: number; date: Date };
  longestHold?: { value: number; date: Date };
}

export interface CurrentProgression {
  variant: string;
  ringHeight?: string;
  lastUsed: Date;
  avgReps: number;
  avgSets: number;
}

// User Variants (for autocomplete)
export interface UserVariants {
  _id: ObjectId;
  userId: ObjectId;
  exerciseName: string;
  variants: VariantUsage[];
}

export interface VariantUsage {
  name: string;
  timesUsed: number;
  lastUsed: Date;
}

// Body Metrics
export interface BodyMetrics {
  _id: ObjectId;
  userId: ObjectId;
  date: Date;
  weight?: number;
  measurements?: BodyMeasurements;
  notes?: string;
  isSeed?: boolean; // for seed data identification
  createdAt: Date;
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
}

// Program types (static data)
export interface ProgramPhase {
  phase: 1 | 2 | 3;
  name: string;
  weeks: number;
  sessions: Record<SessionType, ProgramSession>;
  deloadSessions: Record<SessionType, ProgramSession>;
}

export interface ProgramSession {
  name: SessionType;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  letter: string;
  name: string;
  targetSets: string; // e.g., "3-4"
  targetReps: string; // e.g., "6-8" or "6-8 L&R"
  tempo: string; // e.g., "30X1"
  rest: string; // e.g., "1:30" or "2:00-3:00"
  isUnilateral?: boolean;
  isTimed?: boolean;
  isAccumulation?: boolean;
  isDownSeries?: boolean;
}

export interface ExerciseDefinition {
  name: string;
  category: "Push" | "Pull";
  muscleGroups: string[];
  defaultTempo: string;
  cues?: string[];
  exampleProgressions?: string[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Client-side types (without ObjectId)
export type ClientUser = Omit<User, "_id" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientWorkout = Omit<Workout, "_id" | "userId" | "date" | "createdAt" | "updatedAt"> & {
  id: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientBodyMetrics = Omit<BodyMetrics, "_id" | "userId" | "date" | "createdAt"> & {
  id: string;
  date: string;
  createdAt: string;
};
