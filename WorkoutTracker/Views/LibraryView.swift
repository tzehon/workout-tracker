import SwiftData
import SwiftUI

/// Every exercise in the library, searchable. Lives inside the Program tab.
struct LibraryView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \LibraryExercise.name) private var entries: [LibraryExercise]
    @Query private var workouts: [WorkoutTemplate]
    @State private var search = ""
    @State private var pendingDelete: LibraryExercise?
    @State private var blockedDelete: LibraryExercise?
    @State private var naming = false
    @State private var newName = ""

    var body: some View {
        let shown = filtered
        List {
            ForEach(shown) { entry in
                NavigationLink(value: entry) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.name)
                        let usedIn = ExerciseLibrary.workouts(using: entry, in: workouts).map(\.name)
                        Text(usedIn.isEmpty ? "Not in the program" : usedIn.joined(separator: " · "))
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
                .accessibilityIdentifier("libraryRow-\(entry.name)")
            }
            .onDelete { offsets in
                guard let entry = offsets.first.map({ shown[$0] }) else { return }
                if ExerciseLibrary.workouts(using: entry, in: workouts).isEmpty {
                    pendingDelete = entry
                } else {
                    blockedDelete = entry
                }
            }
        }
        .overlay {
            if shown.isEmpty, !search.isEmpty {
                ContentUnavailableView.search(text: search)
            }
        }
        .searchable(text: $search, prompt: "Search exercises")
        .navigationTitle("Exercise Library")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("New Exercise", systemImage: "plus") {
                    newName = ""
                    naming = true
                }
                .accessibilityIdentifier("newLibraryExercise")
            }
        }
        .alert("New Exercise", isPresented: $naming) {
            TextField("Name", text: $newName)
            Button("Cancel", role: .cancel) {}
            Button("Add") {
                guard !newName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                _ = try? ExerciseLibrary.create(named: newName, context: context)
            }
        } message: {
            Text("Tap it afterwards to set its measure and default prescription.")
        }
        .confirmationDialog(
            "Delete \(pendingDelete?.name ?? "exercise")?",
            isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                if let pendingDelete { context.delete(pendingDelete) }
                pendingDelete = nil
            }
        } message: {
            Text("Logged history keeps it in History and Progress.")
        }
        .alert(
            "\(blockedDelete?.name ?? "This exercise") is in the program",
            isPresented: Binding(get: { blockedDelete != nil }, set: { if !$0 { blockedDelete = nil } })
        ) {
            Button("OK", role: .cancel) { blockedDelete = nil }
        } message: {
            let names = blockedDelete.map { ExerciseLibrary.workouts(using: $0, in: workouts).map(\.name) } ?? []
            Text("Remove it from \(names.joined(separator: ", ")) first.")
        }
    }

    private var filtered: [LibraryExercise] {
        let query = search.trimmingCharacters(in: .whitespaces)
        guard !query.isEmpty else { return entries }
        return entries.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }
}

/// Edit a library exercise. Name, measure and per-side flow to every program slot using it;
/// the prescription here is only the default for newly added slots and session exercises.
struct LibraryEditView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \WorkoutTemplate.order) private var workouts: [WorkoutTemplate]
    @Query private var programExercises: [ExerciseTemplate]
    @Bindable var entry: LibraryExercise

    var body: some View {
        Form {
            Section("Exercise") {
                TextField("Name", text: $entry.name)
                    .accessibilityIdentifier("libraryName")
                Picker("Measure", selection: $entry.unit) {
                    ForEach(MeasureUnit.allCases) { Text($0.label).tag($0) }
                }
                Toggle("Each side (L&R)", isOn: $entry.perSide)
                TextField("Coaching cue", text: $entry.cue, axis: .vertical)
                TextField("Notes", text: $entry.notes, axis: .vertical)
            }
            Section {
                LabeledContent("Sets") {
                    TextField("e.g. 3-4", text: $entry.setsText).multilineTextAlignment(.trailing)
                }
                Stepper("Rows to start with: \(entry.plannedSets)", value: $entry.plannedSets, in: 1...10)
                LabeledContent(entry.unit == .seconds ? "Seconds" : "Reps") {
                    TextField("e.g. 8-12", text: $entry.targetText).multilineTextAlignment(.trailing)
                }
                LabeledContent("Rest") {
                    TextField("e.g. 1:30", text: $entry.restText).multilineTextAlignment(.trailing)
                }
                LabeledContent("Tempo") {
                    TextField("e.g. 30X1", text: $entry.tempo).multilineTextAlignment(.trailing)
                }
                LabeledContent("Rings") {
                    TextField("Height / length", text: $entry.ringSetting).multilineTextAlignment(.trailing)
                }
            } header: {
                Text("Default prescription")
            } footer: {
                Text("Used when this exercise is added to a workout or swapped into a session. Workouts that already have it keep their own prescription.")
            }
            let usedIn = ExerciseLibrary.workouts(using: entry, in: workouts)
            if !usedIn.isEmpty {
                Section("In the program") {
                    ForEach(usedIn) { workout in
                        Label {
                            Text(workout.name)
                        } icon: {
                            Image(systemName: "circle.fill").foregroundStyle(Theme.color(workout.colorName))
                        }
                    }
                }
            }
        }
        .navigationTitle(entry.name.isEmpty ? "Exercise" : entry.name)
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: entry.name) { sync() }
        .onChange(of: entry.unitRaw) { sync() }
        .onChange(of: entry.perSide) { sync() }
    }

    private func sync() { ExerciseLibrary.sync(entry, to: programExercises) }
}

/// Sheet for choosing a library exercise, with a shortcut to create one from the search text.
struct LibraryPicker: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \LibraryExercise.name) private var entries: [LibraryExercise]
    @State private var search = ""

    var title: String
    /// Hidden from the list, e.g. the exercise being swapped out.
    var excluding: UUID? = nil
    var onPick: (LibraryExercise) -> Void

    var body: some View {
        let query = search.trimmingCharacters(in: .whitespaces)
        let shown = entries.filter {
            $0.id != excluding && (query.isEmpty || $0.name.localizedCaseInsensitiveContains(query))
        }
        let exactMatch = entries.contains { PerformanceLookup.key(for: $0.name) == PerformanceLookup.key(for: query) }

        NavigationStack {
            List {
                if !query.isEmpty, !exactMatch {
                    Section {
                        Button {
                            if let created = try? ExerciseLibrary.create(named: query, context: context) {
                                pick(created)
                            }
                        } label: {
                            Label("New exercise “\(query)”", systemImage: "plus.circle.fill")
                        }
                        .accessibilityIdentifier("libraryPickerCreate")
                    } footer: {
                        Text("Adds it to the library. Edit its details in Program → Exercise Library.")
                    }
                }
                Section {
                    ForEach(shown) { entry in
                        Button { pick(entry) } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(entry.name)
                                let line = Format.prescription(sets: entry.setsText, target: entry.targetText,
                                                               unit: entry.unit, perSide: entry.perSide)
                                if !line.isEmpty {
                                    Text(line).font(.caption).foregroundStyle(.secondary)
                                }
                            }
                        }
                        .tint(.primary)
                        .accessibilityIdentifier("libraryPickerRow-\(entry.name)")
                    }
                }
            }
            .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search or create")
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func pick(_ entry: LibraryExercise) {
        onPick(entry)
        dismiss()
    }
}
