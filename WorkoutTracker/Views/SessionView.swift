import SwiftData
import SwiftUI

/// Logs a workout. Used both live (unfinished session) and to edit a past session from History.
struct SessionView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query private var allSessions: [WorkoutSession]
    @Bindable var session: WorkoutSession
    @FocusState private var focused: UUID?
    @State private var confirmDiscard = false
    @State private var confirmFinishEmpty = false
    @State private var deleteOnDisappear = false
    @State private var adding = false
    @State private var swapTarget: SessionExercise?
    @State private var confirmSwap: SessionExercise?
    @State private var confirmRemove: SessionExercise?

    var body: some View {
        List {
            if session.isImported {
                Section {
                    Label("Imported from the Progression column in Notion.", systemImage: "square.and.arrow.down")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            ForEach(session.sortedExercises) { exercise in
                ExerciseLogSection(
                    exercise: exercise,
                    last: PerformanceLookup.last(
                        exerciseTemplateID: exercise.exerciseTemplateID, libraryID: exercise.libraryID, name: exercise.name,
                        in: allSessions.filter { $0.startedAt < session.startedAt || !session.isFinished },
                        excluding: session.id
                    ),
                    tint: Theme.color(session.colorName),
                    focused: $focused,
                    onSwap: {
                        if exercise.loggedValues.isEmpty { swapTarget = exercise } else { confirmSwap = exercise }
                    },
                    onRemove: {
                        if exercise.loggedValues.isEmpty { remove(exercise) } else { confirmRemove = exercise }
                    }
                )
            }
            Section {
                Button("Add Exercise", systemImage: "plus") { adding = true }
                    .accessibilityIdentifier("addExerciseToSession")
            } footer: {
                Text("Adding, swapping or removing an exercise only changes this workout, not the program.")
            }
            Section("Workout notes") {
                TextField("How did it feel?", text: $session.note, axis: .vertical)
                    .focused($focused, equals: session.id)
            }
            if session.isFinished {
                Section {
                    DatePicker("Date", selection: $session.startedAt, displayedComponents: [.date])
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle(session.templateName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !session.isFinished {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Finish") {
                        if session.exercises.allSatisfy({ $0.loggedValues.isEmpty }) {
                            confirmFinishEmpty = true
                        } else {
                            finish()
                        }
                    }
                    .fontWeight(.semibold)
                    .accessibilityIdentifier("finishWorkout")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button(session.isFinished ? "Delete Workout" : "Discard Workout", systemImage: "trash", role: .destructive) {
                        confirmDiscard = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { focused = nil }
            }
        }
        .confirmationDialog(
            session.isFinished ? "Delete this workout from history?" : "Discard this workout?",
            isPresented: $confirmDiscard, titleVisibility: .visible
        ) {
            Button(session.isFinished ? "Delete" : "Discard", role: .destructive) {
                // Delete after the view is gone so nothing reads the deleted model mid-render.
                deleteOnDisappear = true
                dismiss()
            }
        }
        .onDisappear {
            if deleteOnDisappear { context.delete(session) }
        }
        .confirmationDialog("No sets logged yet. Finish anyway?", isPresented: $confirmFinishEmpty, titleVisibility: .visible) {
            Button("Finish Workout") { finish() }
        }
        .confirmationDialog(
            "Swap \(confirmSwap?.name ?? "exercise")?",
            isPresented: isPresent($confirmSwap), titleVisibility: .visible, presenting: confirmSwap
        ) { exercise in
            Button("Swap and Clear Sets", role: .destructive) { swapTarget = exercise }
        } message: { exercise in
            Text("The \(plural(exercise.loggedValues.count, "set")) logged for it will be cleared.")
        }
        .confirmationDialog(
            "Remove \(confirmRemove?.name ?? "exercise")?",
            isPresented: isPresent($confirmRemove), titleVisibility: .visible, presenting: confirmRemove
        ) { exercise in
            Button("Remove from Workout", role: .destructive) { remove(exercise) }
        } message: { exercise in
            Text("The \(plural(exercise.loggedValues.count, "set")) logged for it will be deleted.")
        }
        .sheet(item: $swapTarget) { exercise in
            LibraryPicker(title: "Swap \(exercise.name)", excluding: exercise.libraryID) {
                SessionFactory.swap(exercise, with: $0, context: context)
            }
        }
        .sheet(isPresented: $adding) {
            LibraryPicker(title: "Add Exercise") { SessionFactory.addExercise($0, to: session) }
        }
    }

    private func isPresent(_ item: Binding<SessionExercise?>) -> Binding<Bool> {
        Binding(get: { item.wrappedValue != nil }, set: { if !$0 { item.wrappedValue = nil } })
    }

    private func remove(_ exercise: SessionExercise) {
        focused = nil
        withAnimation { SessionFactory.removeExercise(exercise, from: session, context: context) }
    }

    private func finish() {
        focused = nil
        SessionFactory.finish(session)
        dismiss()
    }
}

private struct ExerciseLogSection: View {
    @Environment(\.modelContext) private var context
    @Bindable var exercise: SessionExercise
    var last: PastPerformance?
    var tint: Color
    var focused: FocusState<UUID?>.Binding
    var onSwap: () -> Void
    var onRemove: () -> Void

    var body: some View {
        Section {
            VStack(alignment: .leading, spacing: 4) {
                PrescriptionDetails(
                    sets: exercise.setsText, target: exercise.targetText, unit: exercise.unit,
                    perSide: exercise.perSide, rest: exercise.restText, tempo: exercise.tempo,
                    rings: "", cue: exercise.cue
                )
                if let last {
                    HStack {
                        Text("Last (\(last.date.shortDate)): \(Format.values(last.values, unit: last.unit))")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(tint)
                        Spacer()
                        if exercise.sortedSets.contains(where: { $0.value == nil }) {
                            Button("Use last") { fillFromLast(last.values) }
                                .font(.caption)
                                .buttonStyle(.borderless)
                        }
                    }
                }
            }

            ForEach(Array(exercise.sortedSets.enumerated()), id: \.element.id) { index, entry in
                SetRow(
                    entry: entry, index: index,
                    placeholder: last.flatMap { index < $0.values.count ? $0.values[index] : nil },
                    unitLabel: unitLabel,
                    focused: focused,
                    identifier: "setField-\(exercise.order)-\(index)"
                )
            }

            HStack {
                Button("Add set", systemImage: "plus") { SessionFactory.addSet(to: exercise) }
                Spacer()
                Button("Remove set", systemImage: "minus") {
                    SessionFactory.removeLastSet(from: exercise, context: context)
                }
                .disabled(exercise.sets.count <= 1)
            }
            .buttonStyle(.borderless)
            .font(.subheadline)

            LabeledContent("Rings") {
                TextField("Height / length", text: $exercise.ringSetting)
                    .multilineTextAlignment(.trailing)
                    .focused(focused, equals: exercise.id)
            }
            TextField("Note", text: $exercise.note, axis: .vertical)
                .font(.subheadline)
        } header: {
            HStack(spacing: 6) {
                if !exercise.groupLabel.isEmpty { Pill(text: exercise.groupLabel, color: tint) }
                Text(exercise.name)
                Spacer()
                Menu {
                    Button("Swap Exercise", systemImage: "arrow.left.arrow.right", action: onSwap)
                        .accessibilityIdentifier("swapExercise")
                    Button("Remove from Workout", systemImage: "trash", role: .destructive, action: onRemove)
                        .accessibilityIdentifier("removeExercise")
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.body)
                        .foregroundStyle(tint)
                        .frame(minWidth: 44, minHeight: 32, alignment: .trailing)
                }
                .accessibilityLabel("Options for \(exercise.name)")
                .accessibilityIdentifier("exerciseMenu-\(exercise.order)")
            }
            .font(.headline)
            .foregroundStyle(.primary)
            .textCase(nil)
        }
    }

    private var unitLabel: String {
        let base = exercise.unit == .seconds ? "sec" : "reps"
        return exercise.perSide ? "\(base)/side" : base
    }

    private func fillFromLast(_ values: [Int]) {
        for (index, entry) in exercise.sortedSets.enumerated() where entry.value == nil && index < values.count {
            entry.value = values[index]
        }
    }
}

private struct SetRow: View {
    @Bindable var entry: SetEntry
    var index: Int
    var placeholder: Int?
    var unitLabel: String
    var focused: FocusState<UUID?>.Binding
    var identifier: String

    var body: some View {
        HStack {
            Image(systemName: entry.value == nil ? "circle" : "checkmark.circle.fill")
                .foregroundStyle(entry.value == nil ? Color.secondary : Color.green)
            Text("Set \(index + 1)")
            Spacer()
            TextField(placeholder.map(String.init) ?? "–", text: text)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 70)
                .padding(.vertical, 4)
                .padding(.horizontal, 8)
                .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 8))
                .focused(focused, equals: entry.id)
                .accessibilityIdentifier(identifier)
            Text(unitLabel)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 64, alignment: .leading)
        }
    }

    /// String proxy so every keystroke is saved immediately (a formatted TextField only commits on return).
    private var text: Binding<String> {
        Binding(
            get: { entry.value.map(String.init) ?? "" },
            set: { newValue in entry.value = Int(String(newValue.filter(\.isNumber).prefix(4))) }
        )
    }
}
