"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SetInput } from "./SetInput";
import { RestTimer } from "./RestTimer";
import { VariantInput } from "./VariantInput";
import { ProgramExercise, ExerciseLog, SetLog, ExerciseProgression } from "@/types";
import { parseRestTime } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Info, Copy } from "lucide-react";

interface ExerciseCardProps {
  exercise: ProgramExercise;
  exerciseLog: ExerciseLog;
  previousLog?: ExerciseLog;
  variantSuggestions: string[];
  onChange: (log: ExerciseLog) => void;
  onCopyPrevious?: () => void;
}

export function ExerciseCard({
  exercise,
  exerciseLog,
  previousLog,
  variantSuggestions,
  onChange,
  onCopyPrevious,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const restSeconds = useMemo(() => parseRestTime(exercise.rest), [exercise.rest]);

  const updateProgression = (updates: Partial<ExerciseProgression>) => {
    onChange({
      ...exerciseLog,
      progression: { ...exerciseLog.progression, ...updates },
    });
  };

  const updateSet = (index: number, set: SetLog) => {
    const newSets = [...exerciseLog.sets];
    newSets[index] = set;
    onChange({ ...exerciseLog, sets: newSets });
  };

  const addSet = () => {
    const newSetNumber = exerciseLog.sets.length + 1;
    onChange({
      ...exerciseLog,
      sets: [
        ...exerciseLog.sets,
        { setNumber: newSetNumber, reps: 0, completed: false },
      ],
    });
  };

  const removeSet = () => {
    if (exerciseLog.sets.length > 1) {
      onChange({
        ...exerciseLog,
        sets: exerciseLog.sets.slice(0, -1),
      });
    }
  };

  const handleSetComplete = () => {
    setShowTimer(true);
  };

  const completedSets = exerciseLog.sets.filter((s) => s.completed).length;
  const totalSets = exerciseLog.sets.length;
  const isComplete = completedSets === totalSets && totalSets > 0;

  return (
    <Card className={isComplete ? "border-success/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {exercise.letter}
              </Badge>
              <CardTitle className="text-base">{exercise.name}</CardTitle>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Sets: {exercise.targetSets}</span>
              <span>Reps: {exercise.targetReps}</span>
              <span>Tempo: {exercise.tempo}</span>
              <span>Rest: {exercise.rest}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && <Badge variant="success">Done</Badge>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {!isExpanded && (
          <div className="mt-2 flex items-center gap-2">
            <div className="text-sm">
              {completedSets}/{totalSets} sets
            </div>
            {exerciseLog.progression.variant && (
              <Badge variant="outline" className="text-xs">
                {exerciseLog.progression.variant}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 overflow-x-hidden">
          {/* Previous performance */}
          {previousLog && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Previous ({previousLog.progression.variant || "No variant"})
                </span>
                {onCopyPrevious && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopyPrevious}
                    className="h-6 text-xs"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                )}
              </div>
              <p className="text-sm">
                {previousLog.sets.length} sets •{" "}
                {previousLog.sets
                  .map((s) =>
                    s.repsLeft !== undefined
                      ? `${s.repsLeft}L/${s.repsRight}R`
                      : s.time !== undefined
                        ? `${s.time}s`
                        : s.reps
                  )
                  .join(", ")}{" "}
                reps
              </p>
            </div>
          )}

          {/* Progression inputs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <VariantInput
              value={exerciseLog.progression.variant}
              suggestions={variantSuggestions}
              placeholder="e.g., Band assisted, Full ROM"
              onChange={(variant) => updateProgression({ variant })}
              className="sm:col-span-2"
            />
            <div>
              <Label className="text-xs text-muted-foreground">Ring Height</Label>
              <Input
                value={exerciseLog.progression.ringHeight || ""}
                onChange={(e) => updateProgression({ ringHeight: e.target.value })}
                placeholder="e.g., 12, hip height"
                className="mt-1"
              />
            </div>
          </div>

          {/* Sets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sets</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeSet}
                  disabled={exerciseLog.sets.length <= 1}
                >
                  -
                </Button>
                <Button variant="outline" size="sm" onClick={addSet}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {exerciseLog.sets.map((set, index) => (
              <SetInput
                key={index}
                setNumber={index + 1}
                set={set}
                isUnilateral={exercise.isUnilateral}
                isTimed={exercise.isTimed}
                onChange={(newSet) => updateSet(index, newSet)}
                onComplete={handleSetComplete}
              />
            ))}
          </div>

          {/* Rest Timer */}
          {showTimer && (
            <RestTimer
              defaultSeconds={restSeconds}
              onComplete={() => setShowTimer(false)}
            />
          )}

          {/* Notes toggle */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="text-muted-foreground"
            >
              <Info className="mr-1 h-3 w-3" />
              {showNotes ? "Hide notes" : "Add notes"}
            </Button>

            {showNotes && (
              <Textarea
                value={exerciseLog.notes || ""}
                onChange={(e) =>
                  onChange({ ...exerciseLog, notes: e.target.value })
                }
                placeholder="Notes for this exercise..."
                className="mt-2"
                rows={2}
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
