import SwiftUI
import UIKit

enum Theme {
    static let colorNames = ["blue", "green", "purple", "orange", "red", "pink", "teal", "indigo", "yellow"]

    static func color(_ name: String) -> Color {
        switch name {
        case "green": .green
        case "purple": .purple
        case "orange": .orange
        case "red": .red
        case "pink": .pink
        case "teal": .teal
        case "indigo": .indigo
        case "yellow": yellow
        default: .blue
        }
    }

    /// System yellow is too pale for text and white button labels on a light background,
    /// so light mode uses a deeper mustard. Dark mode keeps the system yellow.
    private static let yellow = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? .systemYellow
            : UIColor(red: 0.78, green: 0.56, blue: 0.0, alpha: 1)
    })
}

/// In-app appearance override. `.system` follows the phone's light/dark setting.
enum AppAppearance: String, CaseIterable, Identifiable {
    case system, light, dark

    static let storageKey = "appearance"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    var icon: String {
        switch self {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max"
        case .dark: "moon"
        }
    }

    /// `nil` means "don't override", so the system setting applies.
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
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
            let line = Format.prescription(sets: sets, target: target, unit: unit, perSide: perSide)
            if !line.isEmpty {
                Text(line).font(.subheadline.weight(.medium))
            }
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
