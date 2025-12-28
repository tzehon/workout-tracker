import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { ProgramExercise, ExerciseLog } from "@/types";

describe("ExerciseCard", () => {
  const defaultExercise: ProgramExercise = {
    letter: "A1",
    name: "Ring Dip (Elbows in)",
    targetSets: "3-4",
    targetReps: "6-8",
    tempo: "30X1",
    rest: "2:00-3:00",
  };

  const defaultExerciseLog: ExerciseLog = {
    letter: "A1",
    exerciseName: "Ring Dip (Elbows in)",
    progression: { variant: "" },
    sets: [
      { setNumber: 1, reps: 0, completed: false },
      { setNumber: 2, reps: 0, completed: false },
      { setNumber: 3, reps: 0, completed: false },
    ],
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders exercise name and letter", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("Ring Dip (Elbows in)")).toBeInTheDocument();
  });

  it("renders target sets and reps", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Sets: 3-4")).toBeInTheDocument();
    expect(screen.getByText("Reps: 6-8")).toBeInTheDocument();
    expect(screen.getByText("Tempo: 30X1")).toBeInTheDocument();
    expect(screen.getByText("Rest: 2:00-3:00")).toBeInTheDocument();
  });

  it("renders all sets", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Set 1")).toBeInTheDocument();
    expect(screen.getByText("Set 2")).toBeInTheDocument();
    expect(screen.getByText("Set 3")).toBeInTheDocument();
  });

  it("shows Done badge when all sets are completed", () => {
    const completedLog: ExerciseLog = {
      ...defaultExerciseLog,
      sets: defaultExerciseLog.sets.map((s) => ({ ...s, completed: true })),
    };

    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={completedLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("does not show Done badge when not all sets are completed", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("can collapse and expand", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    // Initially expanded - sets are visible
    expect(screen.getByText("Set 1")).toBeInTheDocument();

    // Click collapse button (chevron)
    const buttons = screen.getAllByRole("button");
    const collapseButton = buttons.find(
      (btn) =>
        btn.querySelector("svg.lucide-chevron-up") ||
        btn.querySelector("svg.lucide-chevron-down")
    );
    fireEvent.click(collapseButton!);

    // Now collapsed - sets should not be visible
    expect(screen.queryByText("Set 1")).not.toBeInTheDocument();
  });

  it("shows collapsed summary when collapsed", () => {
    const logWithCompletedSets: ExerciseLog = {
      ...defaultExerciseLog,
      sets: [
        { setNumber: 1, reps: 6, completed: true },
        { setNumber: 2, reps: 5, completed: true },
        { setNumber: 3, reps: 0, completed: false },
      ],
    };

    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={logWithCompletedSets}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    // Collapse
    const buttons = screen.getAllByRole("button");
    const collapseButton = buttons.find(
      (btn) =>
        btn.querySelector("svg.lucide-chevron-up") ||
        btn.querySelector("svg.lucide-chevron-down")
    );
    fireEvent.click(collapseButton!);

    // Should show summary
    expect(screen.getByText("2/3 sets")).toBeInTheDocument();
  });

  it("adds a set when + button is clicked", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    // Find the + button near "Sets" label
    const plusButtons = screen.getAllByRole("button");
    const addSetButton = plusButtons.find((btn) => {
      const svg = btn.querySelector("svg.lucide-plus");
      // Make sure it's the set add button, not the rep increment button
      return svg && btn.className.includes("outline");
    });
    fireEvent.click(addSetButton!);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sets: expect.arrayContaining([
          expect.objectContaining({ setNumber: 4 }),
        ]),
      })
    );
  });

  it("removes a set when - button is clicked", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    // Find the - button near "Sets" label
    const buttons = screen.getAllByRole("button");
    const removeSetButton = buttons.find((btn) => btn.textContent === "-");
    fireEvent.click(removeSetButton!);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sets: expect.arrayContaining([]),
      })
    );
    expect(mockOnChange.mock.calls[0][0].sets).toHaveLength(2);
  });

  it("shows previous log when provided", () => {
    const previousLog: ExerciseLog = {
      ...defaultExerciseLog,
      progression: { variant: "Band assisted" },
      sets: [
        { setNumber: 1, reps: 6, completed: true },
        { setNumber: 2, reps: 6, completed: true },
      ],
    };

    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        previousLog={previousLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
        onCopyPrevious={() => {}}
      />
    );

    expect(screen.getByText(/Previous/)).toBeInTheDocument();
    expect(screen.getByText(/Band assisted/)).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("copies previous data when Copy button is clicked", () => {
    const previousLog: ExerciseLog = {
      ...defaultExerciseLog,
      progression: { variant: "Band assisted" },
      sets: [
        { setNumber: 1, reps: 6, completed: true },
        { setNumber: 2, reps: 6, completed: true },
      ],
    };

    const mockCopyPrevious = vi.fn();

    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        previousLog={previousLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
        onCopyPrevious={mockCopyPrevious}
      />
    );

    const copyButton = screen.getByText("Copy");
    fireEvent.click(copyButton);

    expect(mockCopyPrevious).toHaveBeenCalled();
  });

  it("shows notes toggle button", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Add notes")).toBeInTheDocument();
  });

  it("shows notes textarea when toggle is clicked", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    // Click "Add notes"
    fireEvent.click(screen.getByText("Add notes"));

    // Should show textarea
    expect(
      screen.getByPlaceholderText("Notes for this exercise...")
    ).toBeInTheDocument();

    // Button text should change
    expect(screen.getByText("Hide notes")).toBeInTheDocument();
  });

  it("updates variant when changed", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={["Band assisted", "Negatives only"]}
        onChange={mockOnChange}
      />
    );

    const variantInput = screen.getByPlaceholderText(
      "e.g., Band assisted, Full ROM"
    );
    fireEvent.change(variantInput, { target: { value: "Full ROM" } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        progression: expect.objectContaining({
          variant: "Full ROM",
        }),
      })
    );
  });

  it("updates ring height when changed", () => {
    render(
      <ExerciseCard
        exercise={defaultExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    const ringHeightInput = screen.getByPlaceholderText("e.g., 12, hip height");
    fireEvent.change(ringHeightInput, { target: { value: "10" } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        progression: expect.objectContaining({
          ringHeight: "10",
        }),
      })
    );
  });

  it("handles unilateral exercises", () => {
    const unilateralExercise: ProgramExercise = {
      ...defaultExercise,
      isUnilateral: true,
      targetReps: "6-8 L&R",
    };

    render(
      <ExerciseCard
        exercise={unilateralExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Reps: 6-8 L&R")).toBeInTheDocument();
  });

  it("handles timed exercises", () => {
    const timedExercise: ProgramExercise = {
      ...defaultExercise,
      isTimed: true,
      targetReps: "30-60s",
    };

    render(
      <ExerciseCard
        exercise={timedExercise}
        exerciseLog={defaultExerciseLog}
        variantSuggestions={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Reps: 30-60s")).toBeInTheDocument();
  });
});
