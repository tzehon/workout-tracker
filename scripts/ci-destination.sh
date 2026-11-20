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
best = None
for runtime, items in devices.items():
    match = re.search(r"iOS-(\d+)-(\d+)", runtime)
    phones = [d for d in items if d["name"].startswith("iPhone")]
    if not match or not phones:
        continue
    version = (int(match.group(1)), int(match.group(2)))
    phone = next((d for d in phones if d["name"] == preferred), phones[0])
    if best is None or version > best[0]:
        best = (version, phone)
if best is None:
    sys.exit("No available iPhone simulator found")
(major, minor), phone = best
print("platform=iOS Simulator,id=" + phone["udid"])
print("Using %s on iOS %d.%d" % (phone["name"], major, minor), file=sys.stderr)
' "$preferred"
