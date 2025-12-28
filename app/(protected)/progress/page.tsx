"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ClientWorkout } from "@/types";
import { formatDate } from "@/lib/date-utils";
import {
  TrendingUp,
  Dumbbell,
  ChevronRight,
  Target,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface WeeklyStats {
  week: string;
  workouts: number;
  totalSets: number;
  totalReps: number;
}

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
  avgRepsPerSet: number;
  lastVariant: string;
  lastDate: string;
  history: { date: string; sets: number; reps: number; variant: string }[];
}

export default function ProgressPage() {
  const { data: session } = useSession();
  const [workouts, setWorkouts] = useState<ClientWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const settings = session?.user?.settings;
  const currentPhase = settings?.currentPhase || 1;
  const currentWeek = settings?.currentWeek || 1;

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const res = await fetch("/api/workouts?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setWorkouts(data.data.workouts || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workouts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, []);

  // Calculate overall stats
  const totalWorkouts = workouts.length;
  const totalSets = workouts.reduce(
    (sum, w) =>
      sum +
      w.exercises.reduce(
        (eSum, e) => eSum + e.sets.filter((s) => s.completed).length,
        0
      ),
    0
  );
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  // Calculate weekly data for chart
  const weeklyData: WeeklyStats[] = [];
  const groupedByWeek = workouts.reduce(
    (acc, w) => {
      const weekStart = new Date(w.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!acc[weekKey]) {
        acc[weekKey] = { workouts: 0, sets: 0, reps: 0 };
      }

      acc[weekKey].workouts++;
      w.exercises.forEach((e) => {
        e.sets.filter((s) => s.completed).forEach((s) => {
          acc[weekKey].sets++;
          acc[weekKey].reps += s.reps || 0;
          if (s.repsLeft) acc[weekKey].reps += s.repsLeft;
          if (s.repsRight) acc[weekKey].reps += s.repsRight;
        });
      });

      return acc;
    },
    {} as Record<string, { workouts: number; sets: number; reps: number }>
  );

  Object.entries(groupedByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .forEach(([week, stats]) => {
      weeklyData.push({
        week: new Date(week).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        workouts: stats.workouts,
        totalSets: stats.sets,
        totalReps: stats.reps,
      });
    });

  // Calculate per-exercise stats
  const exerciseStatsMap = new Map<string, ExerciseStats>();

  // Sort workouts by date (oldest first for history)
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedWorkouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const completedSets = exercise.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return;

      const reps = completedSets.reduce((sum, s) => {
        if (s.repsLeft !== undefined && s.repsRight !== undefined) {
          return sum + s.repsLeft + s.repsRight;
        }
        return sum + (s.reps || 0);
      }, 0);

      const existing = exerciseStatsMap.get(exercise.exerciseName);
      const historyEntry = {
        date: workout.date,
        sets: completedSets.length,
        reps,
        variant: exercise.progression.variant || "Standard",
      };

      if (existing) {
        existing.totalSets += completedSets.length;
        existing.totalReps += reps;
        existing.avgRepsPerSet = Math.round(existing.totalReps / existing.totalSets * 10) / 10;
        existing.lastVariant = exercise.progression.variant || existing.lastVariant;
        existing.lastDate = workout.date;
        existing.history.push(historyEntry);
      } else {
        exerciseStatsMap.set(exercise.exerciseName, {
          name: exercise.exerciseName,
          totalSets: completedSets.length,
          totalReps: reps,
          avgRepsPerSet: Math.round(reps / completedSets.length * 10) / 10,
          lastVariant: exercise.progression.variant || "Standard",
          lastDate: workout.date,
          history: [historyEntry],
        });
      }
    });
  });

  const exerciseStats = Array.from(exerciseStatsMap.values()).sort(
    (a, b) => b.totalSets - a.totalSets
  );

  // Calculate program progress
  const weeksCompleted = (currentPhase - 1) * 6 + currentWeek - 1;
  const progressPercent = Math.round((weeksCompleted / 18) * 100);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted-foreground">Track your training journey</p>
      </div>

      {/* Program Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            18-Week Program Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>
              Phase {currentPhase}, Week {currentWeek}
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 18 }, (_, i) => {
              const weekNum = i + 1;
              const isCompleted = weekNum <= weeksCompleted;
              const isCurrent = weekNum === weeksCompleted + 1;
              const isDeload = weekNum % 6 === 0;

              return (
                <div
                  key={i}
                  className={`h-6 flex-1 rounded ${
                    isCompleted
                      ? "bg-primary"
                      : isCurrent
                        ? "bg-primary/50"
                        : isDeload
                          ? "bg-warning/20"
                          : "bg-muted"
                  }`}
                  title={`Week ${weekNum}${isDeload ? " (Deload)" : ""}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Phase 1</span>
            <span>Phase 2</span>
            <span>Phase 3</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              Total Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalWorkouts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Total Sets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(totalDuration / 60)}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="week"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalSets"
                    name="Sets"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Progress */}
      {exerciseStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exercise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exerciseStats.map((exercise) => (
                <div
                  key={exercise.name}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{exercise.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last: {exercise.lastVariant}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {exercise.avgRepsPerSet} reps/set avg
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.totalSets} sets total
                      </p>
                    </div>
                  </div>
                  {exercise.history.length > 1 && (
                    <div className="mt-3 flex items-end gap-1">
                      {exercise.history.slice(-8).map((h, i) => {
                        const maxReps = Math.max(
                          ...exercise.history.slice(-8).map((x) => x.reps)
                        );
                        const height = Math.max(20, (h.reps / maxReps) * 60);
                        return (
                          <div
                            key={i}
                            className="flex flex-1 flex-col items-center gap-1"
                          >
                            <div
                              className="w-full rounded-sm bg-primary/80"
                              style={{ height: `${height}px` }}
                              title={`${h.reps} reps (${h.variant})`}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {h.reps}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Workout History</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workouts yet"
              description="Start your first workout to see your history here."
              action={
                <Button asChild>
                  <Link href="/workout">Start Workout</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {workouts.slice(0, 10).map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workout/history/${workout.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{workout.session}</span>
                      {workout.isDeload && (
                        <Badge variant="warning" className="text-xs">
                          Deload
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Phase {workout.phase}, Week {workout.week} •{" "}
                      {formatDate(new Date(workout.date))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.duration && (
                      <span className="text-sm text-muted-foreground">
                        {workout.duration}m
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
