import Foundation

/// The two alternating weeks: A = Push 1 / Pull 1 / Legs, B = Push 2 / Pull 2 / Legs.
enum RotationWeek: Int, Codable, CaseIterable, Identifiable, Sendable {
    case a = 0
    case b = 1

    var id: Int { rawValue }
    var next: RotationWeek { self == .a ? .b : .a }
    var title: String { self == .a ? "Week A" : "Week B" }
}

/// Something that moves the rotation: a finished workout, or a manual reset.
struct RotationEvent: Equatable, Sendable {
    enum Kind: Equatable, Sendable {
        case completed(templateID: UUID)
        /// `weeksCompleted`, when set, replaces the running count of finished weeks.
        case reset(to: RotationWeek, weeksCompleted: Int? = nil)
    }

    var date: Date
    var kind: Kind
}

struct RotationState: Equatable, Sendable {
    var week: RotationWeek = .a
    /// Templates of the current week already done.
    var completed: Set<UUID> = []
    /// How many full weeks have been finished since the start (or last reset).
    var weeksCompleted: Int = 0
    /// When the current week began: the event that finished the previous week, or the last
    /// reset. `nil` while still in the very first week.
    var weekStartedAt: Date?
}

/// Sequence-based rotation: a week only ends once every workout in it has been finished,
/// so a late or missed week never puts you out of step. Workouts can be done in any order.
///
/// Rules (applied to events in date order):
/// - Finishing a workout that belongs to the current week and isn't done yet marks it done.
/// - When every workout of the current week is done, the next week starts empty.
/// - Finishing a workout that isn't in the current week (or repeating one) is logged
///   but doesn't move the rotation.
/// - A reset jumps straight to the given week with nothing done.
struct RotationEngine: Sendable {
    var weekA: [UUID]
    var weekB: [UUID]

    func members(of week: RotationWeek) -> [UUID] { week == .a ? weekA : weekB }

    func state(for events: [RotationEvent]) -> RotationState {
        var state = RotationState()
        for event in events.sorted(by: { $0.date < $1.date }) {
            switch event.kind {
            case .reset(let week, let weeksCompleted):
                state = RotationState(week: week, completed: [], weeksCompleted: weeksCompleted ?? state.weeksCompleted,
                                      weekStartedAt: event.date)
            case .completed(let id):
                let members = members(of: state.week)
                guard members.contains(id), !state.completed.contains(id) else { continue }
                state.completed.insert(id)
                if Set(members).isSubset(of: state.completed) {
                    state.week = state.week.next
                    state.completed = []
                    state.weeksCompleted += 1
                    state.weekStartedAt = event.date
                }
            }
        }
        return state
    }

    /// Workouts still to do this week, in the week's order.
    func remaining(in state: RotationState) -> [UUID] {
        members(of: state.week).filter { !state.completed.contains($0) }
    }

    /// The suggested next workout: the first one not yet done this week.
    func nextUp(in state: RotationState) -> UUID? { remaining(in: state).first }
}

extension RotationEngine {
    /// Builds the engine from the program's templates, each week in its own order (`WeekOrder`).
    init(templates: [WorkoutTemplate]) {
        self.init(weekA: WeekOrder.members(of: .a, in: templates).map(\.id),
                  weekB: WeekOrder.members(of: .b, in: templates).map(\.id))
    }

    /// Rotation events from finished, non-imported sessions plus manual resets.
    static func events(sessions: [WorkoutSession], resets: [RotationReset]) -> [RotationEvent] {
        let completions = sessions.compactMap { session -> RotationEvent? in
            guard !session.isImported, let finished = session.finishedAt, let id = session.templateID else { return nil }
            return RotationEvent(date: finished, kind: .completed(templateID: id))
        }
        return completions + resets.map {
            RotationEvent(date: $0.date, kind: .reset(to: $0.week, weeksCompleted: $0.weeksCompleted))
        }
    }
}
