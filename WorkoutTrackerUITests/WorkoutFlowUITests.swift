import XCTest

/// End-to-end: log a Push 1 session and check it moves the rotation and lands in History.
final class WorkoutFlowUITests: XCTestCase {
    var app: XCUIApplication!

    @MainActor
    func launchApp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-UITestReset"]
        app.launch()
    }

    @MainActor
    func testTodayStartsOnWeekA() {
        launchApp()
        XCTAssertTrue(app.staticTexts["Week A"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["weekProgress"].label, "0 of 4 done")
        XCTAssertTrue(app.buttons["workoutRow-Push 1"].exists)
        XCTAssertTrue(app.buttons["workoutRow-Pull 1"].exists)
        XCTAssertTrue(app.buttons["workoutRow-Legs"].exists)
        XCTAssertTrue(app.buttons["workoutRow-Pancake"].exists)
        XCTAssertTrue(app.buttons["nextWeekRow-Pancake"].exists)
    }

    @MainActor
    func testLoggingAWorkoutAdvancesTheWeek() {
        launchApp()
        app.buttons["workoutRow-Push 1"].tap()
        app.buttons["startWorkout"].tap()

        let firstSet = app.textFields["setField-0-0"]
        XCTAssertTrue(firstSet.waitForExistence(timeout: 5))
        firstSet.tap()
        firstSet.typeText("9")

        app.buttons["finishWorkout"].tap()

        XCTAssertTrue(app.staticTexts["weekProgress"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["weekProgress"].label, "1 of 4 done")

        app.tabBars.buttons["History"].tap()
        XCTAssertTrue(app.staticTexts["Push 1"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testImportedProgressIsCharted() {
        launchApp()
        app.tabBars.buttons["Progress"].tap()
        let row = app.staticTexts["Bulgarian Pushup"]
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        XCTAssertTrue(app.staticTexts["8, 8, 6"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["6, 6, 3"].exists)
    }
}
