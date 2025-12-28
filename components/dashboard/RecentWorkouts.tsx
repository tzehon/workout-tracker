"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ClientWorkout } from "@/types";
import { formatDistanceToNow } from "@/lib/date-utils";
import { ChevronRight, Dumbbell, Trash2 } from "lucide-react";

interface RecentWorkoutsProps {
  workouts: ClientWorkout[];
  onDelete?: (id: string) => void;
}

export function RecentWorkouts({ workouts, onDelete }: RecentWorkoutsProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this workout?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(id);
      }
    } catch (error) {
      console.error("Failed to delete workout:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (workouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Start your first workout to begin tracking your progress"
            action={
              <Button asChild>
                <Link href="/workout">Start Workout</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Workouts</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/progress">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {workouts.slice(0, 5).map((workout) => (
          <div
            key={workout.id}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <Link
              href={`/workout/history/${workout.id}`}
              className="flex flex-1 flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{workout.session}</span>
                {workout.isDeload && (
                  <Badge variant="warning" className="text-xs">
                    Deload
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Phase {workout.phase}, Week {workout.week} •{" "}
                {formatDistanceToNow(new Date(workout.date))}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDelete(e, workout.id)}
                disabled={deleting === workout.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Link href={`/workout/history/${workout.id}`}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
