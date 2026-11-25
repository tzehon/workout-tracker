#!/usr/bin/env bash
# Prints an xcodebuild destination for an available iPhone simulator on the newest iOS runtime,
# preferring the Makefile's default device. CI runners don't always have the exact OS pinned
# in the Makefile, so the workflow uses this instead.
set -euo pipefail
preferred="${1:-iPhone 17 Pro}"
xcrun simctl list devices available --json | python3 -c '
import json, re, sys
preferred = sys.argv[1]
devices = json.load(sys.stdin)["devices"]
# A version can have several runtimes (iPhone Duo ships its own), so pool every iPhone per version.
phones = {}
for runtime, items in devices.items():
    match = re.search(r"iOS-(\d+)-(\d+)", runtime)
    if match:
        version = (int(match.group(1)), int(match.group(2)))
        phones.setdefault(version, []).extend(d for d in items if d["name"].startswith("iPhone"))
phones = {v: ds for v, ds in phones.items() if ds}
if not phones:
    sys.exit("No available iPhone simulator found")
major, minor = max(phones)
newest = phones[(major, minor)]
# The folding screen of iPhone Duo breaks the UI tests, so only use it if nothing else exists.
usual = sorted((d for d in newest if "Duo" not in d["name"]), key=lambda d: d["name"]) or newest
phone = next((d for d in newest if d["name"] == preferred), usual[0])
print("platform=iOS Simulator,id=" + phone["udid"])
print("Using %s on iOS %d.%d" % (phone["name"], major, minor), file=sys.stderr)
' "$preferred"
