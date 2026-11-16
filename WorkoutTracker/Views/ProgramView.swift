import SwiftData
import SwiftUI

/// Edit the program: workouts, which week they belong to, and their exercises.
/// Edits only affect future sessions; logged sessions keep their own snapshot.
struct ProgramView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \WorkoutTemplate.order) private var templates: [WorkoutTemplate]
    @State private var pendingDelete: WorkoutTemplate?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(templates) { workout in
                        NavigationLink(value: workout) {
                            HStack {
                                Circle().fill(Theme.color(workout.colorName)).frame(width: 12, height: 12)
                                Text(workout.name)
                                Spacer()
                                if workout.inWeekA { Pill(text: "A") }
                                if workout.inWeekB { Pill(text: "B") }
                            }
                        }
                    }
                    .onMove(perform: move)
                    .onDelete { offsets in pendingDelete = offsets.first.map { templates[$0] } }
                } footer: {
                    Text("Week A and Week B alternate. A week moves on once every workout in it is finished.")
                }
            }
            .navigationTitle("Program")
            .navigationDestination(for: WorkoutTemplate.self) { TemplateEditView(workout: $0) }
            .navigationDestination(for: ExerciseTemplate.self) { ExerciseEditView(exercise: $0) }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { EditButton() }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Add Workout", systemImage: "plus", action: addWorkout)
                }
            }
            .confirmationDialog(
                "Delete \(pendingDelete?.name ?? "workout")?",
                isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    if let pendingDelete { context.delete(pendingDelete) }
                    pendingDelete = nil
                }
            } message: {
                Text("Its logged history stays in History and Progress.")
            }
        }
    }

    private func move(from source: IndexSet, to destination: Int) {
        var reordered = templates
        reordered.move(fromOffsets: source, toOffset: destination)
        for (index, workout) in reordered.enumerated() { workout.order = index }
    }

    private func addWorkout() {
        let workout = WorkoutTemplate(name: "New Workout", order: (templates.map(\.order).max() ?? -1) + 1,
                                      colorName: "teal", inWeekA: false, inWeekB: false)
        context.insert(workout)
    }
}

struct TemplateEditView: View {
    @Environment(\.modelContext) private var context
    @Bindable var workout: WorkoutTemplate

    var body: some View {
        Form {
            Section("Workout") {
                TextField("Name", text: $workout.name)
                Picker("Colour", selection: $workout.colorName) {
                    ForEach(Theme.colorNames, id: \.self) { name in
                        Label {
                            Text(name.capitalized)
                        } icon: {
                            Image(systemName: "circle.fill").foregroundStyle(Theme.color(name))
                        }
                        .tag(name)
                    }
                }
                .pickerStyle(.navigationLink)
                Toggle("Week A", isOn: $workout.inWeekA)
                Toggle("Week B", isOn: $workout.inWeekB)
            }

            Section("Exercises") {
                ForEach(workout.sortedExercises) { exercise in
                    NavigationLink(value: exercise) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                if !exercise.groupLabel.isEmpty { Pill(text: exercise.groupLabel) }
                                Text(exercise.name)
                            }
                            Text(Format.prescription(sets: exercise.setsText, target: exercise.targetText,
                                                     unit: exercise.unit, perSide: exercise.perSide))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .onMove(perform: move)
                .onDelete(perform: delete)

                Button("Add Exercise", systemImage: "plus", action: addExercise)
            }
        }
        .navigationTitle(workout.name)
        .toolbar { EditButton() }
    }

    private func move(from source: IndexSet, to destination: Int) {
        var reordered = workout.sortedExercises
        reordered.move(fromOffsets: source, toOffset: destination)
        for (index, exercise) in reordered.enumerated() { exercise.order = index }
    }

    private func delete(_ offsets: IndexSet) {
        let sorted = workout.sortedExercises
        for index in offsets {
            let exercise = sorted[index]
            workout.exercises.removeAll { $0.id == exercise.id }
            context.delete(exercise)
        }
    }

    private func addExercise() {
        let exercise = ExerciseTemplate(
            name: "New Exercise", order: (workout.exercises.map(\.order).max() ?? -1) + 1,
            setsText: "3", plannedSets: 3, targetText: "8-12", restText: "1:30"
        )
        exercise.workout = workout
        workout.exercises.append(exercise)
    }
}

struct ExerciseEditView: View {
    @Bindable var exercise: ExerciseTemplate

    var body: some View {
        Form {
            Section("Exercise") {
                TextField("Name", text: $exercise.name)
                LabeledContent("Group") {
                    TextField("e.g. A1, B2", text: $exercise.groupLabel).multilineTextAlignment(.trailing)
                }
                TextField("Coaching cue", text: $exercise.cue, axis: .vertical)
            }
            Section("Prescription") {
                LabeledContent("Sets") {
                    TextField("e.g. 3-4", text: $exercise.setsText).multilineTextAlignment(.trailing)
                }
                Stepper("Rows to start with: \(exercise.plannedSets)", value: $exercise.plannedSets, in: 1...10)
                Picker("Measure", selection: $exercise.unit) {
                    ForEach(MeasureUnit.allCases) { Text($0.label).tag($0) }
                }
                LabeledContent(exercise.unit == .seconds ? "Seconds" : "Reps") {
                    TextField("e.g. 8-12", text: $exercise.targetText).multilineTextAlignment(.trailing)
                }
                Toggle("Each side (L&R)", isOn: $exercise.perSide)
                LabeledContent("Rest") {
                    TextField("e.g. 1:30", text: $exercise.restText).multilineTextAlignment(.trailing)
                }
                LabeledContent("Tempo") {
                    TextField("e.g. 30X1", text: $exercise.tempo).multilineTextAlignment(.trailing)
                }
                LabeledContent("Rings") {
                    TextField("Height / length", text: $exercise.ringSetting).multilineTextAlignment(.trailing)
                }
            }
        }
        .navigationTitle(exercise.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
