"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exerciseDefinitions, programPhases } from "@/lib/program-data";
import { slugify } from "@/lib/utils";
import { Search, ChevronRight } from "lucide-react";

type FilterCategory = "all" | "Push" | "Pull";

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FilterCategory>("all");

  const filteredExercises = exerciseDefinitions.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || exercise.category === category;
    return matchesSearch && matchesCategory;
  });

  // Get phase info for each exercise
  const getExercisePhases = (name: string): number[] => {
    const phases: number[] = [];
    programPhases.forEach((phase) => {
      Object.values(phase.sessions).forEach((session) => {
        if (session.exercises.some((e) => e.name === name)) {
          if (!phases.includes(phase.phase)) {
            phases.push(phase.phase);
          }
        }
      });
    });
    return phases.sort();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <p className="text-muted-foreground">
          All exercises in the Rings program
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="pl-9"
          />
        </div>
        <Tabs
          value={category}
          onValueChange={(v) => setCategory(v as FilterCategory)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Push">Push</TabsTrigger>
            <TabsTrigger value="Pull">Pull</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Exercise Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map((exercise) => {
          const phases = getExercisePhases(exercise.name);

          return (
            <Link
              key={exercise.name}
              href={`/exercises/${slugify(exercise.name)}`}
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{exercise.name}</CardTitle>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge
                      variant={
                        exercise.category === "Push" ? "default" : "secondary"
                      }
                    >
                      {exercise.category}
                    </Badge>
                    {phases.map((phase) => (
                      <Badge key={phase} variant="outline">
                        Phase {phase}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {exercise.muscleGroups.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tempo: {exercise.defaultTempo}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredExercises.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No exercises found matching your search.
        </div>
      )}
    </div>
  );
}
