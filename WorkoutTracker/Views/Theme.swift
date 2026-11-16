import SwiftUI

enum Theme {
    static let colorNames = ["blue", "green", "purple", "orange", "red", "pink", "teal", "indigo"]

    static func color(_ name: String) -> Color {
        switch name {
        case "green": .green
        case "purple": .purple
        case "orange": .orange
        case "red": .red
        case "pink": .pink
        case "teal": .teal
        case "indigo": .indigo
        default: .blue
        }
    }
}

/// Small rounded label, e.g. "A1" or "Up next".
struct Pill: View {
    var text: String
    var color: Color = .secondary

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

/// The prescription details for an exercise: sets × reps, rest, tempo, rings, cue.
struct PrescriptionDetails: View {
    var sets: String
    var target: String
    var unit: MeasureUnit
    var perSide: Bool
    var rest: String
    var tempo: String
    var rings: String
    var cue: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(Format.prescription(sets: sets, target: target, unit: unit, perSide: perSide))
                .font(.subheadline.weight(.medium))
            let details = [
                rest.isEmpty ? nil : "Rest \(rest)",
                tempo.isEmpty ? nil : "Tempo \(tempo)",
                rings.isEmpty ? nil : "Rings \(rings)",
            ].compactMap { $0 }
            if !details.isEmpty {
                Text(details.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if !cue.isEmpty {
                Text(cue).font(.caption).italic().foregroundStyle(.secondary)
            }
        }
    }
}

/// "1 exercise", "3 exercises".
func plural(_ count: Int, _ noun: String) -> String {
    "\(count) \(noun)\(count == 1 ? "" : "s")"
}

extension Date {
    var shortDate: String { formatted(.dateTime.day().month(.abbreviated)) }
    var longDate: String { formatted(date: .abbreviated, time: .omitted) }
}
