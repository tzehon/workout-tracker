import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SetInput } from "@/components/workout/SetInput";
import { SetLog } from "@/types";

describe("SetInput", () => {
  const defaultSet: SetLog = {
    setNumber: 1,
    reps: 0,
    completed: false,
  };

  const mockOnChange = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders set number correctly", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("Set 1")).toBeInTheDocument();
  });

  it("renders checkbox unchecked when set is not completed", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders checkbox checked when set is completed", () => {
    const completedSet: SetLog = { ...defaultSet, completed: true };

    render(
      <SetInput
        setNumber={1}
        set={completedSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onChange with completed=true when checkbox is clicked", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultSet,
      completed: true,
    });
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it("calls onChange with completed=false when checked checkbox is clicked", () => {
    const completedSet: SetLog = { ...defaultSet, completed: true };

    render(
      <SetInput
        setNumber={1}
        set={completedSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...completedSet,
      completed: false,
    });
    // onComplete should NOT be called when unchecking
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("increments reps when + button is clicked", () => {
    const setWithReps: SetLog = { ...defaultSet, reps: 5 };

    render(
      <SetInput
        setNumber={1}
        set={setWithReps}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const plusButtons = screen.getAllByRole("button");
    const plusButton = plusButtons.find((btn) =>
      btn.querySelector("svg.lucide-plus")
    );
    fireEvent.click(plusButton!);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...setWithReps,
      reps: 6,
    });
  });

  it("decrements reps when - button is clicked", () => {
    const setWithReps: SetLog = { ...defaultSet, reps: 5 };

    render(
      <SetInput
        setNumber={1}
        set={setWithReps}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const minusButtons = screen.getAllByRole("button");
    const minusButton = minusButtons.find((btn) =>
      btn.querySelector("svg.lucide-minus")
    );
    fireEvent.click(minusButton!);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...setWithReps,
      reps: 4,
    });
  });

  it("does not decrement reps below 0", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const minusButtons = screen.getAllByRole("button");
    const minusButton = minusButtons.find((btn) =>
      btn.querySelector("svg.lucide-minus")
    );
    fireEvent.click(minusButton!);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("updates reps when input value changes", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const repsInput = screen.getByRole("spinbutton");
    fireEvent.change(repsInput, { target: { value: "8" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultSet,
      reps: 8,
    });
  });

  it("renders time input for timed exercises", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        isTimed={true}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("seconds")).toBeInTheDocument();
  });

  it("renders L/R inputs for unilateral exercises", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        isUnilateral={true}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("updates left reps for unilateral exercises", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        isUnilateral={true}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "6" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultSet,
      repsLeft: 6,
    });
  });

  it("updates right reps for unilateral exercises", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        isUnilateral={true}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[1], { target: { value: "7" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultSet,
      repsRight: 7,
    });
  });

  it("shows notes input when note button is clicked", () => {
    render(
      <SetInput
        setNumber={1}
        set={defaultSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    // Initially no note input
    expect(
      screen.queryByPlaceholderText(/note for this set/i)
    ).not.toBeInTheDocument();

    // Click the note button (MessageSquare icon)
    const buttons = screen.getAllByRole("button");
    const noteButton = buttons.find((btn) =>
      btn.querySelector("svg.lucide-message-square")
    );
    fireEvent.click(noteButton!);

    // Now note input should be visible
    expect(
      screen.getByPlaceholderText(/note for this set/i)
    ).toBeInTheDocument();
  });

  it("updates notes when note input changes", () => {
    const setWithNotes: SetLog = { ...defaultSet, notes: "" };

    render(
      <SetInput
        setNumber={1}
        set={setWithNotes}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    // Click note button to show input
    const buttons = screen.getAllByRole("button");
    const noteButton = buttons.find((btn) =>
      btn.querySelector("svg.lucide-message-square")
    );
    fireEvent.click(noteButton!);

    // Type in the note input
    const noteInput = screen.getByPlaceholderText(/note for this set/i);
    fireEvent.change(noteInput, { target: { value: "2 partials" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...setWithNotes,
      notes: "2 partials",
    });
  });

  it("shows notes input automatically when set has existing notes", () => {
    const setWithNotes: SetLog = { ...defaultSet, notes: "Existing note" };

    render(
      <SetInput
        setNumber={1}
        set={setWithNotes}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    // Note input should be visible because set has notes
    expect(
      screen.getByPlaceholderText(/note for this set/i)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing note")).toBeInTheDocument();
  });

  it("applies success styling when completed", () => {
    const completedSet: SetLog = { ...defaultSet, completed: true };

    const { container } = render(
      <SetInput
        setNumber={1}
        set={completedSet}
        onChange={mockOnChange}
        onComplete={mockOnComplete}
      />
    );

    // Check that the container has success-related classes
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("border-success/50");
    expect(wrapper).toHaveClass("bg-success/10");
  });
});
