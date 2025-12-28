"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { programPhases, weeklySchedule } from "@/lib/program-data";
import { Info, Clock, Calendar, Dumbbell, Zap } from "lucide-react";

export default function ProgramPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Program Info</h1>
        <p className="text-muted-foreground">
          18-Week Gymnastic Rings Training Program
        </p>
      </div>

      {/* Program Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {programPhases.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-lg border p-4 text-center"
              >
                <Badge className="mb-2">Phase {phase.phase}</Badge>
                <p className="font-medium">{phase.name}</p>
                <p className="text-sm text-muted-foreground">
                  {phase.weeks} weeks
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Each phase consists of 5 training weeks followed by 1 deload week for
            recovery. The program progressively increases in difficulty across
            phases.
          </p>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Recommended Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {Object.entries(weeklySchedule).map(([day, session]) => {
              const isWorkout =
                session.includes("Push") || session.includes("Pull");
              return (
                <div
                  key={day}
                  className={`rounded-lg p-3 ${isWorkout ? "bg-primary/10" : "bg-muted"}`}
                >
                  <p className="text-xs font-medium capitalize">
                    {day.slice(0, 3)}
                  </p>
                  <p
                    className={`mt-1 text-sm ${isWorkout ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {isWorkout ? session.replace(" ", "") : "Rest"}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            4 sessions per week: 2 Push days and 2 Pull days, with adequate rest
            between sessions for recovery.
          </p>
        </CardContent>
      </Card>

      {/* Tempo Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Understanding Tempo
          </CardTitle>
          <CardDescription>
            How to read tempo notation like &quot;30X1&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-xs text-muted-foreground">
                Eccentric (lowering)
              </p>
              <p className="mt-1 text-sm">3 seconds</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Pause (bottom)</p>
              <p className="mt-1 text-sm">0 seconds</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-primary">X</p>
              <p className="text-xs text-muted-foreground">
                Concentric (lifting)
              </p>
              <p className="mt-1 text-sm">Explosive</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-primary">1</p>
              <p className="text-xs text-muted-foreground">Pause (top)</p>
              <p className="mt-1 text-sm">1 second</p>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <strong>Example: Ring Dip with 30X1 tempo</strong>
              <br />
              Lower yourself for 3 seconds, no pause at bottom, push up
              explosively, pause for 1 second at top with arms locked out.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deload Week Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Deload Week Guide
          </CardTitle>
          <CardDescription>Week 6 of each phase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Every 6th week is a deload week. During deload weeks:
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Sets are reduced by approximately 50%</li>
            <li>Same exercises and rep ranges as training weeks</li>
            <li>Focus on technique and form</li>
            <li>Allow your body to recover and adapt</li>
            <li>Maintain training frequency (4 sessions/week)</li>
          </ul>
          <div className="rounded-lg bg-warning/10 p-4">
            <p className="text-sm">
              <strong>Important:</strong> Don&apos;t skip deload weeks! They are
              essential for long-term progress and injury prevention.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Special Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Special Protocols
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="font-medium">L&R (Left and Right)</p>
              <p className="text-sm text-muted-foreground">
                Unilateral exercises - track reps for each side separately.
                Example: &quot;4-6 L&R&quot; means 4-6 reps per side.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="font-medium">Accumulation</p>
              <p className="text-sm text-muted-foreground">
                Exercises like hangs with &quot;Accumulation&quot; tempo mean
                you accumulate total time across multiple sets. Self-regulated
                rest between attempts.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="font-medium">Down Series (!)</p>
              <p className="text-sm text-muted-foreground">
                Exercises marked with &quot;!&quot; like &quot;8-15! Down&quot; -
                Start at your max (e.g., 8 reps), minimal rest, then 7, 6, 5...
                down to 1.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="font-medium">Iso Holds</p>
              <p className="text-sm text-muted-foreground">
                Exercises with &quot;2s iso&quot; or similar - hold the position
                for the specified time at the top of each rep.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Dumbbell className="h-4 w-4" />
            Session Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="push">
            <TabsList className="w-full">
              <TabsTrigger value="push" className="flex-1">
                Push Days
              </TabsTrigger>
              <TabsTrigger value="pull" className="flex-1">
                Pull Days
              </TabsTrigger>
            </TabsList>

            <TabsContent value="push" className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Push 1 and Push 2 focus on:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Chest (Ring Dips, Pushups, Flyes)</li>
                <li>Shoulders (Shoulder Pushups, Shrugs)</li>
                <li>Triceps (Dips, Extensions)</li>
              </ul>
            </TabsContent>

            <TabsContent value="pull" className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Pull 1 and Pull 2 focus on:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Back (Pullups, Rows)</li>
                <li>Biceps (Curls, Pelican Curls)</li>
                <li>Rear Delts (Face Pulls, Flyes)</li>
                <li>Core (Rollouts)</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
