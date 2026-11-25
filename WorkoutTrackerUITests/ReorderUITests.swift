import XCTest

/// Reordering this week on Today moves the rows and the summary line, and leaves next week alone.
final class ReorderUITests: XCTestCase {
    @MainActor
    func testReorderThisWeek() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-UITestReset"]
        app.launch()

        let legs = app.buttons["workoutRow-Legs"]
        let pull = app.buttons["workoutRow-Pull 1"]
        XCTAssertTrue(legs.waitForExistence(timeout: 10))
        XCTAssertLessThan(pull.frame.minY, legs.frame.minY)

        app.buttons["reorderWorkouts"].tap()
        let legsHandle = reorderHandle("Legs", in: app)
        let pullHandle = reorderHandle("Pull 1", in: app)
        XCTAssertTrue(legsHandle.waitForExistence(timeout: 5))
        legsHandle.press(forDuration: 0.5, thenDragTo: pullHandle)
        app.buttons["reorderWorkouts"].tap()

        XCTAssertTrue(app.staticTexts["Push 1 · Legs · Pull 1 · Pancake"].waitForExistence(timeout: 5))
        XCTAssertLessThan(legs.frame.minY, pull.frame.minY)
        XCTAssertLessThan(app.buttons["nextWeekRow-Pull 2"].frame.minY, app.buttons["nextWeekRow-Legs"].frame.minY)
    }

    /// The first reorder control for a workout's row (this week's comes before next week's).
    @MainActor
    private func reorderHandle(_ name: String, in app: XCUIApplication) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Reorder \(name),")).firstMatch
    }
}
