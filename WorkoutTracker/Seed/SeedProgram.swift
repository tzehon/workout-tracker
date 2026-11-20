import Foundation
import SwiftData

/// The program as written in the Notion "Week 1" page (Training / Training), Nov 2026,
/// including the Pancake table.
/// `progression` holds the Notion "Progression" lines, oldest first; each line becomes an
/// imported past session.
enum SeedProgram {
    struct Exercise {
        var name: String
        var group: String = ""
        var sets: String
        var target: String
        var unit: MeasureUnit = .reps
        var perSide = false
        var rest: String
        var rings: String = ""
        var tempo: String = ""
        var cue: String = ""
        /// Set rows to start with when the sets text doesn't say (defaults to its lower bound).
        var plannedSets: Int? = nil
        var progression: [String] = []
    }

    struct Workout {
        var name: String
        var color: String
        var weekA: Bool
        var weekB: Bool
        var exercises: [Exercise]
    }

    static let workouts: [Workout] = [
        Workout(name: "Push 1", color: "blue", weekA: true, weekB: false, exercises: [
            Exercise(name: "Ring Dip (Elbows in)", sets: "3-4", target: "8-10", rest: "1:30", rings: "6", tempo: "30X1"),
            Exercise(name: "Archer Pushup (Alternating)", sets: "3-4", target: "6-9", perSide: true, rest: "1:30", rings: "6 and 6", tempo: "20X0"),
            Exercise(name: "Chest Fly", sets: "3", target: "8-12", rest: "1:30", rings: "6 and 6", tempo: "30X0"),
            Exercise(name: "Tricep Dip", sets: "3", target: "8-15", rest: "1:30", rings: "6 and 7.5", tempo: "30X0"),
            Exercise(name: "Tricep Extension", sets: "3-4", target: "8-12", rest: "1:30", rings: "6 and 6", tempo: "30X1"),
        ]),
        Workout(name: "Pull 1", color: "green", weekA: true, weekB: false, exercises: [
            Exercise(name: "Pullup", sets: "3-4", target: "6-12", rest: "2:00-3:00", rings: "0.5", tempo: "30X0"),
            Exercise(name: "Archer Bodyweight Row", sets: "3-4", target: "6-8", perSide: true, rest: "1:30", rings: "7.5 neutral", tempo: "20X0"),
            Exercise(name: "Pelican Curl", sets: "3", target: "6-10", rest: "1:30", tempo: "30X0"),
            Exercise(name: "Rear Delt Fly", sets: "3", target: "8-12", rest: "1:30", tempo: "30X0"),
            Exercise(name: "Ring Rollout", sets: "3", target: "10-12", rest: "1:30", tempo: "40X0"),
        ]),
        Workout(name: "Push 2", color: "purple", weekA: false, weekB: true, exercises: [
            Exercise(name: "Ring Dip (Bulgarian)", sets: "3-4", target: "5-8", rest: "1:30", rings: "6", tempo: "30X1",
                     progression: ["9,8,8", "9,8,8"]),
            Exercise(name: "Shoulder Pushup", sets: "3-4", target: "6-10", rest: "1:30", rings: "6 and 9.5, 76cm", tempo: "40X1",
                     progression: ["6,6,6", "6,6,6"]),
            Exercise(name: "Bulgarian Pushup", sets: "3-4", target: "8-10", rest: "1:30", rings: "6 and 9.5", tempo: "30X1",
                     progression: ["8,8,6", "6,6,3"]),
            Exercise(name: "Shoulder Tap", sets: "3-4", target: "30-45", unit: .seconds, rest: "1:30",
                     progression: ["12s,12s,12s", "12s,12s,12s"]),
            Exercise(name: "Tricep Dip", sets: "3-4", target: "6-10", rest: "1:30", rings: "6 and 7.5", tempo: "20X0",
                     progression: ["10,10,8", "10,8,6"]),
        ]),
        Workout(name: "Pull 2", color: "orange", weekA: false, weekB: true, exercises: [
            Exercise(name: "Chinup", sets: "4-6", target: "6-8", rest: "2:00-3:00", tempo: "30X0"),
            Exercise(name: "Single Arm Row", sets: "3-4", target: "4-8", perSide: true, rest: "1:30", rings: "7.5", tempo: "30X0"),
            Exercise(name: "Face Pull", sets: "3-4", target: "8-12", rest: "1:30", rings: "7.5", tempo: "20X0"),
            Exercise(name: "Bodyweight Bicep Curl", sets: "3-4", target: "8-12", rest: "1:30", tempo: "30X1"),
            Exercise(name: "Two Arm Hang", sets: "Self directed", target: "2:00-4:00 accumulated", unit: .seconds, rest: ""),
        ]),
        Workout(name: "Legs", color: "red", weekA: true, weekB: true, exercises: [
            Exercise(name: "Pistol Squat - Hand Assist", group: "A1", sets: "3-5", target: "8-20", perSide: true, rest: "2:00",
                     tempo: "40X0", cue: "Same hand as extended leg", progression: ["9,9,9"]),
            Exercise(name: "Glute Ham Raise - Hybrid", group: "B1", sets: "3-4", target: "5-10", rest: "1:30 after B2",
                     tempo: "30X0", progression: ["9,9,9"]),
            Exercise(name: "Kneeling Quad Extension - Hand Assist", group: "B2", sets: "3-4", target: "8-25", rest: "1:30 after B2",
                     tempo: "1 Br @ B", progression: ["9,9,9"]),
            Exercise(name: "Wall Squat", group: "C1", sets: "3-4", target: "30-90", unit: .seconds, rest: "1:00-1:30",
                     progression: ["35s,35s,35s"]),
            Exercise(name: "Calf Raise - Single Leg", group: "D1", sets: "3-4", target: "8-30", perSide: true, rest: "1:00-1:30",
                     tempo: "21X1", progression: ["12,12,13"]),
            Exercise(name: "Bent Leg Calf Raise", group: "E1", sets: "3-4", target: "12-40", rest: "1:00-1:30",
                     tempo: "21X1", progression: ["15,15,15"]),
        ]),
        // Added to Notion Nov 2026. Every week, and it counts toward finishing the week.
        Workout(name: "Pancake", color: "yellow", weekA: true, weekB: true, exercises: [
            Exercise(name: "Rolling the feet", group: "A1", sets: "", target: "", unit: .seconds, rest: "100s",
                     tempo: "2320", plannedSets: 1),
            Exercise(name: "Calf Stretch", group: "A2", sets: "3", target: "60", unit: .seconds, rest: "100s",
                     tempo: "2320", cue: "Forward 60s, turned out 60s, turned in 60s"),
            Exercise(name: "Tailor’s Pose", group: "B1", sets: "3-4", target: "8", rest: "60s", tempo: "2310"),
            Exercise(name: "Straddle J-Curl", group: "C1", sets: "3-4", target: "5", rest: "90s", tempo: "6240"),
            Exercise(name: "Pancake Lifts", group: "D1", sets: "2-3", target: "6", rest: "60s", tempo: "1013"),
        ]),
    ]

    static var pancake: Workout { workouts.first { $0.name == "Pancake" }! }
}

/// Parses a Notion progression line like "9,8,8" or "12s,12s,12s" into per-set values.
enum ProgressionParser {
    static func parse(_ line: String) -> [Int] {
        line.split(separator: ",").compactMap { part in
            let digits = part.trimmingCharacters(in: .whitespaces).filter(\.isNumber)
            return Int(digits)
        }
    }

    /// Default number of set rows: the lower bound of a range like "3-4" (falls back to 3).
    static func plannedSets(from setsText: String) -> Int {
        let first = setsText.split(whereSeparator: { !$0.isNumber }).first.flatMap { Int($0) }
        return first ?? 3
    }
}

enum Seeder {
    static let didSeedKey = "didSeedProgram.v1"
    /// Set once Pancake has been added (by the first seed, or by the upgrade for older installs).
    static let didAddPancakeKey = "didAddPancake.v1"

    /// Everything the store needs at launch: first-time seed and upgrades for older installs.
    /// Safe to run on every launch.
    static func prepare(context: ModelContext, defaults: UserDefaults = .standard, now: Date = .now) throws {
        try seedIfNeeded(context: context, defaults: defaults, now: now)
        try addPancakeIfNeeded(context: context, defaults: defaults, now: now)
    }

    /// Seeds the program on first launch only, so deleting workouts later doesn't bring them back.
    static func seedIfNeeded(context: ModelContext, defaults: UserDefaults = .standard, now: Date = .now) throws {
        guard !defaults.bool(forKey: didSeedKey) else { return }
        let existing = try context.fetchCount(FetchDescriptor<WorkoutTemplate>())
        if existing == 0 {
            try seed(context: context, now: now)
            // A fresh seed already includes Pancake.
            defaults.set(true, forKey: didAddPancakeKey)
        }
        defaults.set(true, forKey: didSeedKey)
    }

    /// Inserts the Notion program and recreates its Progression column as imported sessions.
    /// Imported session k of n is dated (n - k) weeks before `now` so charts read oldest → newest.
    static func seed(context: ModelContext, now: Date = .now) throws {
        for (index, workout) in SeedProgram.workouts.enumerated() {
            insert(workout, order: index, context: context, now: now)
        }
        try context.save()
    }

    /// Adds Pancake to installs seeded before it existed. Runs once; if Pancake was deleted
    /// later it stays deleted.
    ///
    /// The rotation is replayed from history with today's week membership, so adding a workout
    /// to both weeks would leave every past week unfinished and jump you back. To keep your
    /// place, a reset is recorded just after the current week started, carrying the week count.
    static func addPancakeIfNeeded(context: ModelContext, defaults: UserDefaults = .standard, now: Date = .now) throws {
        guard !defaults.bool(forKey: didAddPancakeKey) else { return }
        let templates = try context.fetch(FetchDescriptor<WorkoutTemplate>())
        if !templates.contains(where: { $0.name == SeedProgram.pancake.name }) {
            let sessions = try context.fetch(FetchDescriptor<WorkoutSession>())
            let resets = try context.fetch(FetchDescriptor<RotationReset>())
            let before = RotationEngine(templates: templates)
                .state(for: RotationEngine.events(sessions: sessions, resets: resets))

            insert(SeedProgram.pancake, order: (templates.map(\.order).max() ?? -1) + 1, context: context, now: now)

            if let started = before.weekStartedAt {
                context.insert(RotationReset(date: started.addingTimeInterval(0.001), week: before.week,
                                             weeksCompleted: before.weeksCompleted))
            }
            try context.save()
        }
        defaults.set(true, forKey: didAddPancakeKey)
    }

    private static func insert(_ workout: SeedProgram.Workout, order: Int, context: ModelContext, now: Date) {
        let calendar = Calendar.current
        let template = WorkoutTemplate(
            name: workout.name, order: order, colorName: workout.color,
            inWeekA: workout.weekA, inWeekB: workout.weekB
        )
        context.insert(template)

        var exercisePairs: [(SeedProgram.Exercise, ExerciseTemplate)] = []
        for (index, seed) in workout.exercises.enumerated() {
            let exercise = ExerciseTemplate(
                name: seed.name, order: index, groupLabel: seed.group, setsText: seed.sets,
                plannedSets: seed.plannedSets ?? ProgressionParser.plannedSets(from: seed.sets), targetText: seed.target,
                unit: seed.unit, perSide: seed.perSide, restText: seed.rest, ringSetting: seed.rings,
                tempo: seed.tempo, cue: seed.cue
            )
            exercise.workout = template
            template.exercises.append(exercise)
            exercisePairs.append((seed, exercise))
        }

        let sessionCount = workout.exercises.map(\.progression.count).max() ?? 0
        for sessionIndex in 0..<sessionCount {
            let weeksAgo = sessionCount - sessionIndex
            let date = calendar.date(byAdding: .day, value: -7 * weeksAgo, to: now) ?? now
            let session = WorkoutSession(
                templateID: template.id, templateName: template.name, colorName: template.colorName,
                startedAt: date, isImported: true
            )
            session.finishedAt = date
            session.note = "Imported from Notion progression"
            context.insert(session)

            for (seed, exercise) in exercisePairs where sessionIndex < seed.progression.count {
                let values = ProgressionParser.parse(seed.progression[sessionIndex])
                let logged = SessionExercise(snapshotOf: exercise)
                logged.session = session
                session.exercises.append(logged)
                for (setIndex, value) in values.enumerated() {
                    let entry = SetEntry(order: setIndex, value: value)
                    entry.exercise = logged
                    logged.sets.append(entry)
                }
            }
        }
    }
}
