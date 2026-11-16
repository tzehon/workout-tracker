import SwiftData
import SwiftUI

enum Route: Hashable {
    case preview(WorkoutTemplate)
    case session(WorkoutSession)
}

struct TodayView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \WorkoutTemplate.order) private var templates: [WorkoutTemplate]
    @Query(sort: \WorkoutSession.startedAt, order: .reverse) private var sessions: [WorkoutSession]
    @Query private var resets: [RotationReset]
    @State private var path: [Route] = []

    private var engine: RotationEngine { RotationEngine(templates: templates) }
    private var state: RotationState {
        engine.state(for: RotationEngine.events(sessions: sessions, resets: resets))
    }

    private func template(_ id: UUID) -> WorkoutTemplate? { templates.first { $0.id == id } }

    var body: some View {
        let state = state
        let thisWeek = engine.members(of: state.week).compactMap(template)
        let nextWeek = engine.members(of: state.week.next).compactMap(template)
        let nextUp = engine.nextUp(in: state)
        let inProgress = sessions.filter { !$0.isFinished }

        NavigationStack(path: $path) {
            List {
                Section {
                    WeekHeader(state: state, total: thisWeek.count, names: thisWeek.map(\.name))
                }

                if !inProgress.isEmpty {
                    Section("In progress") {
                        ForEach(inProgress) { session in
                            NavigationLink(value: Route.session(session)) {
                                Label {
                                    VStack(alignment: .leading) {
                                        Text("Resume \(session.templateName)").font(.headline)
                                        Text("Started \(session.startedAt.formatted(date: .omitted, time: .shortened))")
                                            .font(.caption).foregroundStyle(.secondary)
                                    }
                                } icon: {
                                    Image(systemName: "play.circle.fill").foregroundStyle(Theme.color(session.colorName))
                                }
                            }
                        }
                    }
                }

                Section("This week") {
                    ForEach(thisWeek) { workout in
                        NavigationLink(value: Route.preview(workout)) {
                            WorkoutRow(
                                workout: workout,
                                status: state.completed.contains(workout.id) ? .done : (workout.id == nextUp ? .upNext : .todo)
                            )
                        }
                        .accessibilityIdentifier("workoutRow-\(workout.name)")
                    }
                }

                Section {
                    ForEach(nextWeek) { workout in
                        NavigationLink(value: Route.preview(workout)) {
                            WorkoutRow(workout: workout, status: .later)
                        }
                    }
                } header: {
                    Text("Next: \(state.week.next.title)")
                }
            }
            .navigationTitle("Today")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Switch to \(state.week.next.title)", systemImage: "arrow.left.arrow.right") {
                            reset(to: state.week.next)
                        }
                        Button("Restart \(state.week.title)", systemImage: "arrow.counterclockwise") {
                            reset(to: state.week)
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                    .accessibilityLabel("Rotation options")
                }
            }
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .preview(let workout):
                    WorkoutPreviewView(
                        workout: workout,
                        countsThisWeek: workout.isIn(state.week) && !state.completed.contains(workout.id),
                        onStart: { session in
                            path.removeLast()
                            path.append(.session(session))
                        }
                    )
                case .session(let session):
                    SessionView(session: session)
                }
            }
        }
    }

    private func reset(to week: RotationWeek) {
        context.insert(RotationReset(date: .now, week: week))
    }
}

private struct WeekHeader: View {
    var state: RotationState
    var total: Int
    var names: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(state.week.title).font(.largeTitle.bold())
                Spacer()
                Text("\(state.completed.count) of \(total) done")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("weekProgress")
            }
            Text(names.joined(separator: " · ")).foregroundStyle(.secondary)
            ProgressView(value: Double(state.completed.count), total: Double(max(total, 1)))
            if state.weeksCompleted > 0 {
                Text("\(state.weeksCompleted) week\(state.weeksCompleted == 1 ? "" : "s") completed")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .contain)
    }
}

struct WorkoutRow: View {
    enum Status { case done, upNext, todo, later }

    var workout: WorkoutTemplate
    var status: Status

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(status == .later ? .secondary : Theme.color(workout.colorName))
            VStack(alignment: .leading, spacing: 2) {
                Text(workout.name).font(.headline)
                Text("\(workout.exercises.count) exercises").font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            switch status {
            case .upNext: Pill(text: "Up next", color: .accentColor)
            case .done: Pill(text: "Done", color: .green)
            default: EmptyView()
            }
        }
        .opacity(status == .later ? 0.6 : 1)
    }

    private var icon: String {
        switch status {
        case .done: "checkmark.circle.fill"
        case .upNext: "circle.circle"
        case .todo, .later: "circle"
        }
    }
}
