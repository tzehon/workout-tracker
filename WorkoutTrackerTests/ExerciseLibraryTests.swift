import Foundation
import SwiftData
import Testing
@testable import WorkoutTracker

@MainActor
struct ExerciseLibraryTests {
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

    func library() throws -> [LibraryExercise] { try context.fetch(FetchDescriptor<LibraryExercise>()) }
    func sessions() throws -> [WorkoutSession] { try context.fetch(FetchDescriptor<WorkoutSession>()) }

    func entry(_ name: String) throws -> LibraryExercise {
        try #require(try library().first { $0.name == name })
    }

    // MARK: Building the library

    @Test func everyExerciseIsLinkedOncePerName() throws {
        let slots = try templates().flatMap(\.exercises)
        #expect(slots.allSatisfy { $0.libraryID != nil })
        #expect(try sessions().flatMap(\.exercises).allSatisfy { $0.libraryID != nil })

        let uniqueNames = Set(slots.map { PerformanceLookup.key(for: $0.name) })
        #expect(try library().count == uniqueNames.count)

        // Tricep Dip is in Push 1 and Push 2: one library entry.
        let dips = slots.filter { $0.name == "Tricep Dip" }
        #expect(dips.count == 2)
        #expect(Set(dips.map(\.libraryID)).count == 1)
    }

    @Test func linkingIsIdempotent() throws {
        let count = try library().count
        try ExerciseLibrary.linkUnlinked(context: context)
        try ExerciseLibrary.linkUnlinked(context: context)
        #expect(try library().count == count)
    }

    @Test func libraryDefaultsComeFromFirstProgramSlot() throws {
        let dip = try entry("Tricep Dip")
        // Push 1 comes before Push 2 in the program.
        #expect(dip.setsText == "3")
        #expect(dip.targetText == "8-15")
        #expect(try entry("Wall Squat").unit == .seconds)
        #expect(try entry("Archer Pushup (Alternating)").perSide)
    }

    @Test func olderStoreGetsLinkedOnLaunch() throws {
        // Simulate a store from before the library: no entries, no links.
        for entry in try library() { context.delete(entry) }
        for slot in try templates().flatMap(\.exercises) { slot.libraryID = nil }
        for logged in try sessions().flatMap(\.exercises) { logged.libraryID = nil }
        try context.save()

        try ExerciseLibrary.linkUnlinked(context: context)
        #expect(try templates().flatMap(\.exercises).allSatisfy { $0.libraryID != nil })
        #expect(try sessions().flatMap(\.exercises).allSatisfy { $0.libraryID != nil })
    }

    @Test func createReusesExistingNameIgnoringCase() throws {
        let count = try library().count
        let existing = try ExerciseLibrary.create(named: "  tricep dip ", context: context)
        #expect(existing.id == (try entry("Tricep Dip")).id)
        let new = try ExerciseLibrary.create(named: "Front Lever", context: context)
        #expect(new.name == "Front Lever")
        #expect(try library().count == count + 1)
    }

    @Test func workoutsUsingAnExercise() throws {
        let names = ExerciseLibrary.workouts(using: try entry("Tricep Dip"), in: try templates()).map(\.name)
        #expect(names == ["Push 1", "Push 2"])
    }

    // MARK: Program

    @Test func addingToProgramUsesLibraryDefaults() throws {
        let legs = try template("Legs")
        let added = ExerciseLibrary.add(try entry("Pullup"), to: legs)
        #expect(legs.sortedExercises.last?.id == added.id)
        #expect(added.libraryID == (try entry("Pullup")).id)
        #expect(added.setsText == "3-4" && added.targetText == "6-12" && added.ringSetting == "0.5")
    }

    @Test func changingProgramExerciseKeepsGroupLabel() throws {
        let slot = try #require(try template("Legs").sortedExercises.first)
        slot.apply(try entry("Wall Squat"))
        #expect(slot.name == "Wall Squat")
        #expect(slot.groupLabel == "A1")
        #expect(slot.unit == .seconds)
    }

    @Test func renameFlowsToProgramButNotHistory() throws {
        let dip = try entry("Tricep Dip")
        dip.name = "Ring Tricep Dip"
        ExerciseLibrary.sync(dip, to: try templates().flatMap(\.exercises))

        let slots = try templates().flatMap(\.exercises).filter { $0.libraryID == dip.id }
        #expect(slots.count == 2 && slots.allSatisfy { $0.name == "Ring Tricep Dip" })

        // Imported Push 2 sessions keep the old name but chart under the same exercise.
        let logged = try sessions().flatMap(\.exercises).filter { $0.libraryID == dip.id }
        #expect(!logged.isEmpty && logged.allSatisfy { $0.name == "Tricep Dip" })
        let series = ProgressSeries.series(in: try sessions()).filter { $0.key == "lib:\(dip.id.uuidString)" }
        #expect(series.count == 1)
        #expect(ProgressSeries.points(for: series[0].key, in: try sessions()).count == 2)
    }

    // MARK: Session editing

    @Test func addExerciseToSessionOnly() throws {
        let push1 = try template("Push 1")
        let session = SessionFactory.start(push1, at: now, context: context)
        let added = SessionFactory.addExercise(try entry("Single Leg Calf Stretch"), to: session)

        #expect(session.sortedExercises.last?.id == added.id)
        #expect(added.sets.count == 3)
        #expect(added.unit == .seconds)
        #expect(added.exerciseTemplateID == nil)
        #expect(added.libraryID == (try entry("Single Leg Calf Stretch")).id)
        #expect(push1.exercises.count == 5)
    }

    @Test func swapReplacesExerciseInPlace() throws {
        let push1 = try template("Push 1")
        let session = SessionFactory.start(push1, at: now, context: context)
        let first = session.sortedExercises[0]
        first.sortedSets[0].value = 9

        SessionFactory.swap(first, with: try entry("Bulgarian Pushup"), context: context)

        #expect(session.sortedExercises[0].id == first.id)
        #expect(first.name == "Bulgarian Pushup")
        #expect(first.targetText == "8-10")
        #expect(first.exerciseTemplateID == nil)
        #expect(first.sets.count == 3)
        #expect(first.loggedValues.isEmpty)
        // The program is untouched.
        #expect(push1.sortedExercises[0].name == "Ring Dip (Elbows in)")

        // "Last time" follows the library exercise's history (Push 2's imported sessions).
        let last = PerformanceLookup.last(exerciseTemplateID: first.exerciseTemplateID, libraryID: first.libraryID,
                                          name: first.name, in: try sessions(), excluding: session.id)
        #expect(last?.values == [6, 6, 3])
    }

    @Test func swappedExerciseChartsWithItsLibraryHistory() throws {
        let session = SessionFactory.start(try template("Push 1"), at: now, context: context)
        let first = session.sortedExercises[0]
        SessionFactory.swap(first, with: try entry("Bulgarian Pushup"), context: context)
        first.sortedSets[0].value = 7
        SessionFactory.finish(session, at: now)

        let key = "lib:\((try entry("Bulgarian Pushup")).id.uuidString)"
        #expect(ProgressSeries.points(for: key, in: try sessions()).map(\.best) == [8, 6, 7])
    }

    @Test func removeExerciseFromSessionOnly() throws {
        let push1 = try template("Push 1")
        let session = SessionFactory.start(push1, at: now, context: context)
        let chestFly = try #require(session.exercises.first { $0.name == "Chest Fly" })
        SessionFactory.removeExercise(chestFly, from: session, context: context)
        try context.save()

        #expect(session.exercises.count == 4)
        #expect(!session.exercises.contains { $0.name == "Chest Fly" })
        #expect(push1.exercises.count == 5)
    }
}
