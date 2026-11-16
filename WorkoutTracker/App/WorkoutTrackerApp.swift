import SwiftData
import SwiftUI

@main
struct WorkoutTrackerApp: App {
    let container: ModelContainer

    init() {
        // UI tests launch with -UITestReset to get a fresh, in-memory, freshly seeded store.
        let isUITest = CommandLine.arguments.contains("-UITestReset")
        do {
            container = try AppSchema.makeContainer(inMemory: isUITest)
            if isUITest {
                try Seeder.seed(context: container.mainContext)
            } else {
                try Seeder.seedIfNeeded(context: container.mainContext)
            }
        } catch {
            fatalError("Could not open the workout store: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(container)
    }
}

struct RootView: View {
    var body: some View {
        TabView {
            Tab("Today", systemImage: "figure.strengthtraining.traditional") { TodayView() }
            Tab("History", systemImage: "clock.arrow.circlepath") { HistoryView() }
            Tab("Progress", systemImage: "chart.xyaxis.line") { ProgressTabView() }
            Tab("Program", systemImage: "list.bullet.rectangle") { ProgramView() }
        }
    }
}
