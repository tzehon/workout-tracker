# Workout Tracker

A personal iOS app for a gymnastic-rings program that alternates two weeks:

| Week | Workouts |
|------|----------|
| **A** | Push 1 · Pull 1 · Legs |
| **B** | Push 2 · Pull 2 · Legs |

…then repeats. The program comes from the Notion page **Training / Week 1**.

## Features

- **Today**: shows which week you're on, what's done, and what's up next. A week only ends
  once all three of its workouts are finished, in any order, so a busy week never puts you out of step.
- **Logging**: reps or seconds per set, with last session's numbers as placeholders and a
  "Use last" button. You can add or remove sets, change ring height, and write notes per exercise and per workout.
- **History**: finished workouts by month. Tap one to edit it; swipe to delete.
- **Progress**: a chart of best set or total for each exercise. Exercises with the same name
  (e.g. *Tricep Dip* in Push 1 and Push 2) share a chart.
- **Program**: edit workouts, which week each belongs to, and their exercises (sets, reps,
  rest, tempo, rings, cue, superset label). Edits apply to future workouts only.
- **Imported history**: the Notion *Progression* column is loaded as past sessions, marked
  "Imported". They appear in History and charts but don't count toward the rotation.

## Quick start

```bash
brew install xcodegen
make test          # generate project, run unit + UI tests
open WorkoutTracker.xcodeproj
```

See [docs/setup.md](docs/setup.md) for running on your iPhone, and
[docs/architecture.md](docs/architecture.md) for how it works.
