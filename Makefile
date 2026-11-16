SIM ?= iPhone 17 Pro
DEST = platform=iOS Simulator,name=$(SIM),OS=26.5
DERIVED = build/DerivedData

.PHONY: project build test unit-test ui-test clean

project:
	xcodegen generate --quiet

build: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) build -quiet

unit-test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -only-testing:WorkoutTrackerTests -quiet

ui-test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -only-testing:WorkoutTrackerUITests -quiet

test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) test -quiet

clean:
	rm -rf build WorkoutTracker.xcodeproj
