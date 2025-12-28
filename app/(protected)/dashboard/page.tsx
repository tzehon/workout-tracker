"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ClientWorkout, SessionType } from "@/types";
import { weeklySchedule, programPhases } from "@/lib/program-data";
import { Play, Calendar, TrendingUp } from "lucide-react";

// Get today's recommended session
function getTodaySession(): SessionType | null {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const today = days[new Date().getDay()];
  const session = weeklySchedule[today as keyof typeof weeklySchedule];
  if (session.includes("Push") || session.includes("Pull")) {
    return session as SessionType;
  }
  return null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [recentWorkouts, setRecentWorkouts] = useState<ClientWorkout[]>([]);
  const [weeklyCompletedSessions, setWeeklyCompletedSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const settings = session?.user?.settings;
  const currentPhase = settings?.currentPhase || 1;
  const currentWeek = settings?.currentWeek || 1;
  const isDeload = currentWeek === 6;
  const todaySession = getTodaySession();
  const phaseData = programPhases.find((p) => p.phase === currentPhase);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch this week's workouts (for stats) and recent workouts separately
        const [thisWeekRes, recentRes] = await Promise.all([
          fetch("/api/workouts?limit=10&thisWeek=true"),
          fetch("/api/workouts?limit=5"),
        ]);

        if (thisWeekRes.ok) {
          const data = await thisWeekRes.json();
          if (data.success) {
            setWeeklyCompletedSessions(
              (data.data.workouts || []).map((w: ClientWorkout) => w.session)
            );
          }
        }

        if (recentRes.ok) {
          const data = await recentRes.json();
          if (data.success) {
            setRecentWorkouts(data.data.workouts || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workouts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Phase {currentPhase}: {phaseData?.name} • Week {currentWeek}
            {isDeload && " (Deload)"}
          </p>
        </div>
        {todaySession && (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link
              href={`/workout/${encodeURIComponent(todaySession.toLowerCase().replace(" ", "-"))}`}
            >
              <Play className="mr-2 h-4 w-4" />
              Start {todaySession}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {weeklyCompletedSessions.length}/4
                </p>
                <p className="text-xs text-muted-foreground">
                  workouts completed
                </p>
              </div>
              <ProgressRing
                completed={weeklyCompletedSessions.length}
                total={4}
                size={60}
                strokeWidth={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Phase {currentPhase}</p>
            <p className="text-xs text-muted-foreground">{phaseData?.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Week</CardTitle>
            {isDeload && <Badge variant="warning">Deload</Badge>}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Week {currentWeek}</p>
            <p className="text-xs text-muted-foreground">
              {isDeload ? "Recovery week" : `of ${phaseData?.weeks || 6}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((currentPhase - 1) * 6 + currentWeek)}/18
            </p>
            <p className="text-xs text-muted-foreground">weeks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <WeeklySchedule
        completedSessions={weeklyCompletedSessions}
        currentDay={new Date().getDay()}
      />

      {/* Recent Workouts */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : (
        <RecentWorkouts
          workouts={recentWorkouts}
          onDelete={(id) => {
            setRecentWorkouts((prev) => prev.filter((w) => w.id !== id));
            setWeeklyCompletedSessions((prev) => {
              const deleted = recentWorkouts.find((w) => w.id === id);
              if (deleted) {
                return prev.filter((s) => s !== deleted.session);
              }
              return prev;
            });
          }}
        />
      )}
    </div>
  );
}
