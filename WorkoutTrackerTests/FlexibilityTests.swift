import Foundation
import SwiftData
import Testing
@testable import WorkoutTracker

@MainActor
struct FlexibilityTests {
    let container: ModelContainer
    var context: ModelContext { container.mainContext }
    let now = Date(timeIntervalSince1970: 1_800_000_000)

    init() throws {
        container = try AppSchema.makeContainer(inMemory: true)
        try Seeder.seed(context: container.mainContext, now: now)
    }

    func templates() throws -> [WorkoutTemplate] {
        try context.fetch(FetchDescriptor<WorkoutTemplate>(sortBy: [SortDescriptor(\.order)]))
    }

    func template(_ name: String) throws -> WorkoutTemplate {
        try #require(try templates().first { $0.name == name })
    }

    func names(_ week: RotationWeek) throws -> [String] {
        WeekOrder.members(of: week, in: try templates()).map(\.name)
    }

    func libraryNames() throws -> [String] {
        try context.fetch(FetchDescriptor<LibraryExercise>()).map(\.name)
    }

    func state() throws -> RotationState {
        let sessions = try context.fetch(FetchDescriptor<WorkoutSession>())
        let resets = try context.fetch(FetchDescriptor<RotationReset>())
        return RotationEngine(templates: try templates()).state(for: RotationEngine.events(sessions: sessions, resets: resets))
    }

    func finish(_ name: String, day: Int) throws {
        let session = SessionFactory.start(try template(name), at: now.addingTimeInterval(Double(day) * 86_400), context: context)
        SessionFactory.finish(session, at: session.startedAt.addingTimeInterval(3600))
    }

    func freshDefaults() throws -> UserDefaults {
        try #require(UserDefaults(suiteName: "test-\(UUID())"))
    }

    func upgrade(_ defaults: UserDefaults? = nil) throws {
        try Seeder.replacePancakeIfNeeded(context: context, defaults: defaults ?? freshDefaults(), now: now)
    }

    /// Makes the store look like an install from before the switch: Pancake in both weeks
    /// (as it was seeded), no Flexibility workouts, and a library built from that program.
    func makeOldInstall() throws {
        for name in ["Flexibility 1", "Flexibility 2"] { context.delete(try template(name)) }
        for entry in try context.fetch(FetchDescriptor<LibraryExercise>()) { context.delete(entry) }

        let pancake = WorkoutTemplate(name: "Pancake", order: 5, colorName: "yellow", inWeekA: true, inWeekB: true)
        context.insert(pancake)
        let rows: [(String, String, String, MeasureUnit)] = [
            ("Rolling the feet", "", "", .seconds), ("Calf Stretch", "3", "60", .seconds),
            ("Tailor’s Pose", "3-4", "8", .reps), ("Straddle J-Curl", "3-4", "5", .reps), ("Pancake Lifts", "2-3", "6", .reps),
        ]
        for (index, row) in rows.enumerated() {
            let exercise = ExerciseTemplate(name: row.0, order: index, setsText: row.1, plannedSets: 3,
                                            targetText: row.2, unit: row.3, restText: "60s")
            exercise.workout = pancake
            pancake.exercises.append(exercise)
        }
        try context.save()
        try ExerciseLibrary.linkUnlinked(context: context)
    }

    // MARK: Seed

    @Test func flexibilityMatchesNotion() throws {
        let one = try template("Flexibility 1")
        #expect(one.inWeekA && !one.inWeekB)
        #expect(one.colorName == "yellow" && one.order == 5)
        let a = one.sortedExercises
        #expect(a.map(\.name) == ["Single Leg Calf Stretch", "Tailor’s Pose",
                                  "Pike Compression Overcoming Isometric + Lifts", "Jefferson Curls"])
        #expect(a.map(\.groupLabel) == ["A1", "A2", "B1", "B2"])
        #expect(a.map(\.targetText) == ["60", "3-5", "5-8", "5"])
        #expect(a.map(\.unit) == [.seconds, .reps, .reps, .reps])
        #expect(a.map(\.perSide) == [true, false, false, false])

        let two = try template("Flexibility 2")
        #expect(!two.inWeekA && two.inWeekB)
        #expect(two.colorName == "teal" && two.order == 6)
        let b = two.sortedExercises
        #expect(b.map(\.name) == ["Single Leg Calf Stretch", "Tailor’s Pose",
                                  "Side Leg Lifts Isometric + Lifts", "Pancake Compressions"])
        #expect(b.map(\.targetText) == ["60", "3-5", "5-8", "5"])
        #expect(b.map(\.perSide) == [true, false, true, false])

        for exercise in a + b {
            #expect(exercise.setsText == "3" && exercise.plannedSets == 3)
            #expect(exercise.restText.isEmpty && exercise.tempo.isEmpty)
        }
        #expect(a[1].cue == "10s contractions")
        #expect(b[2].cue == "3-5 x 10s isometric, then 5-8 lifts")
    }

    @Test func sharedExercisesShareOneLibraryEntry() throws {
        let a = try template("Flexibility 1").sortedExercises
        let b = try template("Flexibility 2").sortedExercises
        #expect(a[0].libraryID != nil && a[0].libraryID == b[0].libraryID)
        #expect(a[1].libraryID != nil && a[1].libraryID == b[1].libraryID)
        #expect(try libraryNames().filter { $0 == "Tailor’s Pose" }.count == 1)
    }

    @Test func eachWeekNeedsItsOwnFlexibility() throws {
        for (day, name) in ["Push 1", "Pull 1", "Legs"].enumerated() { try finish(name, day: day) }
        try finish("Flexibility 2", day: 3) // off-week: doesn't count
        #expect(try state().week == .a)
        try finish("Flexibility 1", day: 4)
        #expect(try state().week == .b)

        for (day, name) in ["Push 2", "Pull 2", "Legs"].enumerated() { try finish(name, day: 5 + day) }
        #expect(try state().week == .b)
        try finish("Flexibility 2", day: 8)
        let state = try state()
        #expect(state.week == .a && state.weeksCompleted == 2)
    }

    // MARK: Upgrade from Pancake

    @Test func upgradeKeepsYourPlaceInTheRotation() throws {
        try makeOldInstall()
        for (day, name) in ["Push 1", "Pull 1", "Legs", "Pancake", "Push 2"].enumerated() { try finish(name, day: day) }
        let before = try state()
        #expect(before.week == .b && before.weeksCompleted == 1)

        try upgrade()

        let after = try state()
        #expect(after.week == .b)
        #expect(after.weeksCompleted == 1)
        #expect(after.completed == [try template("Push 2").id])
        let remaining = RotationEngine(templates: try templates()).remaining(in: after)
        #expect(remaining == [try template("Pull 2").id, try template("Legs").id, try template("Flexibility 2").id])
    }

    @Test func pancakeDoneThisWeekStillNeedsFlexibility() throws {
        try makeOldInstall()
        for (day, name) in ["Push 1", "Pull 1", "Legs", "Pancake", "Push 2", "Pancake"].enumerated() {
            try finish(name, day: day)
        }
        try upgrade()
        let state = try state()
        let push2 = try template("Push 2").id
        #expect(state.week == .b && state.completed == [push2])
    }

    @Test func upgradeDuringFirstWeekNeedsNoReset() throws {
        try makeOldInstall()
        try finish("Push 1", day: 0)
        try upgrade()
        #expect(try context.fetchCount(FetchDescriptor<RotationReset>()) == 0)
        let state = try state()
        #expect(state.week == .a)
        #expect(state.completed == [try template("Push 1").id])
    }

    @Test func upgradeTakesPancakesPlaceInEachWeek() throws {
        try makeOldInstall()
        // Week A: Pancake moved to the top. Week B: left in program order.
        WeekOrder.move(in: .a, templates: try templates(), from: [3], to: 0)
        #expect(try names(.a) == ["Pancake", "Push 1", "Pull 1", "Legs"])

        try upgrade()

        #expect(try names(.a) == ["Flexibility 1", "Push 1", "Pull 1", "Legs"])
        #expect(try names(.b) == ["Push 2", "Pull 2", "Legs", "Flexibility 2"])
        #expect(try templates().map(\.name) == ["Push 1", "Pull 1", "Push 2", "Pull 2", "Legs", "Flexibility 1", "Flexibility 2"])
    }

    @Test func upgradeDeletesPancakeAndItsLibraryExercises() throws {
        try makeOldInstall()
        try finish("Pancake", day: 0)
        let oldTailor = try #require(try template("Pancake").sortedExercises[2].libraryID)

        try upgrade()

        #expect(try templates().contains { $0.name == "Pancake" } == false)
        let library = try libraryNames()
        for name in ["Rolling the feet", "Calf Stretch", "Straddle J-Curl", "Pancake Lifts"] {
            #expect(!library.contains(name))
        }
        // Tailor's Pose is reused by Flexibility, so it keeps its entry (and its chart).
        #expect(library.filter { $0 == "Tailor’s Pose" }.count == 1)
        #expect(try template("Flexibility 1").sortedExercises[1].libraryID == oldTailor)
        #expect(try template("Flexibility 2").sortedExercises[1].libraryID == oldTailor)
        #expect(library.contains("Single Leg Calf Stretch") && library.contains("Jefferson Curls"))

        // Logged Pancake history stays.
        let sessions = try context.fetch(FetchDescriptor<WorkoutSession>())
        #expect(sessions.contains { $0.templateName == "Pancake" })

        // Relinking on the next launch doesn't bring the deleted entries back.
        try ExerciseLibrary.linkUnlinked(context: context)
        #expect(try libraryNames().contains("Pancake Lifts") == false)
    }

    @Test func upgradeKeepsLibraryExercisesUsedElsewhere() throws {
        try makeOldInstall()
        let calf = try #require(try context.fetch(FetchDescriptor<LibraryExercise>()).first { $0.name == "Calf Stretch" })
        ExerciseLibrary.add(calf, to: try template("Legs"))
        try context.save()

        try upgrade()

        #expect(try libraryNames().contains("Calf Stretch"))
        #expect(try libraryNames().contains("Pancake Lifts") == false)
    }

    @Test func upgradeRunsOnceAndRespectsDeletion() throws {
        try makeOldInstall()
        let defaults = try freshDefaults()
        try upgrade(defaults)
        try upgrade(defaults)
        #expect(try templates().filter { $0.name.hasPrefix("Flexibility") }.count == 2)

        // Deleted by the user afterwards: it stays deleted.
        context.delete(try template("Flexibility 1"))
        try context.save()
        try upgrade(defaults)
        #expect(try templates().contains { $0.name == "Flexibility 1" } == false)
    }

    @Test func freshInstallHasNoPancakeAndNoReset() throws {
        let fresh = try AppSchema.makeContainer(inMemory: true)
        let defaults = try freshDefaults()
        try Seeder.prepare(context: fresh.mainContext, defaults: defaults, now: now)
        #expect(defaults.bool(forKey: Seeder.didReplacePancakeKey))
        let names = try fresh.mainContext.fetch(FetchDescriptor<WorkoutTemplate>()).map(\.name)
        #expect(!names.contains("Pancake"))
        #expect(names.filter { $0.hasPrefix("Flexibility") }.count == 2)
        #expect(try fresh.mainContext.fetchCount(FetchDescriptor<RotationReset>()) == 0)
    }
}
