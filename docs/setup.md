# Setup

## Requirements

- macOS with Xcode 26 or newer (tested with Xcode 27.2, iPhone 17 Pro on iOS 27.2)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`
- iOS 18.0+ on the device

The Xcode project is **generated** from `project.yml` and is not committed. Run
`make project` (or any other `make` target) after cloning and after editing `project.yml`.

## Make targets

| Command | What it does |
|---------|--------------|
| `make project` | Generate `WorkoutTracker.xcodeproj` from `project.yml` |
| `make build` | Build for the simulator |
| `make unit-test` | Run the Swift Testing unit suites (rotation, seed, sessions, progress) |
| `make ui-test` | Run the XCUITest end-to-end flows |
| `make test` | Run everything |
| `make screenshots` | Capture the main screens as PNGs in `build/screenshots/` |
| `make icons` | Redraw the light, dark and tinted app icons (`scripts/make-icon.swift`) |
| `make ipa VERSION=1.1` | Unsigned Release build packaged as `build/WorkoutTracker-1.1-unsigned.ipa` |
| `make testflight` | Signed Release build uploaded to TestFlight as Internal Only (see below) |
| `make clean` | Remove `build/` and the generated project |

Tests run on an iPhone 17 Pro simulator on the newest iOS you have installed. Pick another
simulator with `make test SIM="iPhone 17"` or a specific runtime with `OS=27.2`.
`DEST` overrides the whole destination, e.g. `make test DEST="$(scripts/ci-destination.sh)"`
picks an iPhone on the newest runtime you have installed.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on a `macos-26` runner with the latest stable Xcode:

| Trigger | What runs |
|---------|-----------|
| Push to `main`, pull request, manual run | Generate the project, then unit tests and UI tests on the newest iPhone simulator. On failure the `.xcresult` bundles are uploaded as an artifact. |
| Push a tag `v*` (e.g. `git tag v1.1 && git push origin v1.1`) | The tests, then `make ipa` with the tag as the version and the run number as the build, published as a GitHub Release. |

The release `.ipa` is **unsigned**. To get a build on your phone, use `make testflight` (below)
or install from Xcode. Uploading to TestFlight from CI would need App Store Connect API keys as
repository secrets, so for now it runs locally.

## TestFlight

`make testflight` archives a signed Release build and uploads it to App Store Connect as
**TestFlight Internal Only**, the same as Xcode's *Distribute App → TestFlight Internal Only*.

- Needs Xcode signed in (*Settings → Accounts*) to the paid team set as `DEVELOPMENT_TEAM` in
  `project.yml`, and the app already created in App Store Connect.
- Each upload needs a higher build number. It defaults to the current time (`202611251027`
  style). Set one yourself with `make testflight TESTFLIGHT_BUILD=...`. The version comes from
  `MARKETING_VERSION` in `project.yml`.
- `ITSAppUsesNonExemptEncryption = NO` is in the Info.plist, so builds don't stop at
  *Missing Compliance*.
- Export options are in `scripts/testflight-export.plist`. The build appears in TestFlight
  after 5–15 minutes of processing, and internal groups with automatic distribution get it then.

## Running on your iPhone

1. `make project && open WorkoutTracker.xcodeproj`
2. Signing uses the team in `DEVELOPMENT_TEAM` in `project.yml`. To use your own, change it
   there. (A free Apple ID works; apps signed that way expire after 7 days and need re-running.)
3. If `com.tzehon.WorkoutTracker` is taken, change `PRODUCT_BUNDLE_IDENTIFIER` in `project.yml`.
4. Plug in the phone, select it as the run destination, press ⌘R.

## Data

- Stored locally with SwiftData (`default.store` in the app's Application Support). Nothing syncs.
- On first launch the Notion program and its Progression history are seeded once. A
  `UserDefaults` flag (`didSeedProgram.v1`) stops it from re-seeding if you later delete workouts.
- Installs from before Flexibility get Pancake replaced once on the next launch
  (`didReplacePancakeWithFlexibility.v1`): Pancake and the library exercises only it used are
  deleted (logged Pancake sessions stay in History), Flexibility 1/2 take its place, and your
  current week and what's done in it are kept. Every launch also links any exercise not yet in the
  exercise library.
- Deleting the app deletes all logged data.
- UI tests launch with `-UITestReset`, which uses a fresh in-memory store and doesn't touch real data.

## Imported history assumptions

The Notion Progression cells have no dates. The importer assumes:

- Each line in a cell is one session, **oldest first** (e.g. Bulgarian Pushup `8,8,6` then `6,6,3`).
- Session *k* of *n* is dated *(n − k)* weeks before first launch, so charts read left to right.
- `12s` / `35s` values are seconds.
