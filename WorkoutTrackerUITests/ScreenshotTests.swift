import XCTest

/// Captures key screens as PNGs. Skipped unless SCREENSHOT_DIR is set
/// (run via `make screenshots`, which passes TEST_RUNNER_SCREENSHOT_DIR).
final class ScreenshotTests: XCTestCase {
    @MainActor
    func testCaptureScreens() throws {
        guard let dir = ProcessInfo.processInfo.environment["SCREENSHOT_DIR"], !dir.isEmpty else {
            throw XCTSkip("Set SCREENSHOT_DIR to capture screenshots")
        }
        let app = XCUIApplication()
        app.launchArguments = ["-UITestReset"]
        app.launch()

        func shot(_ name: String) {
            let url = URL(fileURLWithPath: dir).appendingPathComponent("\(name).png")
            try? XCUIScreen.main.screenshot().pngRepresentation.write(to: url)
        }

        XCTAssertTrue(app.staticTexts["Week A"].waitForExistence(timeout: 10))
        shot("1-today")

        // Push 2 is next week but has imported history, so it shows "Last" hints.
        app.buttons["nextWeekRow-Push 2"].tap()
        XCTAssertTrue(app.buttons["startWorkout"].waitForExistence(timeout: 5))
        shot("2-preview")
        app.buttons["startWorkout"].tap()
        let field = app.textFields["setField-0-0"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("10")
        shot("3-logging")
        app.buttons["dismissKeyboard"].firstMatch.tap()
        app.buttons["finishWorkout"].tap()

        app.tabBars.buttons["History"].tap()
        sleep(1)
        shot("4-history")

        app.tabBars.buttons["Progress"].tap()
        app.staticTexts["Bulgarian Pushup"].tap()
        sleep(1)
        shot("5-progress")

        app.tabBars.buttons["Program"].tap()
        app.staticTexts["Legs"].tap()
        sleep(1)
        shot("6-program")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.buttons["exerciseLibrary"].tap()
        sleep(1)
        shot("6b-library")

        app.tabBars.buttons["Today"].tap()
        app.buttons["workoutRow-Pancake"].tap()
        XCTAssertTrue(app.buttons["startWorkout"].waitForExistence(timeout: 5))
        shot("6c-pancake")
        app.buttons["startWorkout"].tap()
        XCTAssertTrue(app.buttons["exerciseMenu-0"].waitForExistence(timeout: 5))
        app.buttons["exerciseMenu-0"].tap()
        XCTAssertTrue(app.buttons["swapExercise"].waitForExistence(timeout: 3))
        shot("6d-exercise-menu")
        app.buttons["swapExercise"].tap()
        sleep(1)
        shot("6e-library-picker")
        app.buttons["Cancel"].tap()
        app.navigationBars.buttons.element(boundBy: 0).tap()

        app.tabBars.buttons["Today"].tap()
        app.buttons["todayOptions"].tap()
        app.buttons["Appearance"].tap()
        XCTAssertTrue(app.buttons["Dark"].waitForExistence(timeout: 3))
        shot("7-appearance-menu")
        app.buttons["Dark"].tap()
        sleep(1)
        shot("8-dark-override")
    }
}
