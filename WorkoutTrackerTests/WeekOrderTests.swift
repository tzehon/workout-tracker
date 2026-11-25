import Foundation
import SwiftData
import Testing
@testable import WorkoutTracker

@MainActor
struct WeekOrderTests {
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

    func names(_ week: RotationWeek) throws -> [String] {
        WeekOrder.members(of: week, in: try templates()).map(\.name)
    }

    func state() throws -> RotationState {
        let sessions = try context.fetch(FetchDescriptor<WorkoutSession>())
        let resets = try context.fetch(FetchDescriptor<RotationReset>())
        return RotationEngine(templates: try templates()).state(for: RotationEngine.events(sessions: sessions, resets: resets))
    }

    func finish(_ name: String, day: Int) throws {
        let template = try #require(try templates().first { $0.name == name })
        let session = SessionFactory.start(template, at: now.addingTimeInterval(Double(day) * 86_400), context: context)
        SessionFactory.finish(session, at: session.startedAt.addingTimeInterval(3600))
    }

    @Test func defaultsToProgramOrder() throws {
        #expect(try names(.a) == ["Push 1", "Pull 1", "Legs", "Pancake"])
        #expect(try names(.b) == ["Push 2", "Pull 2", "Legs", "Pancake"])
    }

    @Test func moveReordersOnlyThatWeek() throws {
        // Legs (index 2) to just after Push 1.
        WeekOrder.move(in: .a, templates: try templates(), from: [2], to: 1)
        #expect(try names(.a) == ["Push 1", "Legs", "Pull 1", "Pancake"])
        #expect(try names(.b) == ["Push 2", "Pull 2", "Legs", "Pancake"])

        // Week B can put the shared workouts somewhere else entirely.
        WeekOrder.move(in: .b, templates: try templates(), from: [3], to: 0)
        #expect(try names(.b) == ["Pancake", "Push 2", "Pull 2", "Legs"])
        #expect(try names(.a) == ["Push 1", "Legs", "Pull 1", "Pancake"])
    }

    @Test func orderIsSaved() throws {
        WeekOrder.move(in: .a, templates: try templates(), from: [2], to: 1)
        try context.save()
        let fresh = ModelContext(container)
        let reloaded = try fresh.fetch(FetchDescriptor<WorkoutTemplate>())
        #expect(WeekOrder.members(of: .a, in: reloaded).map(\.name) == ["Push 1", "Legs", "Pull 1", "Pancake"])
    }

    @Test func upNextFollowsTheWeekOrder() throws {
        WeekOrder.move(in: .a, templates: try templates(), from: [2], to: 1)
        let engine = RotationEngine(templates: try templates())
        try finish("Push 1", day: 0)
        let next = try #require(engine.nextUp(in: try state()))
        #expect(try templates().first { $0.id == next }?.name == "Legs")
    }

    @Test func reorderingDoesNotChangeTheRotation() throws {
        try finish("Push 1", day: 0)
        try finish("Legs", day: 1)
        let before = try state()

        WeekOrder.move(in: .a, templates: try templates(), from: [3], to: 0)
        WeekOrder.move(in: .b, templates: try templates(), from: [0], to: 4)
        #expect(try state() == before)
    }

    @Test func workoutAddedToAReorderedWeekGoesLast() throws {
        WeekOrder.move(in: .a, templates: try templates(), from: [2], to: 1)
        let extra = WorkoutTemplate(name: "Handstands", order: -1, colorName: "teal", inWeekA: true, inWeekB: false)
        context.insert(extra)
        #expect(try names(.a) == ["Push 1", "Legs", "Pull 1", "Pancake", "Handstands"])
    }
}
