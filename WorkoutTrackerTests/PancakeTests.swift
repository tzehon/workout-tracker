import Foundation
import SwiftData
import Testing
@testable import WorkoutTracker

@MainActor
struct PancakeTests {
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

    func state() throws -> RotationState {
        let sessions = try context.fetch(FetchDescriptor<WorkoutSession>())
        let resets = try context.fetch(FetchDescriptor<RotationReset>())
        return RotationEngine(templates: try templates()).state(for: RotationEngine.events(sessions: sessions, resets: resets))
    }

    func finish(_ name: String, day: Int) throws {
        let session = SessionFactory.start(try template(name), at: now.addingTimeInterval(Double(day) * 86_400), context: context)
        SessionFactory.finish(session, at: session.startedAt.addingTimeInterval(3600))
    }

    /// Makes the store look like an install from before Pancake existed.
    func removePancake() throws {
        context.delete(try template("Pancake"))
        try context.save()
    }

    func freshDefaults() throws -> UserDefaults {
        try #require(UserDefaults(suiteName: "test-\(UUID())"))
    }

    @Test func pancakeMatchesNotion() throws {
        let pancake = try template("Pancake")
        #expect(pancake.inWeekA && pancake.inWeekB)
        #expect(pancake.colorName == "yellow")
        #expect(pancake.order == 5)

        let exercises = pancake.sortedExercises
        #expect(exercises.map(\.name) == ["Rolling the feet", "Calf Stretch", "Tailor’s Pose", "Straddle J-Curl", "Pancake Lifts"])
        #expect(exercises.map(\.groupLabel) == ["A1", "A2", "B1", "C1", "D1"])
        #expect(exercises.map(\.tempo) == ["2320", "2320", "2310", "6240", "1013"])
        #expect(exercises.map(\.restText) == ["100s", "100s", "60s", "90s", "60s"])
        #expect(exercises.map(\.plannedSets) == [1, 3, 3, 3, 2])
        #expect(exercises[0].unit == .seconds && exercises[1].unit == .seconds)
        #expect(exercises[1].targetText == "60")
        #expect(exercises[4].setsText == "2-3" && exercises[4].targetText == "6")
    }

    @Test func weekNeedsPancakeToFinish() throws {
        for (day, name) in ["Push 1", "Pull 1", "Legs"].enumerated() { try finish(name, day: day) }
        #expect(try state().week == .a)
        try finish("Pancake", day: 3)
        #expect(try state().week == .b)
    }

    @Test func upgradeKeepsYourPlaceInTheRotation() throws {
        try removePancake()
        // Old install: Week A finished with three workouts, then Push 2 done in Week B.
        for (day, name) in ["Push 1", "Pull 1", "Legs", "Push 2"].enumerated() { try finish(name, day: day) }
        let before = try state()
        #expect(before.week == .b && before.weeksCompleted == 1)

        try Seeder.addPancakeIfNeeded(context: context, defaults: try freshDefaults(), now: now)

        let after = try state()
        #expect(after.week == .b)
        #expect(after.weeksCompleted == 1)
        #expect(after.completed == [try template("Push 2").id])
        let remaining = RotationEngine(templates: try templates()).remaining(in: after)
        #expect(remaining == [try template("Pull 2").id, try template("Legs").id, try template("Pancake").id])
    }

    @Test func upgradeDuringFirstWeekNeedsNoReset() throws {
        try removePancake()
        try finish("Push 1", day: 0)
        try Seeder.addPancakeIfNeeded(context: context, defaults: try freshDefaults(), now: now)
        #expect(try context.fetchCount(FetchDescriptor<RotationReset>()) == 0)
        let state = try state()
        #expect(state.week == .a)
        #expect(state.completed == [try template("Push 1").id])
    }

    @Test func upgradeRunsOnceAndRespectsDeletion() throws {
        try removePancake()
        let defaults = try freshDefaults()
        try Seeder.addPancakeIfNeeded(context: context, defaults: defaults, now: now)
        try Seeder.addPancakeIfNeeded(context: context, defaults: defaults, now: now)
        #expect(try templates().filter { $0.name == "Pancake" }.count == 1)

        // Deleted by the user afterwards: it stays deleted.
        try removePancake()
        try Seeder.addPancakeIfNeeded(context: context, defaults: defaults, now: now)
        #expect(try templates().contains { $0.name == "Pancake" } == false)
    }

    @Test func freshInstallDoesNotAddPancakeTwice() throws {
        let fresh = try AppSchema.makeContainer(inMemory: true)
        try Seeder.prepare(context: fresh.mainContext, defaults: try freshDefaults(), now: now)
        let names = try fresh.mainContext.fetch(FetchDescriptor<WorkoutTemplate>()).map(\.name)
        #expect(names.filter { $0 == "Pancake" }.count == 1)
        #expect(try fresh.mainContext.fetchCount(FetchDescriptor<RotationReset>()) == 0)
    }
}
