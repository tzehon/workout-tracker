"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Circle, Info } from "lucide-react";
import { SessionType } from "@/types";

interface WeeklyScheduleProps {
  completedSessions: string[];
  currentPhase: number;
  currentWeek: number;
}

const ALL_SESSIONS: { name: SessionType; label: string; shortLabel: string }[] = [
  { name: "Push 1", label: "Push 1", shortLabel: "P1" },
  { name: "Pull 1", label: "Pull 1", shortLabel: "L1" },
  { name: "Push 2", label: "Push 2", shortLabel: "P2" },
  { name: "Pull 2", label: "Pull 2", shortLabel: "L2" },
];

export function WeeklySchedule({
  completedSessions,
  currentPhase,
  currentWeek,
}: WeeklyScheduleProps) {
  const router = useRouter();

  const handleSessionClick = (session: SessionType) => {
    const slug = session.toLowerCase().replace(" ", "-");
    router.push(`/workout/${slug}`);
  };

  const completedCount = completedSessions.length;
  const remainingCount = 4 - completedCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              Training Week {currentWeek}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium">Flexible Training Weeks</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete all 4 sessions at your own pace. No time pressure -
                    your progress carries over regardless of calendar dates.
                    Once all sessions are done, you can advance to the next week.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant={completedCount === 4 ? "success" : "secondary"}>
            {completedCount}/4 complete
          </Badge>
        </div>
        {remainingCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {remainingCount} session{remainingCount !== 1 ? "s" : ""} remaining in Phase {currentPhase}, Week {currentWeek}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_SESSIONS.map((session) => {
            const isCompleted = completedSessions.includes(session.name);

            return (
              <div
                key={session.name}
                onClick={() => handleSessionClick(session.name)}
                className={cn(
                  "flex cursor-pointer flex-col items-center rounded-lg border p-3 transition-colors",
                  isCompleted
                    ? "border-success/50 bg-success/10"
                    : "border-border hover:border-primary hover:bg-muted/50"
                )}
              >
                <div className="mb-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-success" : "text-foreground"
                  )}
                >
                  {session.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isCompleted ? "Done" : "Tap to start"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
