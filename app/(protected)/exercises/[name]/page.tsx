"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { exerciseDefinitions, programPhases } from "@/lib/program-data";
import { unslugify } from "@/lib/utils";
import { ClientWorkout } from "@/types";
import { ArrowLeft, TrendingUp, History, Trophy } from "lucide-react";

interface ExerciseHistory {
  date: string;
  phase: number;
  week: number;
  variant: string;
  sets: number;
  totalReps: number;
  bestSet: number;
}

export default function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.name;
  const exerciseName = unslugify(slug);

  useSession();
  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Find exercise definition
  const exercise = exerciseDefinitions.find(
    (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
  );

  // Find which phases/sessions contain this exercise
  const appearances: { phase: number; sessions: string[] }[] = [];
  programPhases.forEach((phase) => {
    const sessions: string[] = [];
    Object.entries(phase.sessions).forEach(([sessionName, sessionData]) => {
      if (sessionData.exercises.some((e) => e.name === exercise?.name)) {
        sessions.push(sessionName);
      }
    });
    if (sessions.length > 0) {
      appearances.push({ phase: phase.phase, sessions });
    }
  });

  // Fetch workout history for this exercise
  useEffect(() => {
    async function fetchHistory() {
      if (!exercise) return;

      try {
        const res = await fetch("/api/workouts?limit=50");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const exerciseHistory: ExerciseHistory[] = [];

            (data.data.workouts as ClientWorkout[]).forEach((workout) => {
              const log = workout.exercises.find(
                (e) => e.exerciseName === exercise.name
              );
              if (log && log.sets.length > 0) {
                const completedSets = log.sets.filter((s) => s.completed);
                if (completedSets.length > 0) {
                  const totalReps = completedSets.reduce((sum, s) => {
                    if (s.repsLeft !== undefined && s.repsRight !== undefined) {
                      return sum + s.repsLeft + s.repsRight;
                    }
                    return sum + (s.reps || 0);
                  }, 0);

                  const bestSet = Math.max(
                    ...completedSets.map((s) => {
                      if (s.repsLeft !== undefined && s.repsRight !== undefined) {
                        return Math.max(s.repsLeft, s.repsRight);
                      }
                      return s.reps || 0;
                    })
                  );

                  exerciseHistory.push({
                    date: workout.date,
                    phase: workout.phase,
                    week: workout.week,
                    variant: log.progression.variant || "Not specified",
                    sets: completedSets.length,
                    totalReps,
                    bestSet,
                  });
                }
              }
            });

            setHistory(exerciseHistory);
          }
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [exercise]);

  if (!exercise) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exercises">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exercises
          </Link>
        </Button>
        <EmptyState
          title="Exercise not found"
          description="This exercise doesn't exist in the program."
        />
      </div>
    );
  }

  // Calculate stats
  const uniqueVariants = [...new Set(history.map((h) => h.variant))];
  const personalBests = {
    maxReps: Math.max(...history.map((h) => h.bestSet), 0),
    maxVolume: Math.max(...history.map((h) => h.totalReps), 0),
    maxSets: Math.max(...history.map((h) => h.sets), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/exercises">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exercises
          </Link>
        </Button>

        <h1 className="text-2xl font-bold">{exercise.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge
            variant={exercise.category === "Push" ? "default" : "secondary"}
          >
            {exercise.category}
          </Badge>
          {exercise.muscleGroups.map((group) => (
            <Badge key={group} variant="outline">
              {group}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exercise Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercise Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Default Tempo</p>
            <p className="font-medium">{exercise.defaultTempo}</p>
          </div>

          {appearances.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Appears In</p>
              <div className="mt-1 space-y-1">
                {appearances.map(({ phase, sessions }) => (
                  <p key={phase} className="text-sm">
                    <span className="font-medium">Phase {phase}:</span>{" "}
                    {sessions.join(", ")}
                  </p>
                ))}
              </div>
            </div>
          )}

          {exercise.exampleProgressions && (
            <div>
              <p className="text-sm text-muted-foreground">
                Example Progressions
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {exercise.exampleProgressions.map((prog) => (
                  <Badge key={prog} variant="outline">
                    {prog}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for History/Stats */}
      <Tabs defaultValue="history">
        <TabsList className="w-full">
          <TabsTrigger value="history" className="flex-1">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex-1">
            <TrendingUp className="mr-2 h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner className="mx-auto" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={History}
              title="No history yet"
              description="Complete a workout with this exercise to see your history."
            />
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Phase {entry.phase}, Week {entry.week}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {entry.sets} sets × {entry.totalReps} reps
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {entry.variant}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {history.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No stats yet"
              description="Complete workouts to see your progress statistics."
            />
          ) : (
            <>
              {/* Personal Bests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-warning" />
                    Personal Bests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {personalBests.maxReps}
                      </p>
                      <p className="text-xs text-muted-foreground">Best Set</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {personalBests.maxSets}
                      </p>
                      <p className="text-xs text-muted-foreground">Max Sets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {personalBests.maxVolume}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max Volume
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variants Used */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Variants You&apos;ve Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {uniqueVariants.map((variant) => {
                      const count = history.filter(
                        (h) => h.variant === variant
                      ).length;
                      return (
                        <Badge key={variant} variant="secondary">
                          {variant} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Session Count */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{history.length}</p>
                  <p className="text-sm text-muted-foreground">
                    workouts with this exercise
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
