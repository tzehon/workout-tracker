import Foundation
import SwiftData

/// What a set's logged number means.
enum MeasureUnit: String, Codable, CaseIterable, Identifiable {
    case reps
    case seconds

    var id: String { rawValue }
    var label: String { self == .reps ? "Reps" : "Seconds" }
    var shortSuffix: String { self == .reps ? "" : "s" }
}

// MARK: - Program (editable templates)

/// A workout in the program, e.g. "Push 1". Belongs to Week A, Week B, or both (Legs).
@Model
final class WorkoutTemplate {
    var id: UUID = UUID()
    var name: String = ""
    var order: Int = 0
    var colorName: String = "blue"
    var inWeekA: Bool = false
    var inWeekB: Bool = false
    @Relationship(deleteRule: .cascade, inverse: \ExerciseTemplate.workout)
    var exercises: [ExerciseTemplate] = []

    init(name: String, order: Int, colorName: String, inWeekA: Bool, inWeekB: Bool) {
        self.id = UUID()
        self.name = name
        self.order = order
        self.colorName = colorName
        self.inWeekA = inWeekA
        self.inWeekB = inWeekB
    }

    var sortedExercises: [ExerciseTemplate] { exercises.sorted { $0.order < $1.order } }

    func isIn(_ week: RotationWeek) -> Bool { week == .a ? inWeekA : inWeekB }
}

/// One exercise prescription inside a workout, mirroring a row of the Notion table.
@Model
final class ExerciseTemplate {
    var id: UUID = UUID()
    var name: String = ""
    var order: Int = 0
    /// Superset / ordering label such as "A1" or "B2". Empty when unused.
    var groupLabel: String = ""
    /// Prescribed sets as written, e.g. "3-4" or "Self directed".
    var setsText: String = ""
    /// How many set rows a new session starts with (more can be added while logging).
    var plannedSets: Int = 3
    /// Prescribed reps/seconds as written, e.g. "8-10".
    var targetText: String = ""
    var unitRaw: String = MeasureUnit.reps.rawValue
    /// True for unilateral work logged per side ("L&R").
    var perSide: Bool = false
    var restText: String = ""
    var ringSetting: String = ""
    var tempo: String = ""
    /// Extra coaching cue, e.g. "Same hand as extended leg".
    var cue: String = ""
    /// Soft link to the `LibraryExercise` this slot uses. Name, unit and per-side come from it.
    var libraryID: UUID?
    var workout: WorkoutTemplate?

    init(
        name: String,
        order: Int,
        groupLabel: String = "",
        setsText: String,
        plannedSets: Int,
        targetText: String,
        unit: MeasureUnit = .reps,
        perSide: Bool = false,
        restText: String,
        ringSetting: String = "",
        tempo: String = "",
        cue: String = ""
    ) {
        self.id = UUID()
        self.name = name
        self.order = order
        self.groupLabel = groupLabel
        self.setsText = setsText
        self.plannedSets = plannedSets
        self.targetText = targetText
        self.unitRaw = unit.rawValue
        self.perSide = perSide
        self.restText = restText
        self.ringSetting = ringSetting
        self.tempo = tempo
        self.cue = cue
    }

    var unit: MeasureUnit {
        get { MeasureUnit(rawValue: unitRaw) ?? .reps }
        set { unitRaw = newValue.rawValue }
    }

    /// Makes this slot use `library`, taking its name and its default prescription.
    /// The group label and position stay.
    func apply(_ library: LibraryExercise) {
        libraryID = library.id
        name = library.name
        unitRaw = library.unitRaw
        perSide = library.perSide
        cue = library.cue
        setsText = library.setsText
        plannedSets = library.plannedSets
        targetText = library.targetText
        restText = library.restText
        tempo = library.tempo
        ringSetting = library.ringSetting
    }
}

// MARK: - Exercise library

/// One exercise in the library. Program slots and session exercises point at it by `libraryID`.
/// The prescription fields are defaults, copied when the exercise is added to a workout or session.
@Model
final class LibraryExercise {
    var id: UUID = UUID()
    var name: String = ""
    var unitRaw: String = MeasureUnit.reps.rawValue
    var perSide: Bool = false
    var cue: String = ""
    var notes: String = ""
    var setsText: String = "3"
    var plannedSets: Int = 3
    var targetText: String = "8-12"
    var restText: String = "1:30"
    var tempo: String = ""
    var ringSetting: String = ""
    var createdAt: Date = Date()

    init(name: String, unit: MeasureUnit = .reps, perSide: Bool = false) {
        self.id = UUID()
        self.name = name
        self.unitRaw = unit.rawValue
        self.perSide = perSide
        self.createdAt = .now
    }

    /// A library entry whose defaults are taken from an existing program exercise.
    convenience init(copying template: ExerciseTemplate) {
        self.init(name: template.name, unit: template.unit, perSide: template.perSide)
        cue = template.cue
        setsText = template.setsText
        plannedSets = template.plannedSets
        targetText = template.targetText
        restText = template.restText
        tempo = template.tempo
        ringSetting = template.ringSetting
    }

    /// A library entry for an exercise that only exists in logged history.
    convenience init(copying logged: SessionExercise) {
        self.init(name: logged.name, unit: logged.unit, perSide: logged.perSide)
        cue = logged.cue
        setsText = logged.setsText
        plannedSets = ProgressionParser.plannedSets(from: logged.setsText)
        targetText = logged.targetText
        restText = logged.restText
        tempo = logged.tempo
        ringSetting = logged.ringSetting
    }

    var unit: MeasureUnit {
        get { MeasureUnit(rawValue: unitRaw) ?? .reps }
        set { unitRaw = newValue.rawValue }
    }
}

// MARK: - Logged sessions

/// A performed (or in-progress) workout. Exercise details are snapshotted from the template
/// so later program edits never rewrite history.
@Model
final class WorkoutSession {
    var id: UUID = UUID()
    var templateID: UUID?
    var templateName: String = ""
    var colorName: String = "blue"
    var startedAt: Date = Date()
    var finishedAt: Date?
    /// Sessions recreated from the Notion "Progression" column. Shown in history and charts,
    /// but never counted toward the weekly rotation.
    var isImported: Bool = false
    var note: String = ""
    @Relationship(deleteRule: .cascade, inverse: \SessionExercise.session)
    var exercises: [SessionExercise] = []

    init(templateID: UUID?, templateName: String, colorName: String, startedAt: Date, isImported: Bool = false) {
        self.id = UUID()
        self.templateID = templateID
        self.templateName = templateName
        self.colorName = colorName
        self.startedAt = startedAt
        self.isImported = isImported
    }

    var isFinished: Bool { finishedAt != nil }
    var sortedExercises: [SessionExercise] { exercises.sorted { $0.order < $1.order } }
}

@Model
final class SessionExercise {
    var id: UUID = UUID()
    var exerciseTemplateID: UUID?
    /// Soft link to the library exercise, so history and charts follow renames and swaps.
    var libraryID: UUID?
    var name: String = ""
    var order: Int = 0
    var groupLabel: String = ""
    var setsText: String = ""
    var targetText: String = ""
    var unitRaw: String = MeasureUnit.reps.rawValue
    var perSide: Bool = false
    var restText: String = ""
    var tempo: String = ""
    var cue: String = ""
    var ringSetting: String = ""
    var note: String = ""
    @Relationship(deleteRule: .cascade, inverse: \SetEntry.exercise)
    var sets: [SetEntry] = []
    var session: WorkoutSession?

    init(snapshotOf template: ExerciseTemplate) {
        self.id = UUID()
        self.exerciseTemplateID = template.id
        self.libraryID = template.libraryID
        self.name = template.name
        self.order = template.order
        self.groupLabel = template.groupLabel
        self.setsText = template.setsText
        self.targetText = template.targetText
        self.unitRaw = template.unitRaw
        self.perSide = template.perSide
        self.restText = template.restText
        self.tempo = template.tempo
        self.cue = template.cue
        self.ringSetting = template.ringSetting
    }

    /// A session-only exercise taken straight from the library (added or swapped in mid-workout).
    init(library: LibraryExercise, order: Int) {
        self.id = UUID()
        self.order = order
        apply(library)
    }

    /// Replaces what this exercise is with `library`, keeping its slot (order and group label).
    /// The link to the program exercise is dropped: it's no longer the same exercise.
    func apply(_ library: LibraryExercise) {
        exerciseTemplateID = nil
        libraryID = library.id
        name = library.name
        setsText = library.setsText
        targetText = library.targetText
        unitRaw = library.unitRaw
        perSide = library.perSide
        restText = library.restText
        tempo = library.tempo
        cue = library.cue
        ringSetting = library.ringSetting
    }

    var unit: MeasureUnit { MeasureUnit(rawValue: unitRaw) ?? .reps }
    var sortedSets: [SetEntry] { sets.sorted { $0.order < $1.order } }
    /// Logged values in set order, skipping empty sets.
    var loggedValues: [Int] { sortedSets.compactMap(\.value) }
}

@Model
final class SetEntry {
    var id: UUID = UUID()
    var order: Int = 0
    /// Reps (or seconds) achieved. `nil` means not logged yet.
    var value: Int?
    var exercise: SessionExercise?

    init(order: Int, value: Int? = nil) {
        self.id = UUID()
        self.order = order
        self.value = value
    }
}

/// A manual override of the rotation ("switch to Week B", "restart Week A").
@Model
final class RotationReset {
    var id: UUID = UUID()
    var date: Date = Date()
    var weekRaw: Int = 0
    /// When set, the "weeks completed" count restarts from this number instead of carrying on.
    /// Used when an upgrade re-anchors the rotation so the count isn't lost.
    var weeksCompleted: Int?

    init(date: Date, week: RotationWeek, weeksCompleted: Int? = nil) {
        self.id = UUID()
        self.date = date
        self.weekRaw = week.rawValue
        self.weeksCompleted = weeksCompleted
    }

    var week: RotationWeek { RotationWeek(rawValue: weekRaw) ?? .a }
}

enum AppSchema {
    static let models: [any PersistentModel.Type] = [
        WorkoutTemplate.self, ExerciseTemplate.self, LibraryExercise.self,
        WorkoutSession.self, SessionExercise.self, SetEntry.self,
        RotationReset.self,
    ]

    static func makeContainer(inMemory: Bool = false) throws -> ModelContainer {
        let schema = Schema(models)
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: inMemory)
        return try ModelContainer(for: schema, configurations: [config])
    }
}
