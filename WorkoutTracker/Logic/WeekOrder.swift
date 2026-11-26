import Foundation

/// The order workouts are listed (and suggested) in each week. Each week has its own order,
/// set by reordering on Today, so Legs can sit in different places in Week A and
/// Week B. Workouts never placed in a week (an untouched week, or one added to it later) come
/// after the placed ones, in program order.
///
/// Order only decides what's listed first and what's "Up next". The rotation counts finished
/// workouts as a set, so reordering never changes logged history or which week you're in.
enum WeekOrder {
    static func members(of week: RotationWeek, in templates: [WorkoutTemplate]) -> [WorkoutTemplate] {
        templates
            .filter { $0.isIn(week) }
            .sorted {
                let lhs = ($0.position(in: week) ?? .max, $0.order)
                let rhs = ($1.position(in: week) ?? .max, $1.order)
                return lhs < rhs
            }
    }

    /// Moves workouts within `week` and stores the result as that week's order.
    /// The other week is untouched.
    static func move(in week: RotationWeek, templates: [WorkoutTemplate], from source: IndexSet, to destination: Int) {
        var reordered = members(of: week, in: templates)
        reordered.move(fromOffsets: source, toOffset: destination)
        for (index, workout) in reordered.enumerated() { workout.setPosition(index, in: week) }
    }
}
