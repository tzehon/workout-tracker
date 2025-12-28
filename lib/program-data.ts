import { ProgramPhase, ProgramExercise, ExerciseDefinition, SessionType } from "@/types";

// Phase 1 Exercises
const phase1Push1: ProgramExercise[] = [
  { letter: "A1", name: "Ring Dip (Elbows in)", targetSets: "3-4", targetReps: "6-8", tempo: "30X1", rest: "1:30" },
  { letter: "B1", name: "Archer Pushup (Alternating)", targetSets: "3-4", targetReps: "4-6 L&R", tempo: "20X0", rest: "1:30", isUnilateral: true },
  { letter: "C1", name: "Chest Fly", targetSets: "3", targetReps: "8-10", tempo: "30X0", rest: "1:30" },
  { letter: "D1", name: "Tricep Dip", targetSets: "3", targetReps: "6-10", tempo: "20X0", rest: "1:30" },
  { letter: "E1", name: "Tricep Extension", targetSets: "3", targetReps: "8-10", tempo: "30X1", rest: "1:30" },
];

const phase1Pull1: ProgramExercise[] = [
  { letter: "A1", name: "Chinup (Regular/Tuck L/L-Sit)", targetSets: "3-5", targetReps: "6-8", tempo: "30X2", rest: "2:00-3:00" },
  { letter: "B1", name: "Bodyweight Row (Two arms)", targetSets: "3-4", targetReps: "10-15 L&R", tempo: "20X1", rest: "1:30", isUnilateral: true },
  { letter: "C1", name: "Pelican Curl", targetSets: "3", targetReps: "5-8", tempo: "30X0", rest: "1:30" },
  { letter: "D1", name: "Face Pull", targetSets: "3", targetReps: "8-10", tempo: "30X0", rest: "1:30" },
  { letter: "E1", name: "Ring Rollout", targetSets: "3", targetReps: "8-10", tempo: "40X0", rest: "1:30" },
];

const phase1Push2: ProgramExercise[] = [
  { letter: "A1", name: "Ring Dip (Elbows in)", targetSets: "3-4", targetReps: "6-8", tempo: "30X1", rest: "1:30" },
  { letter: "B1", name: "Shoulder Pushup (Feet on floor)", targetSets: "3-4", targetReps: "4-8", tempo: "30X1", rest: "1:30" },
  { letter: "C1", name: "Bulgarian Pushup", targetSets: "3-4", targetReps: "6-10", tempo: "20X0", rest: "1:30" },
  { letter: "D1", name: "Shoulder Shrug (Back to wall)", targetSets: "3-4", targetReps: "8-12", tempo: "2s iso", rest: "1:30", isTimed: true },
  { letter: "E1", name: "Tricep Dip", targetSets: "3", targetReps: "6-10", tempo: "20X0", rest: "1:30" },
];

const phase1Pull2: ProgramExercise[] = [
  { letter: "A1", name: "Mantle Chinup", targetSets: "3-5", targetReps: "4-6 L&R", tempo: "30X2", rest: "1:30", isUnilateral: true },
  { letter: "B1", name: "Archer Bodyweight Row", targetSets: "3-4", targetReps: "4-8 L&R", tempo: "20X0", rest: "1:30", isUnilateral: true },
  { letter: "C1", name: "Face Pull", targetSets: "3", targetReps: "8-10", tempo: "20X0", rest: "1:30" },
  { letter: "D1", name: "Bodyweight Bicep Curl", targetSets: "3-4", targetReps: "8-10", tempo: "30X1", rest: "1:30" },
];

// Phase 1 Deload
const phase1DeloadPush1: ProgramExercise[] = phase1Push1.map(e => ({ ...e, targetSets: e.targetSets === "3-4" ? "1-2" : "2" }));
const phase1DeloadPull1: ProgramExercise[] = phase1Pull1.map(e => ({ ...e, targetSets: e.targetSets === "3-5" || e.targetSets === "3-4" ? "1-2" : "2" }));
const phase1DeloadPush2: ProgramExercise[] = phase1Push2.map(e => ({ ...e, targetSets: e.targetSets === "3-4" ? "1-2" : "2" }));
const phase1DeloadPull2: ProgramExercise[] = phase1Pull2.map(e => ({ ...e, targetSets: e.targetSets === "3-5" || e.targetSets === "3-4" ? "1-2" : "2" }));

// Phase 2 Exercises
const phase2Push1: ProgramExercise[] = [
  { letter: "A1", name: "Ring Dip (Elbows in)", targetSets: "3-4", targetReps: "8-10", tempo: "30X1", rest: "1:30" },
  { letter: "B1", name: "Archer Pushup (Alternating)", targetSets: "3-4", targetReps: "6-8 L&R", tempo: "20X0", rest: "1:30", isUnilateral: true },
  { letter: "C1", name: "Chest Fly", targetSets: "3", targetReps: "8-12", tempo: "30X0", rest: "1:30" },
  { letter: "D1", name: "Tricep Dip", targetSets: "3", targetReps: "8-15", tempo: "30X0", rest: "1:30" },
  { letter: "E1", name: "Tricep Extension", targetSets: "3-4", targetReps: "8-12", tempo: "30X1", rest: "1:30" },
  { letter: "F1", name: "Diamond Pushup (Feet Elevated)", targetSets: "1", targetReps: "8-15! Down", tempo: "30X1", rest: "self", isDownSeries: true },
];

const phase2Pull1: ProgramExercise[] = [
  { letter: "A1", name: "Wide Pullup (Tuck L)", targetSets: "3-4", targetReps: "6-12", tempo: "30X0", rest: "2:00-3:00" },
  { letter: "B1", name: "Archer Bodyweight Row", targetSets: "3-4", targetReps: "6-8 L&R", tempo: "20X0", rest: "1:30", isUnilateral: true },
  { letter: "C1", name: "Pelican Curl", targetSets: "3", targetReps: "6-10", tempo: "30X0", rest: "1:30" },
  { letter: "D1", name: "Rear Delt Fly", targetSets: "3", targetReps: "8-12", tempo: "30X0", rest: "1:30" },
  { letter: "E1", name: "Ring Rollout", targetSets: "3", targetReps: "10-12", tempo: "40X0", rest: "1:30" },
];

const phase2Push2: ProgramExercise[] = [
  { letter: "A1", name: "Ring Dip (Bulgarian)", targetSets: "3-4", targetReps: "5-8", tempo: "30X1", rest: "1:30" },
  { letter: "B1", name: "Shoulder Pushup (Feet elevated)", targetSets: "3-4", targetReps: "6-10", tempo: "40X1", rest: "1:30" },
  { letter: "C1", name: "Bulgarian Pushup", targetSets: "3-4", targetReps: "8-10", tempo: "30X1", rest: "1:30" },
  { letter: "D1", name: "Shoulder Tap (Chest to wall)", targetSets: "3-4", targetReps: "30-45s", tempo: "-", rest: "1:30", isTimed: true },
  { letter: "E1", name: "Tricep Dip", targetSets: "3-4", targetReps: "6-10", tempo: "20X0", rest: "1:30" },
];

const phase2Pull2: ProgramExercise[] = [
  { letter: "A1", name: "Archer Chinup (Alternating)", targetSets: "4-6", targetReps: "3-5 L&R", tempo: "30X0", rest: "1:30", isUnilateral: true },
  { letter: "B1", name: "Single Arm Row", targetSets: "3-4", targetReps: "4-8 L&R", tempo: "30X0", rest: "1:30", isUnilateral: true },
  { letter: "C1", name: "Face Pull", targetSets: "3-4", targetReps: "8-12", tempo: "20X0", rest: "1:30" },
  { letter: "D1", name: "Bodyweight Bicep Curl", targetSets: "3-4", targetReps: "8-12", tempo: "30X1", rest: "1:30" },
  { letter: "E1", name: "Two Arm Hang", targetSets: "self", targetReps: "2:00-4:00", tempo: "Accumulation", rest: "self", isAccumulation: true, isTimed: true },
];

// Phase 2 Deload
const phase2DeloadPush1: ProgramExercise[] = phase2Push1.slice(0, -1).map(e => ({ ...e, targetSets: e.targetSets === "3-4" ? "1-2" : "2" }));
const phase2DeloadPull1: ProgramExercise[] = phase2Pull1.map(e => ({ ...e, targetSets: e.targetSets === "3-4" ? "1-2" : "2" }));
const phase2DeloadPush2: ProgramExercise[] = phase2Push2.map(e => ({ ...e, targetSets: e.targetSets === "3-4" ? "1-2" : "2" }));
const phase2DeloadPull2: ProgramExercise[] = phase2Pull2.slice(0, -1).map(e => ({ ...e, targetSets: e.targetSets === "4-6" || e.targetSets === "3-4" ? "2" : "self" }));

// Phase 3 Exercises
const phase3Push1: ProgramExercise[] = [
  { letter: "A1", name: "Handstand Pushup (Chest to wall)", targetSets: "20 mins", targetReps: "Accumulation", tempo: "30X1", rest: "self", isAccumulation: true },
  { letter: "B1", name: "Ring Dip (Bulgarian)", targetSets: "3-5", targetReps: "5-8", tempo: "30X1", rest: "2:00" },
  { letter: "C1", name: "Archer Pushup (Same Side)", targetSets: "3-5", targetReps: "6-8 L&R", tempo: "30X1", rest: "2:00", isUnilateral: true },
  { letter: "D1", name: "Chest Fly", targetSets: "4-5", targetReps: "6-8", tempo: "30X0", rest: "2:00" },
  { letter: "E1", name: "Tricep Extension", targetSets: "5-6", targetReps: "5-6", tempo: "30X1", rest: "2:00" },
  { letter: "F1", name: "Tricep Dip", targetSets: "3-4", targetReps: "8-12", tempo: "30X0", rest: "2:00" },
];

const phase3Pull1: ProgramExercise[] = [
  { letter: "A1", name: "Wide Pullup (L-Sit)", targetSets: "3-5", targetReps: "5-8", tempo: "30X0", rest: "2:00-3:00" },
  { letter: "B1", name: "L-Row", targetSets: "3-5", targetReps: "3-8", tempo: "30X0", rest: "2:00" },
  { letter: "C1", name: "Pelican Curl", targetSets: "3-4", targetReps: "6-10", tempo: "40X0", rest: "2:00" },
  { letter: "D1", name: "Rear Delt Fly", targetSets: "3-4", targetReps: "8-15", tempo: "30X0", rest: "2:00" },
  { letter: "E1", name: "Ring Rollout", targetSets: "3", targetReps: "10-15", tempo: "40X1", rest: "2:00" },
];

const phase3Push2: ProgramExercise[] = [
  { letter: "A1", name: "Ring Dip (Elbows in)", targetSets: "3-5", targetReps: "8-12", tempo: "30X1", rest: "2:00" },
  { letter: "B1", name: "Shoulder Pushup (Feet Elevated)", targetSets: "3-5", targetReps: "6-10", tempo: "30X1", rest: "2:00" },
  { letter: "C1", name: "Bulgarian Pushup", targetSets: "3-5", targetReps: "10-15", tempo: "30X1", rest: "2:00" },
  { letter: "D1", name: "Waist Tap (Chest to wall)", targetSets: "3-5", targetReps: "30-45s", tempo: "-", rest: "2:00", isTimed: true },
  { letter: "E1", name: "Tricep Dip", targetSets: "3-4", targetReps: "10-12", tempo: "30X1", rest: "2:00" },
  { letter: "F1", name: "Diamond Pushup (Feet Elevated)", targetSets: "2", targetReps: "8-12! Down", tempo: "30X1", rest: "self", isDownSeries: true },
];

const phase3Pull2: ProgramExercise[] = [
  { letter: "A1", name: "Archer Chinup (Same side)", targetSets: "3-5", targetReps: "4-8 L&R", tempo: "30X1", rest: "1:30", isUnilateral: true },
  { letter: "B1", name: "Single Arm Row", targetSets: "3-5", targetReps: "6-10 L&R", tempo: "30X0", rest: "2:00", isUnilateral: true },
  { letter: "C1", name: "Face Pull", targetSets: "3-4", targetReps: "8-12", tempo: "20X0", rest: "2:00" },
  { letter: "D1", name: "Pelican Curl Negative", targetSets: "3", targetReps: "3-4", tempo: "6-8s", rest: "2:00" },
  { letter: "E1", name: "Bodyweight Bicep Curl", targetSets: "3-4", targetReps: "6-10", tempo: "30X1", rest: "2:00" },
  { letter: "F1", name: "One Arm Hang", targetSets: "self", targetReps: "2:00-4:00", tempo: "Accumulation", rest: "self", isAccumulation: true, isTimed: true },
];

// Phase 3 Deload
const phase3DeloadPush1: ProgramExercise[] = phase3Push1.slice(1).map(e => ({ ...e, targetSets: e.targetSets === "3-5" || e.targetSets === "4-5" || e.targetSets === "5-6" ? "2" : e.targetSets === "3-4" ? "1-2" : "2" }));
const phase3DeloadPull1: ProgramExercise[] = phase3Pull1.map(e => ({ ...e, targetSets: e.targetSets === "3-5" || e.targetSets === "3-4" ? "2" : e.targetSets === "3" ? "1-2" : e.targetSets }));
const phase3DeloadPush2: ProgramExercise[] = phase3Push2.slice(0, -1).map(e => ({ ...e, targetSets: e.targetSets === "3-5" ? "2" : e.targetSets === "3-4" ? "1-2" : e.targetSets }));
const phase3DeloadPull2: ProgramExercise[] = phase3Pull2.slice(0, -1).map(e => ({ ...e, targetSets: e.targetSets === "3-5" || e.targetSets === "3-4" ? "2" : e.targetSets === "3" ? "1-2" : e.targetSets }));

// Complete program phases
export const programPhases: ProgramPhase[] = [
  {
    phase: 1,
    name: "Foundation",
    weeks: 6,
    sessions: {
      "Push 1": { name: "Push 1", exercises: phase1Push1 },
      "Pull 1": { name: "Pull 1", exercises: phase1Pull1 },
      "Push 2": { name: "Push 2", exercises: phase1Push2 },
      "Pull 2": { name: "Pull 2", exercises: phase1Pull2 },
    },
    deloadSessions: {
      "Push 1": { name: "Push 1", exercises: phase1DeloadPush1 },
      "Pull 1": { name: "Pull 1", exercises: phase1DeloadPull1 },
      "Push 2": { name: "Push 2", exercises: phase1DeloadPush2 },
      "Pull 2": { name: "Pull 2", exercises: phase1DeloadPull2 },
    },
  },
  {
    phase: 2,
    name: "Development",
    weeks: 6,
    sessions: {
      "Push 1": { name: "Push 1", exercises: phase2Push1 },
      "Pull 1": { name: "Pull 1", exercises: phase2Pull1 },
      "Push 2": { name: "Push 2", exercises: phase2Push2 },
      "Pull 2": { name: "Pull 2", exercises: phase2Pull2 },
    },
    deloadSessions: {
      "Push 1": { name: "Push 1", exercises: phase2DeloadPush1 },
      "Pull 1": { name: "Pull 1", exercises: phase2DeloadPull1 },
      "Push 2": { name: "Push 2", exercises: phase2DeloadPush2 },
      "Pull 2": { name: "Pull 2", exercises: phase2DeloadPull2 },
    },
  },
  {
    phase: 3,
    name: "Peak Performance",
    weeks: 6,
    sessions: {
      "Push 1": { name: "Push 1", exercises: phase3Push1 },
      "Pull 1": { name: "Pull 1", exercises: phase3Pull1 },
      "Push 2": { name: "Push 2", exercises: phase3Push2 },
      "Pull 2": { name: "Pull 2", exercises: phase3Pull2 },
    },
    deloadSessions: {
      "Push 1": { name: "Push 1", exercises: phase3DeloadPush1 },
      "Pull 1": { name: "Pull 1", exercises: phase3DeloadPull1 },
      "Push 2": { name: "Push 2", exercises: phase3DeloadPush2 },
      "Pull 2": { name: "Pull 2", exercises: phase3DeloadPull2 },
    },
  },
];

// Exercise definitions for the library
export const exerciseDefinitions: ExerciseDefinition[] = [
  // Push exercises
  { name: "Ring Dip (Elbows in)", category: "Push", muscleGroups: ["Chest", "Triceps", "Shoulders"], defaultTempo: "30X1", exampleProgressions: ["Band assisted", "Negative only", "Full ROM", "RTO at top", "Weighted"] },
  { name: "Ring Dip (Bulgarian)", category: "Push", muscleGroups: ["Chest", "Triceps", "Shoulders"], defaultTempo: "30X1", exampleProgressions: ["Partial ROM", "Full ROM", "Weighted"] },
  { name: "Archer Pushup (Alternating)", category: "Push", muscleGroups: ["Chest", "Triceps", "Shoulders"], defaultTempo: "20X0", exampleProgressions: ["On knees", "Full", "Weighted vest"] },
  { name: "Archer Pushup (Same Side)", category: "Push", muscleGroups: ["Chest", "Triceps", "Shoulders"], defaultTempo: "30X1", exampleProgressions: ["Partial ROM", "Full ROM"] },
  { name: "Chest Fly", category: "Push", muscleGroups: ["Chest"], defaultTempo: "30X0", exampleProgressions: ["High rings", "Low rings", "Feet elevated"] },
  { name: "Tricep Dip", category: "Push", muscleGroups: ["Triceps"], defaultTempo: "20X0", exampleProgressions: ["Feet on floor", "Legs straight", "Elevated"] },
  { name: "Tricep Extension", category: "Push", muscleGroups: ["Triceps"], defaultTempo: "30X1", exampleProgressions: ["High rings", "Low rings"] },
  { name: "Shoulder Pushup (Feet on floor)", category: "Push", muscleGroups: ["Shoulders"], defaultTempo: "30X1", exampleProgressions: ["Pike", "Feet elevated", "Wall assisted"] },
  { name: "Shoulder Pushup (Feet elevated)", category: "Push", muscleGroups: ["Shoulders"], defaultTempo: "40X1", exampleProgressions: ["Low elevation", "High elevation", "Box"] },
  { name: "Bulgarian Pushup", category: "Push", muscleGroups: ["Chest", "Shoulders"], defaultTempo: "20X0", exampleProgressions: ["Low rings", "Medium rings", "High rings"] },
  { name: "Shoulder Shrug (Back to wall)", category: "Push", muscleGroups: ["Shoulders", "Traps"], defaultTempo: "2s iso", exampleProgressions: ["Partial", "Full shrug"] },
  { name: "Shoulder Tap (Chest to wall)", category: "Push", muscleGroups: ["Shoulders", "Core"], defaultTempo: "-", exampleProgressions: ["Quick taps", "Slow holds"] },
  { name: "Waist Tap (Chest to wall)", category: "Push", muscleGroups: ["Shoulders", "Core"], defaultTempo: "-", exampleProgressions: ["Quick taps", "Slow holds"] },
  { name: "Diamond Pushup (Feet Elevated)", category: "Push", muscleGroups: ["Triceps", "Chest"], defaultTempo: "30X1", exampleProgressions: ["Floor", "Low elevation", "High elevation"] },
  { name: "Handstand Pushup (Chest to wall)", category: "Push", muscleGroups: ["Shoulders", "Triceps"], defaultTempo: "30X1", exampleProgressions: ["Negatives only", "Partial ROM", "Full ROM", "Deficit"] },

  // Pull exercises
  { name: "Chinup (Regular/Tuck L/L-Sit)", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "30X2", exampleProgressions: ["Band assisted", "Regular", "Tuck L", "L-Sit", "Weighted"] },
  { name: "Wide Pullup (Tuck L)", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "30X0", exampleProgressions: ["Regular grip", "Wide grip", "Tuck L"] },
  { name: "Wide Pullup (L-Sit)", category: "Pull", muscleGroups: ["Back", "Biceps", "Core"], defaultTempo: "30X0", exampleProgressions: ["Tuck L", "Straddle L", "Full L-Sit"] },
  { name: "Mantle Chinup", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "30X2", exampleProgressions: ["Assisted", "Full"] },
  { name: "Archer Chinup (Alternating)", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "30X0", exampleProgressions: ["Band assisted", "Full ROM"] },
  { name: "Archer Chinup (Same side)", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "30X1", exampleProgressions: ["Partial", "Full ROM"] },
  { name: "Bodyweight Row (Two arms)", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "20X1", exampleProgressions: ["High rings", "Low rings", "Feet elevated"] },
  { name: "Archer Bodyweight Row", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "20X0", exampleProgressions: ["High rings", "Low rings"] },
  { name: "Single Arm Row", category: "Pull", muscleGroups: ["Back", "Biceps"], defaultTempo: "30X0", exampleProgressions: ["High rings", "Low rings"] },
  { name: "L-Row", category: "Pull", muscleGroups: ["Back", "Biceps", "Core"], defaultTempo: "30X0", exampleProgressions: ["Tuck", "Straddle", "Full L"] },
  { name: "Pelican Curl", category: "Pull", muscleGroups: ["Biceps"], defaultTempo: "30X0", exampleProgressions: ["Partial ROM", "Full ROM", "Slow eccentric"] },
  { name: "Pelican Curl Negative", category: "Pull", muscleGroups: ["Biceps"], defaultTempo: "6-8s", exampleProgressions: ["4s negative", "6s negative", "8s negative"] },
  { name: "Face Pull", category: "Pull", muscleGroups: ["Rear Delts", "Traps"], defaultTempo: "30X0", exampleProgressions: ["Light angle", "Steep angle"] },
  { name: "Rear Delt Fly", category: "Pull", muscleGroups: ["Rear Delts"], defaultTempo: "30X0", exampleProgressions: ["High rings", "Low rings"] },
  { name: "Ring Rollout", category: "Pull", muscleGroups: ["Core", "Lats"], defaultTempo: "40X0", exampleProgressions: ["Knees", "Toes", "Standing"] },
  { name: "Bodyweight Bicep Curl", category: "Pull", muscleGroups: ["Biceps"], defaultTempo: "30X1", exampleProgressions: ["High rings", "Low rings"] },
  { name: "Two Arm Hang", category: "Pull", muscleGroups: ["Grip", "Shoulders"], defaultTempo: "Accumulation", exampleProgressions: ["Dead hang", "Active hang"] },
  { name: "One Arm Hang", category: "Pull", muscleGroups: ["Grip", "Shoulders"], defaultTempo: "Accumulation", exampleProgressions: ["Assisted", "Full"] },
];

// Helper functions
export function getSessionForPhase(
  phase: 1 | 2 | 3,
  session: SessionType,
  isDeload: boolean = false
) {
  const phaseData = programPhases.find((p) => p.phase === phase);
  if (!phaseData) return null;

  return isDeload ? phaseData.deloadSessions[session] : phaseData.sessions[session];
}

export function getExerciseDefinition(name: string) {
  return exerciseDefinitions.find((e) => e.name === name);
}

export function getAllExerciseNames(): string[] {
  return exerciseDefinitions.map((e) => e.name);
}

export function getExercisesByCategory(category: "Push" | "Pull") {
  return exerciseDefinitions.filter((e) => e.category === category);
}

// Weekly schedule recommendation
export const weeklySchedule = {
  monday: "Push 1",
  tuesday: "Rest",
  wednesday: "Pull 1",
  thursday: "Rest",
  friday: "Push 2",
  saturday: "Pull 2",
  sunday: "Rest",
} as const;
