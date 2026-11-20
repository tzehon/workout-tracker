import Foundation
import SwiftData

enum SessionFactory {
    /// Starts a new session for `template`, snapshotting each exercise with empty set rows.
    @discardableResult
    static func start(_ template: WorkoutTemplate, at date: Date = .now, context: ModelContext) -> WorkoutSession {
        let session = WorkoutSession(
            templateID: template.id, templateName: template.name,
            colorName: template.colorName, startedAt: date
        )
        context.insert(session)
        for exercise in template.sortedExercises {
            let logged = SessionExercise(snapshotOf: exercise)
            logged.session = session
            session.exercises.append(logged)
            for index in 0..<max(1, exercise.plannedSets) {
                addSet(to: logged, order: index)
            }
        }
        return session
    }

    static func addSet(to exercise: SessionExercise, order: Int? = nil) {
        let entry = SetEntry(order: order ?? ((exercise.sets.map(\.order).max() ?? -1) + 1))
        entry.exercise = exercise
        exercise.sets.append(entry)
    }

    /// Removes the last set row (keeps at least one).
    static func removeLastSet(from exercise: SessionExercise, context: ModelContext) {
        guard exercise.sets.count > 1, let last = exercise.sortedSets.last else { return }
        exercise.sets.removeAll { $0.id == last.id }
        context.delete(last)
    }

    /// Adds a library exercise to the end of this session only (the program is unchanged).
    @discardableResult
    static func addExercise(_ entry: LibraryExercise, to session: WorkoutSession) -> SessionExercise {
        let logged = SessionExercise(library: entry, order: (session.exercises.map(\.order).max() ?? -1) + 1)
        logged.session = session
        session.exercises.append(logged)
        for index in 0..<max(1, entry.plannedSets) {
            addSet(to: logged, order: index)
        }
        return logged
    }

    /// Replaces `exercise` with a library exercise in the same slot, for this session only.
    /// Its set rows (and anything logged in them) are replaced with the new exercise's rows.
    static func swap(_ exercise: SessionExercise, with entry: LibraryExercise, context: ModelContext) {
        exercise.apply(entry)
        for set in exercise.sets { context.delete(set) }
        exercise.sets.removeAll()
        for index in 0..<max(1, entry.plannedSets) {
            addSet(to: exercise, order: index)
        }
    }

    /// Removes an exercise (and its sets) from this session only.
    static func removeExercise(_ exercise: SessionExercise, from session: WorkoutSession, context: ModelContext) {
        session.exercises.removeAll { $0.id == exercise.id }
        context.delete(exercise)
    }

    static func finish(_ session: WorkoutSession, at date: Date = .now) {
        session.finishedAt = date
    }
}

/// A past performance of an exercise, used for the "Last time" hint.
struct PastPerformance: Equatable {
    var date: Date
    var values: [Int]
    var unit: MeasureUnit
    var ringSetting: String
}

enum PerformanceLookup {
    /// Normalised key so "Tricep Dip" in Push 1 and Push 2 share a progress chart.
    static func key(for name: String) -> String {
        name.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Most recent finished performance of an exercise (with at least one logged set),
    /// preferring the same program slot, then the same library exercise, then the same name.
    static func last(
        exerciseTemplateID: UUID?,
        libraryID: UUID? = nil,
        name: String,
        in sessions: [WorkoutSession],
        excluding excludedSessionID: UUID? = nil
    ) -> PastPerformance? {
        let candidates = sessions
            .filter { $0.isFinished && $0.id != excludedSessionID }
            .sorted { $0.startedAt > $1.startedAt }

        func find(_ matches: (SessionExercise) -> Bool) -> PastPerformance? {
            for session in candidates {
                if let match = session.exercises.first(where: { matches($0) && !$0.loggedValues.isEmpty }) {
                    return PastPerformance(date: session.startedAt, values: match.loggedValues,
                                           unit: match.unit, ringSetting: match.ringSetting)
                }
            }
            return nil
        }

        if let id = exerciseTemplateID, let byID = find({ $0.exerciseTemplateID == id }) {
            return byID
        }
        if let id = libraryID, let byLibrary = find({ $0.libraryID == id }) {
            return byLibrary
        }
        let target = key(for: name)
        return find { key(for: $0.name) == target }
    }
}

struct ProgressPoint: Identifiable, Equatable {
    var id: Date { date }
    var date: Date
    var best: Int
    var total: Int
    var sets: [Int]
    var isImported: Bool
}

/// One exercise's chart in the Progress tab. Keyed by library exercise, so renames and
/// swaps keep one history; exercises without a library link fall back to their name.
struct ExerciseSeries: Hashable, Identifiable {
    var key: String
    var name: String
    var id: String { key }
}

enum ProgressSeries {
    static func key(for exercise: SessionExercise) -> String {
        exercise.libraryID.map { "lib:\($0.uuidString)" } ?? "name:\(PerformanceLookup.key(for: exercise.name))"
    }

    /// Every exercise with at least one logged set, alphabetically, named as most recently logged.
    static func series(in sessions: [WorkoutSession]) -> [ExerciseSeries] {
        var latest: [String: (date: Date, name: String)] = [:]
        for session in sessions where session.isFinished {
            for exercise in session.exercises where !exercise.loggedValues.isEmpty {
                let key = key(for: exercise)
                if let seen = latest[key], seen.date > session.startedAt { continue }
                latest[key] = (session.startedAt, exercise.name)
            }
        }
        return latest
            .map { ExerciseSeries(key: $0.key, name: $0.value.name) }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    /// One point per finished session containing the exercise, oldest first.
    static func points(for key: String, in sessions: [WorkoutSession]) -> [ProgressPoint] {
        sessions
            .filter(\.isFinished)
            .sorted { $0.startedAt < $1.startedAt }
            .compactMap { session in
                guard let exercise = session.exercises.first(where: { Self.key(for: $0) == key }) else { return nil }
                let values = exercise.loggedValues
                guard let best = values.max() else { return nil }
                return ProgressPoint(date: session.startedAt, best: best, total: values.reduce(0, +),
                                     sets: values, isImported: session.isImported)
            }
    }

    static func unit(for key: String, in sessions: [WorkoutSession]) -> MeasureUnit {
        for session in sessions.sorted(by: { $0.startedAt > $1.startedAt }) {
            if let match = session.exercises.first(where: { Self.key(for: $0) == key }) {
                return match.unit
            }
        }
        return .reps
    }
}

enum Format {
    /// "9, 8, 8" for reps or "35s, 35s" for seconds.
    static func values(_ values: [Int], unit: MeasureUnit) -> String {
        values.map { "\($0)\(unit.shortSuffix)" }.joined(separator: ", ")
    }

    /// "3-4 × 8-10 L&R" style prescription line.
    /// Empty when neither sets nor target is written (e.g. "Rolling the feet").
    static func prescription(sets: String, target: String, unit: MeasureUnit, perSide: Bool) -> String {
        guard !sets.isEmpty || !target.isEmpty else { return perSide ? "L&R" : "" }
        var line = target.isEmpty ? "\(sets) sets" : (sets.isEmpty ? target : "\(sets) × \(target)")
        if unit == .seconds, !target.isEmpty, target.allSatisfy({ $0.isNumber || $0 == "-" }) { line += "s" }
        if perSide { line += " L&R" }
        return line
    }
}
