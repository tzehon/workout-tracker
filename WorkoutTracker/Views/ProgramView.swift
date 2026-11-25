import SwiftData
import SwiftUI

/// Value-based routes in the Program tab. Everything in this stack navigates by value:
/// mixing in view-destination links makes SwiftUI push value routes underneath them.
enum ProgramRoute: Hashable {
    case library
}

/// Edit the program: workouts, which week they belong to, and their exercises.
/// Edits only affect future sessions; logged sessions keep their own snapshot.
struct ProgramView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \WorkoutTemplate.order) private var templates: [WorkoutTemplate]
    @Query private var library: [LibraryExercise]
    @State private var pendingDelete: WorkoutTemplate?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink(value: ProgramRoute.library) {
                        LabeledContent {
                            Text("\(library.count)")
                        } label: {
                            Label("Exercise Library", systemImage: "books.vertical")
                        }
                    }
                    .accessibilityIdentifier("exerciseLibrary")
                }

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
                } header: {
                    Text("Workouts")
                } footer: {
                    Text("Week A and Week B alternate. A week moves on once every workout in it is finished.")
                }
            }
            .navigationTitle("Program")
            .navigationDestination(for: WorkoutTemplate.self) { TemplateEditView(workout: $0) }
            .navigationDestination(for: ExerciseTemplate.self) { ExerciseEditView(exercise: $0) }
            .navigationDestination(for: LibraryExercise.self) { LibraryEditView(entry: $0) }
            .navigationDestination(for: ProgramRoute.self) { route in
                switch route {
                case .library: LibraryView()
                }
            }
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
    @State private var picking = false

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

                Button("Add Exercise", systemImage: "plus") { picking = true }
                    .accessibilityIdentifier("addProgramExercise")
            }
        }
        .navigationTitle(workout.name)
        .toolbar { EditButton() }
        .keyboardDismissButton()
        .sheet(isPresented: $picking) {
            LibraryPicker(title: "Add to \(workout.name)") { ExerciseLibrary.add($0, to: workout) }
        }
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
}

struct ExerciseEditView: View {
    @Query private var library: [LibraryExercise]
    @Bindable var exercise: ExerciseTemplate
    @State private var picking = false

    var body: some View {
        let entry = library.first { $0.id == exercise.libraryID }
        Form {
            Section {
                if let entry {
                    NavigationLink(value: entry) {
                        LabeledContent(exercise.name) {
                            Text(entry.unit.label + (entry.perSide ? " · L&R" : ""))
                        }
                    }
                } else {
                    Text(exercise.name)
                }
                Button("Change Exercise", systemImage: "arrow.left.arrow.right") { picking = true }
            } header: {
                Text("Exercise")
            } footer: {
                Text("Name, measure and L&R come from the library. Changing the exercise resets this prescription to the new one's defaults.")
            }
            Section("In this workout") {
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
                LabeledContent(exercise.unit == .seconds ? "Seconds" : "Reps") {
                    TextField("e.g. 8-12", text: $exercise.targetText).multilineTextAlignment(.trailing)
                }
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
        .keyboardDismissButton()
        .sheet(isPresented: $picking) {
            LibraryPicker(title: "Change Exercise", excluding: exercise.libraryID) { exercise.apply($0) }
        }
    }
}
