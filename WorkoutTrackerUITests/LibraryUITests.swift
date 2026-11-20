import XCTest

/// The exercise library in the Program tab.
final class LibraryUITests: XCTestCase {
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
    func testRenameInLibraryUpdatesProgram() {
        launchApp()
        app.tabBars.buttons["Program"].tap()
        app.buttons["exerciseLibrary"].tap()
        let row = app.buttons["libraryRow-Chest Fly"]
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        let name = app.textFields["libraryName"]
        XCTAssertTrue(name.waitForExistence(timeout: 3))
        name.tap()
        name.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 12) + "Ring Fly")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.navigationBars.buttons.element(boundBy: 0).tap()

        app.staticTexts["Push 1"].tap()
        XCTAssertTrue(app.staticTexts["Ring Fly"].waitForExistence(timeout: 5))
    }
}
