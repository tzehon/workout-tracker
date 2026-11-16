import UIKit
import XCTest

/// Drives the Appearance picker in Today's options menu and checks the screen really changes.
final class AppearanceUITests: XCTestCase {
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
    func choose(_ option: String) {
        app.buttons["todayOptions"].tap()
        let submenu = app.buttons["Appearance"]
        XCTAssertTrue(submenu.waitForExistence(timeout: 3))
        submenu.tap()
        let item = app.buttons[option]
        XCTAssertTrue(item.waitForExistence(timeout: 3))
        item.tap()
        sleep(1) // let the colour scheme transition finish
    }

    /// Average brightness of the whole screen, 0 (black) … 1 (white).
    @MainActor
    func screenBrightness() -> CGFloat {
        // Shrinking the screenshot to one pixel averages every pixel on screen.
        let image = XCUIScreen.main.screenshot().image
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let pixel = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1), format: format)
            .image { _ in image.draw(in: CGRect(x: 0, y: 0, width: 1, height: 1)) }
        guard let data = pixel.cgImage?.dataProvider?.data, let bytes = CFDataGetBytePtr(data) else {
            XCTFail("Could not read screenshot pixels")
            return -1
        }
        return (CGFloat(bytes[0]) + CGFloat(bytes[1]) + CGFloat(bytes[2])) / (3 * 255)
    }

    @MainActor
    func testSwitchingAppearance() {
        launchApp()
        let systemBrightness = screenBrightness()

        choose("Dark")
        XCTAssertLessThan(screenBrightness(), 0.4, "Dark should make the screen dark")

        choose("Light")
        XCTAssertGreaterThan(screenBrightness(), 0.6, "Light should make the screen light")

        choose("System")
        XCTAssertEqual(screenBrightness(), systemBrightness, accuracy: 0.1,
                       "System should go back to the phone's own setting")
    }

    @MainActor
    func testChoiceSurvivesRelaunch() {
        launchApp()
        choose("Dark")

        app.terminate()
        app.launchArguments = ["-UITestReset", "-UITestKeepSettings"]
        app.launch()
        XCTAssertTrue(app.staticTexts["Week A"].waitForExistence(timeout: 10))
        sleep(1)
        XCTAssertLessThan(screenBrightness(), 0.4, "Dark should still be chosen after relaunch")

        // Leave the simulator on System so manual launches aren't stuck in Dark.
        choose("System")
    }
}
