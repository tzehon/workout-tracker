import Foundation
import Testing
@testable import WorkoutTracker

struct RotationEngineTests {
    let push1 = UUID(), pull1 = UUID(), push2 = UUID(), pull2 = UUID(), legs = UUID()
    var engine: RotationEngine { RotationEngine(weekA: [push1, pull1, legs], weekB: [push2, pull2, legs]) }

    func day(_ n: Int) -> Date { Date(timeIntervalSince1970: TimeInterval(n) * 86_400) }
    func done(_ id: UUID, _ n: Int) -> RotationEvent { RotationEvent(date: day(n), kind: .completed(templateID: id)) }

    @Test func startsOnWeekAWithPush1Next() {
        let state = engine.state(for: [])
        #expect(state.week == .a)
        #expect(state.completed.isEmpty)
        #expect(engine.nextUp(in: state) == push1)
    }

    @Test func partialWeekTracksCompletedAndRemaining() {
        let state = engine.state(for: [done(push1, 1)])
        #expect(state.week == .a)
        #expect(state.completed == [push1])
        #expect(engine.remaining(in: state) == [pull1, legs])
        #expect(engine.nextUp(in: state) == pull1)
    }

    @Test func completingAllThreeFlipsToWeekB() {
        let state = engine.state(for: [done(push1, 1), done(pull1, 3), done(legs, 5)])
        #expect(state.week == .b)
        #expect(state.completed.isEmpty)
        #expect(state.weeksCompleted == 1)
        #expect(engine.nextUp(in: state) == push2)
    }

    @Test func workoutsCanBeDoneInAnyOrder() {
        let state = engine.state(for: [done(legs, 1), done(pull1, 2), done(push1, 3)])
        #expect(state.week == .b)
    }

    @Test func fullCycleReturnsToWeekA() {
        let events = [done(push1, 1), done(pull1, 2), done(legs, 3), done(push2, 8), done(legs, 9), done(pull2, 10)]
        let state = engine.state(for: events)
        #expect(state.week == .a)
        #expect(state.weeksCompleted == 2)
    }

    @Test func lateWeekDoesNotSkipAhead() {
        // Weeks of calendar time pass with only one workout done: still Week A.
        let state = engine.state(for: [done(push1, 1), done(pull1, 30)])
        #expect(state.week == .a)
        #expect(engine.remaining(in: state) == [legs])
    }

    @Test func offWeekAndRepeatWorkoutsDoNotCount() {
        let state = engine.state(for: [done(push2, 1), done(push1, 2), done(push1, 3)])
        #expect(state.week == .a)
        #expect(state.completed == [push1])
    }

    @Test func legsCountsSeparatelyInEachWeek() {
        // Legs done in week A doesn't carry over: week B still needs its own Legs.
        let events = [done(push1, 1), done(pull1, 2), done(legs, 3), done(push2, 4), done(pull2, 5)]
        let state = engine.state(for: events)
        #expect(state.week == .b)
        #expect(engine.remaining(in: state) == [legs])
    }

    @Test func eventsAreSortedByDate() {
        let state = engine.state(for: [done(legs, 5), done(push1, 1), done(pull1, 3)])
        #expect(state.week == .b)
    }

    @Test func resetJumpsToChosenWeek() {
        let reset = RotationEvent(date: day(2), kind: .reset(to: .b))
        let state = engine.state(for: [done(push1, 1), reset, done(push2, 3)])
        #expect(state.week == .b)
        #expect(state.completed == [push2])
    }

    @Test func emptyWeekNeverAdvances() {
        let empty = RotationEngine(weekA: [], weekB: [])
        let state = empty.state(for: [done(push1, 1)])
        #expect(state.week == .a)
        #expect(empty.nextUp(in: state) == nil)
    }
}
