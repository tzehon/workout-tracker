"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

interface RestTimerProps {
  defaultSeconds: number;
  onComplete?: () => void;
  className?: string;
}

export function RestTimer({ defaultSeconds, onComplete, className }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const reset = useCallback(() => {
    setSeconds(defaultSeconds);
    setIsRunning(false);
    setIsComplete(false);
  }, [defaultSeconds]);

  const toggle = () => {
    setIsRunning(!isRunning);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            // Vibrate on completion
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  useEffect(() => {
    setSeconds(defaultSeconds);
  }, [defaultSeconds]);

  const progress = ((defaultSeconds - seconds) / defaultSeconds) * 100;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <svg className="absolute h-12 w-12 -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={125.6}
            strokeDashoffset={125.6 - (progress / 100) * 125.6}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000",
              isComplete ? "text-success" : "text-primary"
            )}
          />
        </svg>
        <Timer className={cn("h-5 w-5", isComplete ? "text-success" : "text-muted-foreground")} />
      </div>

      <div className="flex-1">
        <p
          className={cn(
            "text-lg font-mono font-bold",
            isComplete && "text-success"
          )}
        >
          {formatTime(seconds)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isComplete ? "Rest complete!" : isRunning ? "Resting..." : "Tap to start"}
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-9 w-9"
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          className="h-9 w-9"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
