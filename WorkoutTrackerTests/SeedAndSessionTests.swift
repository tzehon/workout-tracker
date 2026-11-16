import Foundation
import SwiftData
import Testing
@testable import WorkoutTracker

@MainActor
struct SeedAndSessionTests {
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

    func sessions() throws -> [WorkoutSession] { try context.fetch(FetchDescriptor<WorkoutSession>()) }

    func template(_ name: String) throws -> WorkoutTemplate {
        try #require(try templates().first { $0.name == name })
    }

    // MARK: Parsing

    @Test func parsesProgressionLines() {
        #expect(ProgressionParser.parse("9,8,8") == [9, 8, 8])
        #expect(ProgressionParser.parse("12s,12s,12s") == [12, 12, 12])
        #expect(ProgressionParser.parse(" 10, 8 ,6") == [10, 8, 6])
        #expect(ProgressionParser.parse("") == [])
    }

    @Test func plannedSetsUsesLowerBound() {
        #expect(ProgressionParser.plannedSets(from: "3-4") == 3)
        #expect(ProgressionParser.plannedSets(from: "4-6") == 4)
        #expect(ProgressionParser.plannedSets(from: "3") == 3)
        #expect(ProgressionParser.plannedSets(from: "Self directed") == 3)
    }

    // MARK: Seed

    @Test func seedsAllFiveWorkoutsFromNotion() throws {
        let all = try templates()
        #expect(all.map(\.name) == ["Push 1", "Pull 1", "Push 2", "Pull 2", "Legs"])
        #expect(all.map(\.exercises.count) == [5, 5, 5, 5, 6])
    }

    @Test func weekMembershipMatchesRequestedRotation() throws {
        let all = try templates()
        #expect(all.filter(\.inWeekA).map(\.name) == ["Push 1", "Pull 1", "Legs"])
        #expect(all.filter(\.inWeekB).map(\.name) == ["Push 2", "Pull 2", "Legs"])
    }

    @Test func seededExerciseDetailsMatchNotion() throws {
        let dip = try #require(try template("Push 2").sortedExercises.first)
        #expect(dip.name == "Ring Dip (Bulgarian)")
        #expect(dip.setsText == "3-4")
        #expect(dip.targetText == "5-8")
        #expect(dip.tempo == "30X1")
        #expect(dip.ringSetting == "6")

        let legs = try template("Legs").sortedExercises
        #expect(legs.map(\.groupLabel) == ["A1", "B1", "B2", "C1", "D1", "E1"])
        #expect(legs[0].perSide)
        #expect(legs[3].unit == .seconds)
    }

    @Test func importsProgressionAsPastSessionsOldestFirst() throws {
        let push2 = try template("Push 2")
        let imported = try sessions()
            .filter { $0.templateID == push2.id }
            .sorted { $0.startedAt < $1.startedAt }
        #expect(imported.count == 2)
        #expect(imported.allSatisfy { $0.isImported && $0.isFinished })
        #expect(imported.allSatisfy { $0.startedAt < now })

        func values(_ s: WorkoutSession, _ name: String) -> [Int]? {
            s.exercises.first { $0.name == name }?.loggedValues
        }
        #expect(values(imported[0], "Bulgarian Pushup") == [8, 8, 6])
        #expect(values(imported[1], "Bulgarian Pushup") == [6, 6, 3])
        #expect(values(imported[1], "Shoulder Tap") == [12, 12, 12])

        let legsSessions = try sessions().filter { $0.templateName == "Legs" }
        #expect(legsSessions.count == 1)
        #expect(values(legsSessions[0], "Wall Squat") == [35, 35, 35])
    }

    @Test func workoutsWithoutProgressionHaveNoImportedSessions() throws {
        let names = Set(try sessions().map(\.templateName))
        #expect(names == ["Push 2", "Legs"])
    }

    @Test func seedIfNeededRunsOnce() throws {
        let fresh = try AppSchema.makeContainer(inMemory: true)
        let defaults = try #require(UserDefaults(suiteName: "test-\(UUID())"))
        try Seeder.seedIfNeeded(context: fresh.mainContext, defaults: defaults)
        try Seeder.seedIfNeeded(context: fresh.mainContext, defaults: defaults)
        #expect(try fresh.mainContext.fetchCount(FetchDescriptor<WorkoutTemplate>()) == 5)
    }

    @Test func importedSessionsDoNotMoveRotation() throws {
        let engine = RotationEngine(templates: try templates())
        let events = RotationEngine.events(sessions: try sessions(), resets: [])
        #expect(events.isEmpty)
        #expect(engine.state(for: events).week == .a)
    }

    // MARK: Sessions

    @Test func startingSessionSnapshotsTemplate() throws {
        let push1 = try template("Push 1")
        let session = SessionFactory.start(push1, at: now, context: context)
        #expect(session.templateID == push1.id)
        #expect(!session.isFinished)
        #expect(session.sortedExercises.map(\.name) == push1.sortedExercises.map(\.name))
        // "3-4" sets → 3 rows, "3" → 3 rows.
        #expect(session.sortedExercises.map(\.sets.count) == [3, 3, 3, 3, 3])

        push1.sortedExercises[0].name = "Renamed"
        #expect(session.sortedExercises[0].name == "Ring Dip (Elbows in)")
    }

    @Test func addAndRemoveSets() throws {
        let session = SessionFactory.start(try template("Pull 2"), at: now, context: context)
        let chinup = session.sortedExercises[0]
        #expect(chinup.sets.count == 4)
        SessionFactory.addSet(to: chinup)
        #expect(chinup.sortedSets.map(\.order) == [0, 1, 2, 3, 4])
        SessionFactory.removeLastSet(from: chinup, context: context)
        #expect(chinup.sets.count == 4)
        for _ in 0..<10 { SessionFactory.removeLastSet(from: chinup, context: context) }
        #expect(chinup.sets.count == 1)
    }

    @Test func finishedSessionCountsTowardRotation() throws {
        let all = try templates()
        let engine = RotationEngine(templates: all)
        for name in ["Push 1", "Legs", "Pull 1"] {
            let session = SessionFactory.start(try template(name), at: now, context: context)
            SessionFactory.finish(session, at: now.addingTimeInterval(Double(name.count) * 60))
        }
        // An unfinished session doesn't count.
        SessionFactory.start(try template("Push 2"), at: now, context: context)

        let state = engine.state(for: RotationEngine.events(sessions: try sessions(), resets: []))
        #expect(state.week == .b)
        #expect(engine.nextUp(in: state) == (try template("Push 2")).id)
    }

    // MARK: Last performance & progress

    @Test func lastPerformancePrefersSameTemplateExercise() throws {
        let push2 = try template("Push 2")
        let dipID = try #require(push2.sortedExercises.first { $0.name == "Tricep Dip" }).id
        let last = try #require(PerformanceLookup.last(exerciseTemplateID: dipID, name: "Tricep Dip", in: try sessions()))
        #expect(last.values == [10, 8, 6])
    }

    @Test func lastPerformanceFallsBackToName() throws {
        // Push 1's Tricep Dip has never been logged, so it borrows Push 2's latest.
        let push1Dip = try #require(try template("Push 1").sortedExercises.first { $0.name == "Tricep Dip" })
        let last = PerformanceLookup.last(exerciseTemplateID: push1Dip.id, name: push1Dip.name, in: try sessions())
        #expect(last?.values == [10, 8, 6])
    }

    @Test func lastPerformanceIgnoresEmptyAndCurrentSession() throws {
        let push2 = try template("Push 2")
        let session = SessionFactory.start(push2, at: now, context: context)
        SessionFactory.finish(session, at: now) // finished but nothing logged
        let dip = push2.sortedExercises[0]
        let last = PerformanceLookup.last(exerciseTemplateID: dip.id, name: dip.name, in: try sessions(), excluding: session.id)
        #expect(last?.values == [9, 8, 8])
    }

    @Test func lastPerformanceUsesNewestSession() throws {
        let push2 = try template("Push 2")
        let session = SessionFactory.start(push2, at: now, context: context)
        session.sortedExercises[0].sortedSets[0].value = 11
        SessionFactory.finish(session, at: now)
        let dip = push2.sortedExercises[0]
        let last = PerformanceLookup.last(exerciseTemplateID: dip.id, name: dip.name, in: try sessions())
        #expect(last?.values == [11])
    }

    @Test func progressSeriesMergesSameNamedExercises() throws {
        let push1 = SessionFactory.start(try template("Push 1"), at: now, context: context)
        let dip = try #require(push1.exercises.first { $0.name == "Tricep Dip" })
        dip.sortedSets[0].value = 12
        dip.sortedSets[1].value = 11
        SessionFactory.finish(push1, at: now)

        let points = ProgressSeries.points(forExerciseNamed: "tricep dip", in: try sessions())
        #expect(points.map(\.best) == [10, 10, 12])
        #expect(points.map(\.total) == [28, 24, 23])
        #expect(points.map(\.isImported) == [true, true, false])
        #expect(ProgressSeries.exerciseNames(in: try sessions()).contains("Tricep Dip"))
    }

    @Test func formatting() {
        #expect(Format.values([9, 8, 8], unit: .reps) == "9, 8, 8")
        #expect(Format.values([35, 35], unit: .seconds) == "35s, 35s")
        #expect(Format.prescription(sets: "3-4", target: "6-9", unit: .reps, perSide: true) == "3-4 × 6-9 L&R")
        #expect(Format.prescription(sets: "3-4", target: "30-90", unit: .seconds, perSide: false) == "3-4 × 30-90s")
    }
}

struct PluralTests {
    @Test func pluralises() {
        #expect(plural(1, "exercise") == "1 exercise")
        #expect(plural(0, "set") == "0 sets")
        #expect(plural(5, "set") == "5 sets")
    }
}

struct AppearanceTests {
    @Test func systemDoesNotOverride() {
        #expect(AppAppearance.system.colorScheme == nil)
        #expect(AppAppearance.light.colorScheme == .light)
        #expect(AppAppearance.dark.colorScheme == .dark)
    }

    @Test func storedValuesAreStable() {
        // Raw values are persisted in UserDefaults; renaming them would reset users' choice.
        #expect(AppAppearance.allCases.map(\.rawValue) == ["system", "light", "dark"])
        #expect(AppAppearance(rawValue: "dark") == .dark)
    }
}
