import { MongoClient, ObjectId } from "mongodb";
import { programPhases } from "../lib/program-data";
import { SessionType, Workout, BodyMetrics, ExerciseLog, SetLog } from "../types";

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL;

// Session schedule: which day of week each session occurs
const SESSION_SCHEDULE: { day: number; session: SessionType }[] = [
  { day: 1, session: "Push 1" }, // Monday
  { day: 3, session: "Pull 1" }, // Wednesday
  { day: 5, session: "Push 2" }, // Friday
  { day: 6, session: "Pull 2" }, // Saturday
];

// Default exercise variants per exercise name
const DEFAULT_VARIANTS: Record<string, string> = {
  "Ring Dip (Elbows in)": "Full ROM",
  "Ring Dip (Bulgarian)": "Full ROM",
  "Archer Pushup (Alternating)": "Full",
  "Archer Pushup (Same Side)": "Full ROM",
  "Chest Fly": "Low rings",
  "Tricep Dip": "Legs straight",
  "Tricep Extension": "Low rings",
  "Shoulder Pushup (Feet on floor)": "Pike",
  "Shoulder Pushup (Feet elevated)": "Low elevation",
  "Shoulder Pushup (Feet Elevated)": "Low elevation",
  "Bulgarian Pushup": "Medium rings",
  "Shoulder Shrug (Back to wall)": "Full shrug",
  "Shoulder Tap (Chest to wall)": "Quick taps",
  "Waist Tap (Chest to wall)": "Quick taps",
  "Diamond Pushup (Feet Elevated)": "Low elevation",
  "Handstand Pushup (Chest to wall)": "Partial ROM",
  "Chinup (Regular/Tuck L/L-Sit)": "Regular",
  "Wide Pullup (Tuck L)": "Tuck L",
  "Wide Pullup (L-Sit)": "Tuck L",
  "Mantle Chinup": "Full",
  "Archer Chinup (Alternating)": "Full ROM",
  "Archer Chinup (Same side)": "Partial",
  "Bodyweight Row (Two arms)": "Low rings",
  "Archer Bodyweight Row": "Low rings",
  "Single Arm Row": "Low rings",
  "L-Row": "Tuck",
  "Pelican Curl": "Partial ROM",
  "Pelican Curl Negative": "6s negative",
  "Face Pull": "Light angle",
  "Rear Delt Fly": "Low rings",
  "Ring Rollout": "Knees",
  "Bodyweight Bicep Curl": "Low rings",
  "Two Arm Hang": "Active hang",
  "One Arm Hang": "Assisted",
};

function parseRepRange(targetReps: string): { min: number; max: number } {
  // Handle formats like "6-8", "6-8 L&R", "8-10", "30-45s"
  const match = targetReps.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  // Single number
  const single = targetReps.match(/^(\d+)/);
  if (single) {
    const val = parseInt(single[1]);
    return { min: val, max: val };
  }
  return { min: 5, max: 8 }; // Default
}

function parseSetRange(targetSets: string): { min: number; max: number } {
  // Handle formats like "3-4", "3-5", "3", "self", "20 mins"
  if (targetSets === "self" || targetSets.includes("mins")) {
    return { min: 1, max: 1 };
  }
  const match = targetSets.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  const single = targetSets.match(/^(\d+)/);
  if (single) {
    const val = parseInt(single[1]);
    return { min: val, max: val };
  }
  return { min: 3, max: 4 };
}

function generateReps(
  repRange: { min: number; max: number },
  weekProgress: number, // 0-1, how far through the phase
  setIndex: number,
  totalSets: number
): number {
  // Progress through weeks: start lower, end higher
  const progressBonus = Math.floor((repRange.max - repRange.min) * weekProgress);
  const baseReps = repRange.min + progressBonus;

  // Fatigue: later sets have slightly fewer reps
  const fatigueReduction = setIndex > 0 ? Math.floor(setIndex * 0.5) : 0;

  // Add small random variation
  const variation = Math.floor(Math.random() * 2) - 1;

  const reps = Math.max(repRange.min, Math.min(repRange.max, baseReps - fatigueReduction + variation));
  return reps;
}

function generateExerciseLogs(
  phase: 1 | 2 | 3,
  session: SessionType,
  isDeload: boolean,
  weekProgress: number
): ExerciseLog[] {
  const phaseData = programPhases.find((p) => p.phase === phase);
  if (!phaseData) return [];

  const sessionData = isDeload
    ? phaseData.deloadSessions[session]
    : phaseData.sessions[session];

  return sessionData.exercises.map((exercise) => {
    const setRange = parseSetRange(exercise.targetSets);
    const repRange = parseRepRange(exercise.targetReps);

    // Determine number of sets (progress through weeks -> more sets)
    const numSets = isDeload
      ? setRange.min
      : Math.min(setRange.max, setRange.min + Math.floor(weekProgress * (setRange.max - setRange.min + 1)));

    const sets: SetLog[] = [];
    for (let i = 0; i < numSets; i++) {
      const set: SetLog = {
        setNumber: i + 1,
        reps: exercise.isTimed ? 0 : generateReps(repRange, weekProgress, i, numSets),
        completed: true,
      };

      // Handle timed exercises
      if (exercise.isTimed) {
        set.time = repRange.min + Math.floor(Math.random() * (repRange.max - repRange.min));
        set.reps = 0;
      }

      // Handle unilateral exercises
      if (exercise.isUnilateral) {
        const baseReps = generateReps(repRange, weekProgress, i, numSets);
        set.repsLeft = baseReps;
        set.repsRight = baseReps + (Math.random() > 0.7 ? 1 : 0); // Sometimes dominant side does more
        set.reps = 0;
      }

      // Occasional RPE
      if (Math.random() > 0.7) {
        set.rpe = 7 + Math.floor(Math.random() * 3); // 7-9
      }

      sets.push(set);
    }

    return {
      letter: exercise.letter,
      exerciseName: exercise.name,
      progression: {
        variant: DEFAULT_VARIANTS[exercise.name] || "Standard",
      },
      sets,
    };
  });
}

function generateWorkouts(
  userId: ObjectId,
  weeks: number,
  startDate: Date
): Omit<Workout, "_id">[] {
  const workouts: Omit<Workout, "_id">[] = [];

  let currentPhase: 1 | 2 | 3 = 1;
  let currentWeek: 1 | 2 | 3 | 4 | 5 | 6 = 1;

  for (let week = 0; week < weeks; week++) {
    // Calculate phase and week within phase
    const totalWeeks = week + 1;
    if (totalWeeks <= 6) {
      currentPhase = 1;
      currentWeek = totalWeeks as 1 | 2 | 3 | 4 | 5 | 6;
    } else if (totalWeeks <= 12) {
      currentPhase = 2;
      currentWeek = (totalWeeks - 6) as 1 | 2 | 3 | 4 | 5 | 6;
    } else {
      currentPhase = 3;
      currentWeek = (totalWeeks - 12) as 1 | 2 | 3 | 4 | 5 | 6;
    }

    const isDeload = currentWeek === 6;
    const weekProgress = (currentWeek - 1) / 5; // 0-1 progress through non-deload weeks

    // Get the Monday of this week
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + week * 7);

    // Generate 4 workouts for this week
    for (const { day, session } of SESSION_SCHEDULE) {
      const workoutDate = new Date(weekStart);
      workoutDate.setDate(weekStart.getDate() + (day - 1)); // day 1 = Monday

      const exercises = generateExerciseLogs(currentPhase, session, isDeload, weekProgress);

      // Random duration between 35-55 minutes
      const duration = 35 + Math.floor(Math.random() * 20);

      const workout: Omit<Workout, "_id"> = {
        userId,
        date: workoutDate,
        phase: currentPhase,
        week: currentWeek,
        session,
        isDeload,
        exercises,
        duration,
        isSeed: true,
        createdAt: workoutDate,
        updatedAt: workoutDate,
      };

      workouts.push(workout);
    }
  }

  return workouts;
}

function generateBodyMetrics(
  userId: ObjectId,
  weeks: number,
  startDate: Date,
  startWeight: number = 70
): Omit<BodyMetrics, "_id">[] {
  const metrics: Omit<BodyMetrics, "_id">[] = [];

  let currentWeight = startWeight;

  for (let week = 0; week < weeks; week++) {
    // 2 weigh-ins per week (Monday and Friday)
    const weighDays = [1, 5];

    for (const day of weighDays) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + week * 7 + (day - 1));

      // Slight fluctuation and gradual trend
      const dailyFluctuation = (Math.random() - 0.5) * 0.6; // ±0.3kg
      const weeklyTrend = -0.05 * week; // Very slight downward trend
      currentWeight = startWeight + weeklyTrend + dailyFluctuation;

      metrics.push({
        userId,
        date,
        weight: Math.round(currentWeight * 10) / 10, // Round to 1 decimal
        isSeed: true,
        createdAt: date,
      });
    }
  }

  return metrics;
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const weeks = args[0] ? parseInt(args[0]) : 6; // Default to 6 weeks (1 phase)

  if (isNaN(weeks) || weeks < 1 || weeks > 18) {
    console.error("Usage: npm run seed [weeks]");
    console.error("  weeks: 1-18 (default: 6)");
    console.error("\nExamples:");
    console.error("  npm run seed        # 6 weeks (1 phase)");
    console.error("  npm run seed 4      # 4 weeks (partial phase)");
    console.error("  npm run seed 12     # 12 weeks (2 phases)");
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is required");
    console.error("Make sure your .env.local file is loaded or set the variable directly");
    process.exit(1);
  }

  if (!SEED_USER_EMAIL) {
    console.error("Error: SEED_USER_EMAIL environment variable is required");
    console.error("Set it to the email of the user to seed data for:");
    console.error("  SEED_USER_EMAIL=your@email.com npm run seed");
    process.exit(1);
  }

  console.log(`\nSeeding ${weeks} weeks of data for user: ${SEED_USER_EMAIL}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("workout-tracker");

    // Find user
    const user = await db.collection("users").findOne({ email: SEED_USER_EMAIL });
    if (!user) {
      console.error(`Error: User with email "${SEED_USER_EMAIL}" not found`);
      console.error("Make sure you've logged in at least once to create your user account");
      process.exit(1);
    }

    const userId = user._id as ObjectId;
    console.log(`Found user: ${user.name} (${user.email})`);

    // Delete existing seed data
    const deleteWorkouts = await db.collection("workouts").deleteMany({ userId, isSeed: true });
    const deleteMetrics = await db.collection("bodyMetrics").deleteMany({ userId, isSeed: true });
    console.log(`Deleted ${deleteWorkouts.deletedCount} existing seed workouts`);
    console.log(`Deleted ${deleteMetrics.deletedCount} existing seed body metrics`);

    // Calculate start date (weeks ago from today)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));
    // Adjust to Monday
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysToMonday);
    startDate.setHours(8, 0, 0, 0); // 8 AM

    console.log(`\nGenerating data from ${startDate.toDateString()} to today...\n`);

    // Generate and insert workouts
    const startWeight = user.settings?.bodyWeight || 70;
    const workouts = generateWorkouts(userId, weeks, startDate);
    const metrics = generateBodyMetrics(userId, weeks, startDate, startWeight);

    if (workouts.length > 0) {
      await db.collection("workouts").insertMany(workouts);
      console.log(`Inserted ${workouts.length} workouts`);
    }

    if (metrics.length > 0) {
      await db.collection("bodyMetrics").insertMany(metrics);
      console.log(`Inserted ${metrics.length} body metrics`);
    }

    // Summary
    const phases = Math.ceil(weeks / 6);
    console.log(`\n✓ Seed complete!`);
    console.log(`  - ${workouts.length} workouts (${weeks} weeks, ${phases} phase${phases > 1 ? "s" : ""})`);
    console.log(`  - ${metrics.length} body weight entries`);
    console.log(`\nTo delete seed data: npm run seed:delete`);

  } finally {
    await client.close();
  }
}

main().catch(console.error);
