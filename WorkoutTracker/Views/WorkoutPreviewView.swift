import SwiftData
import SwiftUI

/// Shows a workout's exercises and last numbers before starting it.
struct WorkoutPreviewView: View {
    @Environment(\.modelContext) private var context
    @Query private var sessions: [WorkoutSession]

    var workout: WorkoutTemplate
    var countsThisWeek: Bool
    var onStart: (WorkoutSession) -> Void

    var body: some View {
        let inProgress = sessions.first { !$0.isFinished && $0.templateID == workout.id }

        List {
            if !countsThisWeek {
                Section {
                    Label("This workout isn't due this week, so it won't count toward the rotation.",
                          systemImage: "info.circle")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            ForEach(workout.sortedExercises) { exercise in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        if !exercise.groupLabel.isEmpty { Pill(text: exercise.groupLabel) }
                        Text(exercise.name).font(.headline)
                    }
                    PrescriptionDetails(
                        sets: exercise.setsText, target: exercise.targetText, unit: exercise.unit,
                        perSide: exercise.perSide, rest: exercise.restText, tempo: exercise.tempo,
                        rings: exercise.ringSetting, cue: exercise.cue
                    )
                    if let last = PerformanceLookup.last(exerciseTemplateID: exercise.id, name: exercise.name, in: sessions) {
                        Text("Last (\(last.date.shortDate)): \(Format.values(last.values, unit: last.unit))")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(Theme.color(workout.colorName))
                    }
                }
                .padding(.vertical, 2)
            }
        }
        .navigationTitle(workout.name)
        .safeAreaInset(edge: .bottom) {
            Button {
                onStart(inProgress ?? SessionFactory.start(workout, context: context))
            } label: {
                Text(inProgress == nil ? "Start Workout" : "Resume Workout")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.color(workout.colorName))
            .padding()
            .background(.bar)
            .accessibilityIdentifier("startWorkout")
        }
    }
}
