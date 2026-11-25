SIM ?= iPhone 17 Pro
# "latest" is the newest installed iOS runtime that has $(SIM).
OS ?= latest
# CI sets DEST to whichever simulator the runner has (scripts/ci-destination.sh).
DEST ?= platform=iOS Simulator,name=$(SIM),OS=$(OS)
DERIVED = build/DerivedData
# Extra xcodebuild flags, e.g. XCODEBUILD_FLAGS="-resultBundlePath build/unit.xcresult".
XCODEBUILD_FLAGS ?=

.PHONY: project build test unit-test ui-test screenshots icons ipa clean

project:
	xcodegen generate --quiet

build: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) $(XCODEBUILD_FLAGS) build -quiet

unit-test: project
	set -o pipefail; xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) $(XCODEBUILD_FLAGS) test -only-testing:WorkoutTrackerTests 2>&1 | grep -E "error:|✘|Test run with|failed"

ui-test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) $(XCODEBUILD_FLAGS) test -only-testing:WorkoutTrackerUITests -quiet

test: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -destination '$(DEST)' -derivedDataPath $(DERIVED) $(XCODEBUILD_FLAGS) test -quiet

clean:
	rm -rf build WorkoutTracker.xcodeproj

# Unsigned Release build packaged as an .ipa (re-sign it to install). Used by the release workflow.
VERSION ?= 1.0
BUILD_NUMBER ?= 1
IPA = build/WorkoutTracker-$(VERSION)-unsigned.ipa
ipa: project
	xcodebuild -project WorkoutTracker.xcodeproj -scheme WorkoutTracker -configuration Release -destination 'generic/platform=iOS' -derivedDataPath $(DERIVED) CODE_SIGNING_ALLOWED=NO MARKETING_VERSION=$(VERSION) CURRENT_PROJECT_VERSION=$(BUILD_NUMBER) build -quiet
	rm -rf build/ipa $(IPA) && mkdir -p build/ipa/Payload
	cp -R $(DERIVED)/Build/Products/Release-iphoneos/WorkoutTracker.app build/ipa/Payload/
	cd build/ipa && zip -qry ../$(notdir $(IPA)) Payload
	@echo "Built $(IPA)"

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
