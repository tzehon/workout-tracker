"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ClientWorkout } from "@/types";
import { formatDate } from "@/lib/date-utils";
import { ArrowLeft, Clock, Calendar, CheckCircle, MessageSquare } from "lucide-react";

export default function WorkoutHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const workoutId = resolvedParams.id;

  const [workout, setWorkout] = useState<ClientWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkout() {
      try {
        const res = await fetch(`/api/workouts/${workoutId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setWorkout(data.data);
          } else {
            setError(data.error || "Failed to load workout");
          }
        } else if (res.status === 404) {
          setError("Workout not found");
        } else {
          setError("Failed to load workout");
        }
      } catch (err) {
        console.error("Failed to fetch workout:", err);
        setError("Failed to load workout");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkout();
  }, [workoutId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{error || "Workout not found"}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSets = workout.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0
  );
  const totalReps = workout.exercises.reduce(
    (sum, e) =>
      sum +
      e.sets
        .filter((s) => s.completed)
        .reduce((setSum, s) => {
          if (s.repsLeft !== undefined && s.repsRight !== undefined) {
            return setSum + s.repsLeft + s.repsRight;
          }
          return setSum + (s.reps || 0);
        }, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{workout.session}</h1>
          <p className="text-sm text-muted-foreground">
            Phase {workout.phase}, Week {workout.week}
            {workout.isDeload && " (Deload)"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium">
              {formatDate(new Date(workout.date))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{workout.duration || 0}m</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <CheckCircle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="text-sm font-medium">
              {totalSets}s / {totalReps}r
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => {
          const completedSets = exercise.sets.filter((s) => s.completed);

          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {exercise.letter}
                    </Badge>
                    <CardTitle className="text-base">
                      {exercise.exerciseName}
                    </CardTitle>
                  </div>
                  {completedSets.length > 0 && (
                    <Badge variant="success">
                      {completedSets.length} sets
                    </Badge>
                  )}
                </div>
                {exercise.progression.variant && (
                  <p className="text-sm text-muted-foreground">
                    Variant: {exercise.progression.variant}
                    {exercise.progression.ringHeight &&
                      ` • Ring: ${exercise.progression.ringHeight}`}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {completedSets.length > 0 ? (
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className={`flex items-center justify-between rounded-lg border p-2 ${
                          set.completed
                            ? "border-success/50 bg-success/10"
                            : "opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Set {set.setNumber}
                          </span>
                          {set.completed && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {set.repsLeft !== undefined &&
                          set.repsRight !== undefined ? (
                            <span className="font-medium">
                              {set.repsLeft}L / {set.repsRight}R
                            </span>
                          ) : set.time !== undefined ? (
                            <span className="font-medium">{set.time}s</span>
                          ) : (
                            <span className="font-medium">{set.reps} reps</span>
                          )}
                          {set.notes && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {set.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No sets completed
                  </p>
                )}
                {exercise.notes && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-2">
                    <p className="text-sm text-muted-foreground">
                      <MessageSquare className="mr-1 inline h-3 w-3" />
                      {exercise.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Workout Notes */}
      {workout.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workout Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
