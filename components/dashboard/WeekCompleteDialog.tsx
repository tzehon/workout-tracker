"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { programPhases } from "@/lib/program-data";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";

interface WeekCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhase: 1 | 2 | 3;
  currentWeek: 1 | 2 | 3 | 4 | 5 | 6;
  onAdvance: (newPhase: 1 | 2 | 3, newWeek: 1 | 2 | 3 | 4 | 5 | 6) => Promise<void>;
}

type CompletionType = "week" | "phase" | "program";

function getCompletionType(phase: number, week: number): CompletionType {
  if (phase === 3 && week === 6) return "program";
  if (week === 6) return "phase";
  return "week";
}

export function WeekCompleteDialog({
  open,
  onOpenChange,
  currentPhase,
  currentWeek,
  onAdvance,
}: WeekCompleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const completionType = getCompletionType(currentPhase, currentWeek);
  const phaseData = programPhases.find((p) => p.phase === currentPhase);
  const nextPhaseData = programPhases.find((p) => p.phase === currentPhase + 1);

  const handleAdvance = async (newPhase: 1 | 2 | 3, newWeek: 1 | 2 | 3 | 4 | 5 | 6) => {
    setLoading(true);
    try {
      await onAdvance(newPhase, newWeek);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  // Week completion (Week 1-5)
  if (completionType === "week") {
    const nextWeek = (currentWeek + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Week {currentWeek} Complete!
            </DialogTitle>
            <DialogDescription>
              Great work finishing all 4 sessions this week. Ready to move on?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Not yet
            </Button>
            <Button onClick={() => handleAdvance(currentPhase, nextWeek)} disabled={loading}>
              {loading ? "Updating..." : (
                <>
                  Move to Week {nextWeek}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Phase completion (Week 6 / Deload)
  if (completionType === "phase") {
    const nextPhase = (currentPhase + 1) as 1 | 2 | 3;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Phase {currentPhase}: {phaseData?.name} Complete!
            </DialogTitle>
            <DialogDescription>
              Congratulations on finishing the deload week! What would you like to do next?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handleAdvance(currentPhase, 1)}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Repeat Phase {currentPhase}
            </Button>
            <Button onClick={() => handleAdvance(nextPhase, 1)} disabled={loading}>
              {loading ? "Updating..." : (
                <>
                  Start Phase {nextPhase}: {nextPhaseData?.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Program completion (Phase 3 Week 6)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Program Complete!
          </DialogTitle>
          <DialogDescription>
            Congratulations! You&apos;ve completed the entire 18-week program.
            That&apos;s an incredible achievement!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          <Button onClick={() => handleAdvance(1, 1)} disabled={loading}>
            {loading ? "Updating..." : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over from Phase 1
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
