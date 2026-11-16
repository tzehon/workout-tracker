import Charts
import SwiftData
import SwiftUI

struct ProgressTabView: View {
    @Query(sort: \WorkoutSession.startedAt) private var sessions: [WorkoutSession]

    var body: some View {
        let names = ProgressSeries.exerciseNames(in: sessions)
        NavigationStack {
            Group {
                if names.isEmpty {
                    ContentUnavailableView("No progress yet", systemImage: "chart.xyaxis.line",
                                           description: Text("Log a workout to start charting each exercise."))
                } else {
                    List(names, id: \.self) { name in
                        let points = ProgressSeries.points(forExerciseNamed: name, in: sessions)
                        let unit = ProgressSeries.unit(forExerciseNamed: name, in: sessions)
                        NavigationLink(value: name) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(name).font(.headline)
                                    Text("\(points.count) session\(points.count == 1 ? "" : "s")")
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if let latest = points.last {
                                    Text("Best \(latest.best)\(unit.shortSuffix)")
                                        .font(.subheadline.monospacedDigit())
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Progress")
            .navigationDestination(for: String.self) { ExerciseProgressView(name: $0) }
        }
    }
}

struct ExerciseProgressView: View {
    enum Metric: String, CaseIterable, Identifiable {
        case best = "Best set"
        case total = "Total"
        var id: String { rawValue }
    }

    @Query(sort: \WorkoutSession.startedAt) private var sessions: [WorkoutSession]
    var name: String
    @State private var metric: Metric = .best

    var body: some View {
        let points = ProgressSeries.points(forExerciseNamed: name, in: sessions)
        let unit = ProgressSeries.unit(forExerciseNamed: name, in: sessions)
        let unitName = unit == .seconds ? "Seconds" : "Reps"

        List {
            Section {
                Picker("Metric", selection: $metric) {
                    ForEach(Metric.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)

                Chart(points) { point in
                    let value = metric == .best ? point.best : point.total
                    LineMark(x: .value("Date", point.date), y: .value(unitName, value))
                        .interpolationMethod(.monotone)
                    PointMark(x: .value("Date", point.date), y: .value(unitName, value))
                        .symbol(point.isImported ? .square : .circle)
                        .annotation(position: .top) {
                            Text("\(value)").font(.caption2).foregroundStyle(.secondary)
                        }
                }
                .chartYScale(domain: .automatic(includesZero: true))
                .chartYAxisLabel(metric == .best ? "\(unitName) (best set)" : "\(unitName) (all sets)")
                .frame(height: 220)
                .padding(.vertical, 8)
            } footer: {
                if points.contains(where: \.isImported) {
                    Text("Squares are sessions imported from Notion; their dates are estimated.")
                }
            }

            Section("Sessions") {
                ForEach(points.reversed()) { point in
                    HStack {
                        Text(point.date.longDate)
                        if point.isImported { Pill(text: "Imported") }
                        Spacer()
                        Text(Format.values(point.sets, unit: unit))
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle(name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
