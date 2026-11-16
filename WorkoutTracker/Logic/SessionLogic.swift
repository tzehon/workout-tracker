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
    /// preferring the same template exercise and falling back to the same name.
    static func last(
        exerciseTemplateID: UUID?,
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

enum ProgressSeries {
    /// All exercise names that have at least one logged set, alphabetically.
    static func exerciseNames(in sessions: [WorkoutSession]) -> [String] {
        var seen: [String: String] = [:]
        for session in sessions where session.isFinished {
            for exercise in session.exercises where !exercise.loggedValues.isEmpty {
                seen[PerformanceLookup.key(for: exercise.name)] = seen[PerformanceLookup.key(for: exercise.name)] ?? exercise.name
            }
        }
        return seen.values.sorted { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
    }

    /// One point per finished session containing the exercise, oldest first.
    static func points(forExerciseNamed name: String, in sessions: [WorkoutSession]) -> [ProgressPoint] {
        let target = PerformanceLookup.key(for: name)
        return sessions
            .filter(\.isFinished)
            .sorted { $0.startedAt < $1.startedAt }
            .compactMap { session in
                guard let exercise = session.exercises.first(where: { PerformanceLookup.key(for: $0.name) == target }) else { return nil }
                let values = exercise.loggedValues
                guard let best = values.max() else { return nil }
                return ProgressPoint(date: session.startedAt, best: best, total: values.reduce(0, +),
                                     sets: values, isImported: session.isImported)
            }
    }

    static func unit(forExerciseNamed name: String, in sessions: [WorkoutSession]) -> MeasureUnit {
        let target = PerformanceLookup.key(for: name)
        for session in sessions {
            if let match = session.exercises.first(where: { PerformanceLookup.key(for: $0.name) == target }) {
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
    static func prescription(sets: String, target: String, unit: MeasureUnit, perSide: Bool) -> String {
        var line = sets.isEmpty ? target : "\(sets) × \(target)"
        if unit == .seconds, target.allSatisfy({ $0.isNumber || $0 == "-" }) { line += "s" }
        if perSide { line += " L&R" }
        return line
    }
}
