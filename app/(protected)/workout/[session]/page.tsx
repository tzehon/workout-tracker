"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { programPhases, exerciseDefinitions } from "@/lib/program-data";
import { ExerciseLog, SetLog, SessionType, ClientWorkout } from "@/types";
import { ArrowLeft, CheckCircle, Clock, Save, Play } from "lucide-react";
import Link from "next/link";

function sessionFromSlug(slug: string): SessionType {
  const map: Record<string, SessionType> = {
    "push-1": "Push 1",
    "pull-1": "Pull 1",
    "push-2": "Push 2",
    "pull-2": "Pull 2",
  };
  return map[slug] || "Push 1";
}

function createInitialExerciseLogs(
  exercises: { letter: string; name: string; targetSets: string }[]
): ExerciseLog[] {
  return exercises.map((e) => {
    // Parse target sets to get initial number
    const setsMatch = e.targetSets.match(/(\d+)/);
    const numSets = setsMatch ? parseInt(setsMatch[1]) : 3;

    const sets: SetLog[] = Array.from({ length: numSets }, (_, i) => ({
      setNumber: i + 1,
      reps: 0,
      completed: false,
    }));

    return {
      letter: e.letter,
      exerciseName: e.name,
      progression: { variant: "" },
      sets,
    };
  });
}

export default function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const resolvedParams = use(params);
  const sessionSlug = resolvedParams.session;
  const sessionType = sessionFromSlug(sessionSlug);

  const { data: session } = useSession();
  const router = useRouter();

  const settings = session?.user?.settings;
  const currentPhase = settings?.currentPhase || 1;
  const currentWeek = settings?.currentWeek || 1;
  const isDeload = currentWeek === 6;

  const phaseData = programPhases.find((p) => p.phase === currentPhase);
  const sessionData = phaseData
    ? isDeload
      ? phaseData.deloadSessions[sessionType]
      : phaseData.sessions[sessionType]
    : null;

  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previousWorkouts, setPreviousWorkouts] = useState<
    Record<string, ExerciseLog>
  >({});
  const [variantSuggestions, setVariantSuggestions] = useState<
    Record<string, string[]>
  >({});

  // Initialize exercise logs
  useEffect(() => {
    if (sessionData) {
      setExerciseLogs(createInitialExerciseLogs(sessionData.exercises));
    }
  }, [sessionData]);

  // Fetch previous workout data
  useEffect(() => {
    async function fetchPreviousData() {
      try {
        const res = await fetch(
          `/api/workouts?session=${encodeURIComponent(sessionType)}&limit=1`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.workouts.length > 0) {
            const prevWorkout = data.data.workouts[0] as ClientWorkout;
            const prevLogs: Record<string, ExerciseLog> = {};
            prevWorkout.exercises.forEach((e) => {
              prevLogs[e.exerciseName] = e;
            });
            setPreviousWorkouts(prevLogs);
          }
        }
      } catch (error) {
        console.error("Failed to fetch previous workouts:", error);
      }
    }

    fetchPreviousData();
  }, [sessionType]);

  // Build variant suggestions from exercise definitions
  useEffect(() => {
    if (sessionData) {
      const suggestions: Record<string, string[]> = {};
      sessionData.exercises.forEach((e) => {
        const def = exerciseDefinitions.find((d) => d.name === e.name);
        suggestions[e.name] = def?.exampleProgressions || [];
      });
      setVariantSuggestions(suggestions);
    }
  }, [sessionData]);

  // Auto-save function - only saves if workout has been started
  const saveWorkout = useCallback(async () => {
    if (!session?.user || !workoutStarted || !startTime) return;

    setSaving(true);
    try {
      const duration = Math.round(
        (new Date().getTime() - startTime.getTime()) / 60000
      );

      const workoutData = {
        date: new Date().toISOString(),
        phase: currentPhase,
        week: currentWeek,
        session: sessionType,
        isDeload,
        exercises: exerciseLogs,
        notes: workoutNotes,
        duration,
      };

      let res;
      if (workoutId) {
        res = await fetch(`/api/workouts/${workoutId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workoutData),
        });
      } else {
        res = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workoutData),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (!workoutId && data.data?.id) {
          setWorkoutId(data.data.id);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setSaving(false);
    }
  }, [
    session,
    workoutId,
    exerciseLogs,
    workoutNotes,
    currentPhase,
    currentWeek,
    sessionType,
    isDeload,
    startTime,
    workoutStarted,
  ]);

  // Explicit start workout function
  const startWorkout = () => {
    setWorkoutStarted(true);
    setStartTime(new Date());
  };

  const updateExerciseLog = (index: number, log: ExerciseLog) => {
    const newLogs = [...exerciseLogs];
    newLogs[index] = log;
    setExerciseLogs(newLogs);
  };

  const copyFromPrevious = (index: number) => {
    const exerciseName = exerciseLogs[index].exerciseName;
    const previous = previousWorkouts[exerciseName];
    if (previous) {
      const newLogs = [...exerciseLogs];
      newLogs[index] = {
        ...exerciseLogs[index],
        progression: previous.progression,
        sets: previous.sets.map((s, i) => ({
          ...s,
          setNumber: i + 1,
          completed: false,
        })),
      };
      setExerciseLogs(newLogs);
    }
  };

  const completeWorkout = async () => {
    await saveWorkout();
    router.push("/dashboard");
  };

  if (!sessionData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const completedExercises = exerciseLogs.filter((e) =>
    e.sets.every((s) => s.completed)
  ).length;
  const totalExercises = exerciseLogs.length;
  const duration = startTime
    ? Math.round((new Date().getTime() - startTime.getTime()) / 60000)
    : 0;

  // Pre-workout view: Show exercises as preview with Start button
  if (!workoutStarted) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/workout">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{sessionType}</h1>
            <p className="text-sm text-muted-foreground">
              Phase {currentPhase}, Week {currentWeek}
              {isDeload && " (Deload)"}
            </p>
          </div>
        </div>

        {/* Exercise preview */}
        <Card>
          <CardContent className="pt-4">
            <h2 className="mb-4 font-semibold">Exercises</h2>
            <div className="space-y-2">
              {sessionData.exercises.map((exercise) => (
                <div
                  key={exercise.letter}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {exercise.letter}
                    </span>
                    <span className="text-sm">{exercise.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {exercise.targetSets}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Start workout button */}
        <Button className="w-full" size="lg" onClick={startWorkout}>
          <Play className="mr-2 h-5 w-5" />
          Start Workout
        </Button>
      </div>
    );
  }

  // Active workout view
  return (
    <div className="space-y-6 pb-40">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/workout">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{sessionType}</h1>
            <p className="text-sm text-muted-foreground">
              Phase {currentPhase}, Week {currentWeek}
              {isDeload && " (Deload)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" /> Saved
            </Badge>
          )}
          {saving && (
            <Badge variant="secondary" className="gap-1">
              <Save className="h-3 w-3" /> Saving...
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {duration}m
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              {completedExercises}/{totalExercises} exercises completed
            </span>
            <span className="text-muted-foreground">
              {Math.round((completedExercises / totalExercises) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(completedExercises / totalExercises) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise cards */}
      <div className="space-y-4">
        {sessionData.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.letter}
            exercise={exercise}
            exerciseLog={exerciseLogs[index] || createInitialExerciseLogs([exercise])[0]}
            previousLog={previousWorkouts[exercise.name]}
            variantSuggestions={variantSuggestions[exercise.name] || []}
            onChange={(log) => updateExerciseLog(index, log)}
            onCopyPrevious={
              previousWorkouts[exercise.name]
                ? () => copyFromPrevious(index)
                : undefined
            }
          />
        ))}
      </div>

      {/* Workout notes */}
      <Card>
        <CardContent className="pt-4">
          <Textarea
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="Overall workout notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="fixed bottom-20 left-0 right-0 border-t bg-background p-4 md:relative md:bottom-auto md:border-0 md:bg-transparent md:p-0">
        <div className="flex gap-2">
          <Button
            variant={saved ? "default" : "outline"}
            size="lg"
            onClick={saveWorkout}
            disabled={saving}
            className={`flex-1 transition-all ${saved ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {saved ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Saved!
              </>
            ) : saving ? (
              <>
                <Save className="mr-2 h-5 w-5 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save
              </>
            )}
          </Button>
          <Button
            size="lg"
            onClick={completeWorkout}
            disabled={saving}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
