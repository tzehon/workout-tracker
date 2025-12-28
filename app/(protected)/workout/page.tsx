"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programPhases, weeklySchedule } from "@/lib/program-data";
import { SessionType } from "@/types";
import { ArrowRight, Dumbbell } from "lucide-react";

const sessions: SessionType[] = ["Push 1", "Pull 1", "Push 2", "Pull 2"];

function getRecommendedSession(): SessionType | null {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const today = days[new Date().getDay()];
  const session = weeklySchedule[today as keyof typeof weeklySchedule];
  if (session.includes("Push") || session.includes("Pull")) {
    return session as SessionType;
  }
  return null;
}

export default function WorkoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const settings = session?.user?.settings;
  const currentPhase = settings?.currentPhase || 1;
  const currentWeek = settings?.currentWeek || 1;
  const isDeload = currentWeek === 6;
  const recommendedSession = getRecommendedSession();

  const phaseData = programPhases.find((p) => p.phase === currentPhase);
  if (!phaseData) return null;

  const currentSessions = isDeload
    ? phaseData.deloadSessions
    : phaseData.sessions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Start Workout</h1>
        <p className="text-muted-foreground">
          Phase {currentPhase}: {phaseData.name} • Week {currentWeek}
          {isDeload && " (Deload)"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sessions.map((sessionType) => {
          const sessionData = currentSessions[sessionType];
          const isRecommended = sessionType === recommendedSession;
          const exerciseCount = sessionData.exercises.length;
          const sessionUrl = `/workout/${encodeURIComponent(sessionType.toLowerCase().replace(" ", "-"))}`;

          return (
            <Card
              key={sessionType}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${isRecommended ? "ring-2 ring-primary" : ""}`}
              onClick={() => router.push(sessionUrl)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    {sessionType}
                  </CardTitle>
                  <div className="flex gap-2">
                    {isRecommended && (
                      <Badge variant="default">Today</Badge>
                    )}
                    {isDeload && (
                      <Badge variant="warning">Deload</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {exerciseCount} exercises •{" "}
                  {sessionType.includes("Push") ? "Chest, Shoulders, Triceps" : "Back, Biceps"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-1">
                  {sessionData.exercises.slice(0, 3).map((exercise) => (
                    <p key={exercise.letter} className="text-sm text-muted-foreground">
                      {exercise.letter}: {exercise.name}
                    </p>
                  ))}
                  {exerciseCount > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{exerciseCount - 3} more...
                    </p>
                  )}
                </div>
                <Button className="w-full">
                  Start Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
