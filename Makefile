SIM ?= iPhone 17 Pro
DEST = platform=iOS Simulator,name=$(SIM),OS=26.5
DERIVED = build/DerivedData

.PHONY: project build test unit-test ui-test screenshots icons clean

project:
	xcodegen generate --quiet

build: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) build -quiet

unit-test: project
	set -o pipefail; xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -only-testing:WorkoutTrackerTests 2>&1 | grep -E "error:|✘|Test run with|failed"

ui-test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -only-testing:WorkoutTrackerUITests -quiet

test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -quiet

clean:
	rm -rf build WorkoutTracker.xcodeproj

SHOTS ?= $(CURDIR)/build/screenshots
screenshots: project
	mkdir -p $(SHOTS)
	TEST_RUNNER_SCREENSHOT_DIR=$(SHOTS) xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -only-testing:WorkoutTrackerUITests/ScreenshotTests -quiet
	@echo "Screenshots in $(SHOTS)"

ICONSET = WorkoutTracker/Resources/Assets.xcassets/AppIcon.appiconset
icons:
	swift scripts/make-icon.swift $(ICONSET)/AppIcon.png light
	swift scripts/make-icon.swift $(ICONSET)/AppIcon-Dark.png dark
	swift scripts/make-icon.swift $(ICONSET)/AppIcon-Tinted.png tinted
