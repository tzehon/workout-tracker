# AGENTS.md

Guidance for coding agents working in this repo. Human-facing docs: [README.md](README.md),
[docs/setup.md](docs/setup.md), [docs/architecture.md](docs/architecture.md).

## What this is

A personal iOS app (SwiftUI + SwiftData, iOS 18+, Swift 6) for a rings program that
alternates **Week A** (Push 1 / Pull 1 / Legs) and **Week B** (Push 2 / Pull 2 / Legs).
The program and its past numbers come from the Notion page "Training / Week 1" and are
hard-coded in `WorkoutTracker/Seed/SeedProgram.swift`. No dependencies and no network.

## Commands

```bash
make project       # regenerate WorkoutTracker.xcodeproj from project.yml (do this after adding/removing files)
make build         # simulator build
make unit-test     # Swift Testing suites, fast (~1s once built)
make ui-test       # XCUITest flows (~35s)
make test          # everything — must pass before every commit
make screenshots   # PNGs of the main screens → build/screenshots/ (useful to eyeball UI changes)
make icons         # redraw the light/dark/tinted app icons from scripts/make-icon.swift
```

- Default destination: `iPhone 17 Pro`, iOS 26.5. Override with `SIM="iPhone 17"`, or edit `DEST` in the Makefile.
- `WorkoutTracker.xcodeproj` is **generated and gitignored**. Never edit it. Change `project.yml` instead.
- `-quiet` hides passing output, so with `make test` an exit code of 0 is the pass signal.

## Layout

| Path | Contents |
|------|----------|
| `WorkoutTracker/Models/Models.swift` | All SwiftData `@Model` types + `AppSchema` |
| `WorkoutTracker/Logic/RotationEngine.swift` | Pure A/B week rotation (no SwiftData fetches) |
| `WorkoutTracker/Logic/SessionLogic.swift` | `SessionFactory`, `PerformanceLookup`, `ProgressSeries`, `Format` |
| `WorkoutTracker/Seed/SeedProgram.swift` | Notion program data, `ProgressionParser`, `Seeder` |
| `WorkoutTracker/Views/` | One file per screen + `Theme.swift` shared bits |
| `WorkoutTrackerTests/` | Swift Testing (`@Test`, `#expect`) |
| `WorkoutTrackerUITests/` | XCTest UI tests |

## Rules that are easy to break

- **Rotation is derived, never stored.** The current week is computed with
  `RotationEngine.state(for:)` over finished sessions and `RotationReset` rows every time. Don't
  add a "current week" field. Imported (`isImported`) and unfinished sessions are not rotation events.
- **The rotation is sequence-based, not calendar-based.** That was the user's explicit choice. A
  week ends only when all of its workouts are finished, in any order. Off-week and repeat
  workouts are logged but don't count.
- **Sessions snapshot their exercises.** `SessionExercise` copies name and prescription from
  `ExerciseTemplate` at start. Program edits must never change logged history. The links back
  (`templateID`, `exerciseTemplateID`) are soft UUIDs, not relationships.
- **Prescriptions are strings** (`setsText`, `targetText`, `restText`) so Notion cells like
  `"Self directed"` or `"1:30 after B2"` fit. Only `plannedSets` is numeric.
- **`SetEntry.value == nil` means not logged.** Use `loggedValues` and never treat nil as 0.
- **Seeding runs once**, guarded by the `UserDefaults` key `didSeedProgram.v1`. Changing
  `SeedProgram` doesn't affect existing installs. Adding a model field needs a default value
  (SwiftData lightweight migration) and must not wipe the store.
- **Deleting a model shown on screen:** delete it in `.onDisappear` after `dismiss()` (see
  `SessionView`), or SwiftData can crash reading the deleted object.
- **Number entry uses a `String` binding proxy** (`SetRow.text`) so each keystroke saves. A
  `TextField(value:format:)` only commits on return, so values typed before "Finish" were lost.

## Swift / concurrency

- App and unit-test targets use `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`, so no `@MainActor`
  annotations are needed there.
- The UI-test target is `nonisolated` (XCTestCase's initialisers clash with MainActor default).
  Mark UI test methods `@MainActor`.
- Unit tests that touch SwiftData create `AppSchema.makeContainer(inMemory: true)` and seed with
  `Seeder.seed(context:now:)` using a fixed `now`.

## Appearance

- The app follows the system light/dark setting. Use semantic colours (`.primary`, `.secondary`,
  `Color(.tertiarySystemFill)`, `Theme.color(_:)`) and never hard-coded black or white.
  Check both modes with `xcrun simctl ui booted appearance dark|light`.
- App icons are generated, not hand-edited. Change `scripts/make-icon.swift`, then run `make icons`.
  The light icon must stay opaque; the dark and tinted icons have transparent backgrounds.

## Testing expectations

- Add or update tests with every behaviour change, and run `make test` before committing.
- Logic changes go in `Logic/` with unit tests. Keep views thin.
- New UI flows get an XCUITest. Add `accessibilityIdentifier`s rather than matching on text.
  Existing ids: `workoutRow-<name>`, `nextWeekRow-<name>`, `startWorkout`, `finishWorkout`,
  `setField-<exerciseOrder>-<setIndex>`, `weekProgress`.
- UI tests launch with `-UITestReset`, which gives an in-memory, freshly seeded store.

## Commits & docs

- Small, logically separate commits using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Update `docs/architecture.md` (Mermaid diagrams) and `docs/setup.md` when structure, data model or setup changes.
- Mermaid gotcha: no `;` inside sequence-diagram messages. It ends the statement.

## Open assumptions

- Notion progression lines were imported oldest-first, dated one week apart before first
  launch. Not confirmed by the user.
- The user explicitly declined a rest timer for v1.
