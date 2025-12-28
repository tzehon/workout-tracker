"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { weeklySchedule } from "@/lib/program-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface WeeklyScheduleProps {
  completedSessions: string[]; // Array of session names completed this week
  currentDay: number; // 0 = Sunday, 1 = Monday, etc.
}

const days = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

export function WeeklySchedule({
  completedSessions,
  currentDay,
}: WeeklyScheduleProps) {
  const router = useRouter();
  // Convert JS day (0=Sun) to our format (0=Mon)
  const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

  const handleDayClick = (session: string) => {
    // Convert "Push 1" to "push-1" for URL
    const slug = session.toLowerCase().replace(" ", "-");
    router.push(`/workout/${slug}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const session = weeklySchedule[day.key];
            const isWorkout = session.includes("Push") || session.includes("Pull");
            const isCompleted =
              isWorkout && completedSessions.includes(session);
            const isToday = index === todayIndex;

            return (
              <div
                key={day.key}
                onClick={isWorkout ? () => handleDayClick(session) : undefined}
                className={cn(
                  "flex flex-col items-center rounded-lg p-2 text-center",
                  isToday && "bg-primary/10 ring-1 ring-primary",
                  !isToday && isWorkout && "bg-muted/50",
                  isWorkout && "cursor-pointer transition-colors hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {day.label}
                </span>
                <div className="mt-1 flex h-8 items-center justify-center">
                  {isWorkout ? (
                    isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Badge
                        variant={isToday ? "default" : "secondary"}
                        className="text-[10px] px-1.5"
                      >
                        {session.replace(" ", "")}
                      </Badge>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">Rest</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
