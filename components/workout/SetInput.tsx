"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SetLog } from "@/types";
import { Minus, Plus, MessageSquare } from "lucide-react";

interface SetInputProps {
  setNumber: number;
  set: SetLog;
  isUnilateral?: boolean;
  isTimed?: boolean;
  onChange: (set: SetLog) => void;
  onComplete: () => void;
}

export function SetInput({
  setNumber,
  set,
  isUnilateral = false,
  isTimed = false,
  onChange,
  onComplete,
}: SetInputProps) {
  const [showNotes, setShowNotes] = useState(!!set.notes);

  const updateSet = (updates: Partial<SetLog>) => {
    onChange({ ...set, ...updates });
  };

  const incrementReps = (field: "reps" | "repsLeft" | "repsRight") => {
    const current = set[field] || 0;
    updateSet({ [field]: current + 1 });
  };

  const decrementReps = (field: "reps" | "repsLeft" | "repsRight") => {
    const current = set[field] || 0;
    if (current > 0) {
      updateSet({ [field]: current - 1 });
    }
  };

  const handleComplete = () => {
    updateSet({ completed: !set.completed });
    if (!set.completed) {
      onComplete();
    }
  };

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-3 transition-colors",
        set.completed && "border-success/50 bg-success/10"
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={set.completed}
          onCheckedChange={handleComplete}
          className="h-6 w-6 shrink-0"
        />

        <span className="w-12 shrink-0 text-sm font-medium text-muted-foreground">
          Set {setNumber}
        </span>

        {isTimed ? (
          <div className="flex flex-1 items-center justify-center gap-2">
            <Input
              type="number"
              value={set.time || ""}
              onChange={(e) => updateSet({ time: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">seconds</span>
          </div>
        ) : isUnilateral ? (
          <div className="flex flex-1 items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={set.repsLeft || ""}
                onChange={(e) =>
                  updateSet({ repsLeft: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-14 text-center"
              />
              <span className="text-sm text-muted-foreground">L</span>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={set.repsRight || ""}
                onChange={(e) =>
                  updateSet({ repsRight: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-14 text-center"
              />
              <span className="text-sm text-muted-foreground">R</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => decrementReps("reps")}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={set.reps || ""}
              onChange={(e) => updateSet({ reps: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="w-16 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => incrementReps("reps")}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <span className="text-sm text-muted-foreground">reps</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", set.notes && "text-primary")}
          onClick={() => setShowNotes(!showNotes)}
          title="Add note"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>

      {showNotes && (
        <Input
          value={set.notes || ""}
          onChange={(e) => updateSet({ notes: e.target.value })}
          placeholder="Note for this set (e.g., 2 partials, felt easy)"
          className="text-sm"
        />
      )}
    </div>
  );
}
