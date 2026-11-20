import XCTest

/// Adding, swapping and removing exercises mid-workout, and the exercise library.
final class SessionEditingUITests: XCTestCase {
    var app: XCUIApplication!

    @MainActor
    func launchApp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-UITestReset"]
        app.launch()
        XCTAssertTrue(app.staticTexts["Week A"].waitForExistence(timeout: 10))
    }

    @MainActor
    func startPush1() {
        app.buttons["workoutRow-Push 1"].tap()
        app.buttons["startWorkout"].tap()
        XCTAssertTrue(app.buttons["exerciseMenu-0"].waitForExistence(timeout: 5))
    }

    @MainActor
    func pick(_ name: String) {
        let search = app.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText(name)
        let row = app.buttons["libraryPickerRow-\(name)"]
        XCTAssertTrue(row.waitForExistence(timeout: 3))
        row.tap()
    }

    @MainActor
    func scrollTo(_ element: XCUIElement) {
        for _ in 0..<8 where !element.isHittable { app.swipeUp() }
    }

    @MainActor
    func testSwapExerciseInSession() {
        launchApp()
        startPush1()
        app.buttons["exerciseMenu-0"].tap()
        app.buttons["swapExercise"].tap()
        pick("Bulgarian Pushup")

        XCTAssertTrue(app.staticTexts["Bulgarian Pushup"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Ring Dip (Elbows in)"].exists)
        // Its library history shows as "Last".
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS '6, 6, 3'")).firstMatch.exists)
    }

    @MainActor
    func testSwapWithLoggedSetsAsksFirst() {
        launchApp()
        startPush1()
        let field = app.textFields["setField-0-0"]
        field.tap()
        field.typeText("9")
        app.buttons["Done"].firstMatch.tap()

        app.buttons["exerciseMenu-0"].tap()
        app.buttons["swapExercise"].tap()
        let confirm = app.buttons["Swap and Clear Sets"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 3))
        confirm.tap()
        pick("Pullup")
        XCTAssertTrue(app.staticTexts["Pullup"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.textFields["setField-0-0"].value as? String, app.textFields["setField-0-0"].placeholderValue)
    }

    @MainActor
    func testRemoveAndAddExercise() {
        launchApp()
        startPush1()
        app.buttons["exerciseMenu-1"].tap()
        app.buttons["removeExercise"].tap()
        XCTAssertTrue(app.staticTexts["Archer Pushup (Alternating)"].waitForNonExistence(timeout: 3))

        let add = app.buttons["addExerciseToSession"]
        scrollTo(add)
        add.tap()
        pick("Wall Squat")
        let added = app.staticTexts["Wall Squat"]
        XCTAssertTrue(added.waitForExistence(timeout: 5))

        app.buttons["finishWorkout"].tap()
        app.buttons["Finish Workout"].tap()
        XCTAssertEqual(app.staticTexts["weekProgress"].label, "1 of 4 done")

        // The program itself is unchanged.
        app.tabBars.buttons["Program"].tap()
        app.staticTexts["Push 1"].tap()
        XCTAssertTrue(app.staticTexts["Archer Pushup (Alternating)"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Wall Squat"].exists)
    }

    @MainActor
    func testCreateExerciseFromPicker() {
        launchApp()
        startPush1()
        let add = app.buttons["addExerciseToSession"]
        scrollTo(add)
        add.tap()
        let search = app.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("Front Lever")
        app.buttons["libraryPickerCreate"].tap()
        XCTAssertTrue(app.staticTexts["Front Lever"].waitForExistence(timeout: 5))

        app.tabBars.buttons["Program"].tap()
        app.buttons["exerciseLibrary"].tap()
        XCTAssertTrue(app.buttons["libraryRow-Front Lever"].waitForExistence(timeout: 5))
    }
}
