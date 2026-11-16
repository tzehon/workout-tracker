import SwiftData
import SwiftUI

struct HistoryView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \WorkoutSession.startedAt, order: .reverse) private var sessions: [WorkoutSession]

    private var finished: [WorkoutSession] { sessions.filter(\.isFinished) }

    /// Finished sessions grouped by month, newest first.
    private var months: [(title: String, sessions: [WorkoutSession])] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: finished) { calendar.dateInterval(of: .month, for: $0.startedAt)?.start ?? $0.startedAt }
        return grouped.keys.sorted(by: >).map { key in
            (key.formatted(.dateTime.month(.wide).year()), grouped[key] ?? [])
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if finished.isEmpty {
                    ContentUnavailableView("No workouts yet", systemImage: "clock",
                                           description: Text("Finished workouts will show up here."))
                } else {
                    List {
                        ForEach(months, id: \.title) { month in
                            Section(month.title) {
                                ForEach(month.sessions) { session in
                                    NavigationLink(value: session) { HistoryRow(session: session) }
                                }
                                .onDelete { offsets in
                                    for index in offsets { context.delete(month.sessions[index]) }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("History")
            .navigationDestination(for: WorkoutSession.self) { SessionView(session: $0) }
        }
    }
}

private struct HistoryRow: View {
    var session: WorkoutSession

    var body: some View {
        let logged = session.exercises.filter { !$0.loggedValues.isEmpty }
        let totalSets = logged.reduce(0) { $0 + $1.loggedValues.count }
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 3)
                .fill(Theme.color(session.colorName))
                .frame(width: 6, height: 36)
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(session.templateName).font(.headline)
                    if session.isImported { Pill(text: "Imported") }
                }
                Text("\(logged.count) exercises · \(totalSets) sets")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(session.startedAt.longDate).font(.subheadline).foregroundStyle(.secondary)
        }
    }
}
