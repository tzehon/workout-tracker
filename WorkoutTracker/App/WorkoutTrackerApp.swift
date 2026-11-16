import SwiftData
import SwiftUI

@main
struct WorkoutTrackerApp: App {
    let container: ModelContainer

    init() {
        // UI tests launch with -UITestReset to get a fresh, in-memory, freshly seeded store and
        // default settings. Adding -UITestKeepSettings keeps settings, to test they persist.
        let isUITest = CommandLine.arguments.contains("-UITestReset")
        let keepSettings = CommandLine.arguments.contains("-UITestKeepSettings")
        do {
            container = try AppSchema.makeContainer(inMemory: isUITest)
            if isUITest {
                if !keepSettings { UserDefaults.standard.removeObject(forKey: AppAppearance.storageKey) }
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
    @AppStorage(AppAppearance.storageKey) private var appearance: AppAppearance = .system

    var body: some View {
        TabView {
            Tab("Today", systemImage: "figure.strengthtraining.traditional") { TodayView() }
            Tab("History", systemImage: "clock.arrow.circlepath") { HistoryView() }
            Tab("Progress", systemImage: "chart.xyaxis.line") { ProgressTabView() }
            Tab("Program", systemImage: "list.bullet.rectangle") { ProgramView() }
        }
        .preferredColorScheme(appearance.colorScheme)
    }
}
