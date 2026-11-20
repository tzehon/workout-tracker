import Foundation
import SwiftData

/// The exercise library: one `LibraryExercise` per distinct exercise. Program slots
/// (`ExerciseTemplate`) and logged exercises (`SessionExercise`) point at it with a soft
/// `libraryID`, so the same exercise in two workouts shares its history.
enum ExerciseLibrary {
    /// Links every program and logged exercise that has no `libraryID` yet, matching by name
    /// (case-insensitive) and creating a library entry when there's no match.
    /// Program exercises are visited in program order, so the first slot using an exercise
    /// sets its library defaults. Idempotent; runs on every launch.
    static func linkUnlinked(context: ModelContext) throws {
        var byName: [String: LibraryExercise] = [:]
        for entry in try context.fetch(FetchDescriptor<LibraryExercise>()) {
            byName[PerformanceLookup.key(for: entry.name)] = byName[PerformanceLookup.key(for: entry.name)] ?? entry
        }

        func entry(named name: String, orMake make: () -> LibraryExercise) -> LibraryExercise {
            let key = PerformanceLookup.key(for: name)
            if let existing = byName[key] { return existing }
            let created = make()
            context.insert(created)
            byName[key] = created
            return created
        }

        let workouts = try context.fetch(FetchDescriptor<WorkoutTemplate>(sortBy: [SortDescriptor(\.order)]))
        for workout in workouts {
            for exercise in workout.sortedExercises where exercise.libraryID == nil {
                exercise.libraryID = entry(named: exercise.name) { LibraryExercise(copying: exercise) }.id
            }
        }

        let sessions = try context.fetch(FetchDescriptor<WorkoutSession>(sortBy: [SortDescriptor(\.startedAt)]))
        for session in sessions {
            for logged in session.exercises where logged.libraryID == nil {
                logged.libraryID = entry(named: logged.name) { LibraryExercise(copying: logged) }.id
            }
        }
        if context.hasChanges { try context.save() }
    }

    /// Creates a library exercise, or returns the existing one with the same name.
    static func create(named rawName: String, context: ModelContext) throws -> LibraryExercise {
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        let key = PerformanceLookup.key(for: name)
        if let existing = try context.fetch(FetchDescriptor<LibraryExercise>())
            .first(where: { PerformanceLookup.key(for: $0.name) == key }) {
            return existing
        }
        let entry = LibraryExercise(name: name)
        context.insert(entry)
        return entry
    }

    /// Program workouts that use `entry`, in program order.
    static func workouts(using entry: LibraryExercise, in workouts: [WorkoutTemplate]) -> [WorkoutTemplate] {
        workouts
            .sorted { $0.order < $1.order }
            .filter { $0.exercises.contains { $0.libraryID == entry.id } }
    }

    /// Pushes the library's name, unit and per-side onto program slots that use it, so a rename
    /// shows everywhere in the program. Logged sessions keep their snapshot.
    static func sync(_ entry: LibraryExercise, to templates: [ExerciseTemplate]) {
        for template in templates where template.libraryID == entry.id {
            if template.name != entry.name { template.name = entry.name }
            if template.unitRaw != entry.unitRaw { template.unitRaw = entry.unitRaw }
            if template.perSide != entry.perSide { template.perSide = entry.perSide }
        }
    }

    /// Adds `entry` to the end of a program workout, using its default prescription.
    @discardableResult
    static func add(_ entry: LibraryExercise, to workout: WorkoutTemplate) -> ExerciseTemplate {
        let exercise = ExerciseTemplate(
            name: entry.name, order: (workout.exercises.map(\.order).max() ?? -1) + 1,
            setsText: entry.setsText, plannedSets: entry.plannedSets, targetText: entry.targetText,
            restText: entry.restText
        )
        exercise.apply(entry)
        exercise.workout = workout
        workout.exercises.append(exercise)
        return exercise
    }
}
