import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WeekCompleteDialog } from "@/components/dashboard/WeekCompleteDialog";

describe("WeekCompleteDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnAdvance = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Week completion (weeks 1-5)", () => {
    it("shows week completion message", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={3}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByText("Week 3 Complete!")).toBeInTheDocument();
      expect(screen.getByText(/Great work finishing all 4 sessions/)).toBeInTheDocument();
    });

    it("shows button to move to next week", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={3}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByRole("button", { name: /Move to Week 4/i })).toBeInTheDocument();
    });

    it("calls onAdvance with next week when clicking advance", async () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={3}
          onAdvance={mockOnAdvance}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Move to Week 4/i }));

      await waitFor(() => {
        expect(mockOnAdvance).toHaveBeenCalledWith(1, 4);
      });
    });

    it("can dismiss dialog without advancing", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={3}
          onAdvance={mockOnAdvance}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Not yet/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnAdvance).not.toHaveBeenCalled();
    });
  });

  describe("Phase completion (week 6)", () => {
    it("shows phase completion message", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByText(/Phase 1: Foundation Complete!/)).toBeInTheDocument();
      expect(screen.getByText(/Congratulations on finishing the deload week/)).toBeInTheDocument();
    });

    it("shows option to start next phase", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByRole("button", { name: /Start Phase 2: Development/i })).toBeInTheDocument();
    });

    it("shows option to repeat current phase", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByRole("button", { name: /Repeat Phase 1/i })).toBeInTheDocument();
    });

    it("calls onAdvance to start next phase", async () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Start Phase 2/i }));

      await waitFor(() => {
        expect(mockOnAdvance).toHaveBeenCalledWith(2, 1);
      });
    });

    it("calls onAdvance to repeat current phase", async () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Repeat Phase 1/i }));

      await waitFor(() => {
        expect(mockOnAdvance).toHaveBeenCalledWith(1, 1);
      });
    });

    it("shows correct next phase for Phase 2 completion", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={2}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByText(/Phase 2: Development Complete!/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Start Phase 3: Peak Performance/i })).toBeInTheDocument();
    });
  });

  describe("Program completion (Phase 3 Week 6)", () => {
    it("shows program completion message", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={3}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByText("Program Complete!")).toBeInTheDocument();
      expect(screen.getByText(/completed the entire 18-week program/)).toBeInTheDocument();
    });

    it("shows option to start over", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={3}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.getByRole("button", { name: /Start Over from Phase 1/i })).toBeInTheDocument();
    });

    it("calls onAdvance to restart program", async () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={3}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Start Over from Phase 1/i }));

      await waitFor(() => {
        expect(mockOnAdvance).toHaveBeenCalledWith(1, 1);
      });
    });

    it("can close dialog without restarting", () => {
      render(
        <WeekCompleteDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          currentPhase={3}
          currentWeek={6}
          onAdvance={mockOnAdvance}
        />
      );

      // Find the Close button in the dialog footer (not the X button)
      const closeButton = screen.getAllByRole("button", { name: /Close/i })[0];
      fireEvent.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnAdvance).not.toHaveBeenCalled();
    });
  });

  describe("Dialog visibility", () => {
    it("does not render when open is false", () => {
      render(
        <WeekCompleteDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          currentPhase={1}
          currentWeek={1}
          onAdvance={mockOnAdvance}
        />
      );

      expect(screen.queryByText(/Complete!/)).not.toBeInTheDocument();
    });
  });
});
