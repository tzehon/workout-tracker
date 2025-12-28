import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDistanceToNow,
  formatDate,
  formatFullDate,
  getWeekNumber,
  getStartOfWeek,
  getEndOfWeek,
} from "@/lib/date-utils";

describe("formatDistanceToNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times less than a minute ago', () => {
    const date = new Date("2024-06-15T11:59:30Z");
    expect(formatDistanceToNow(date)).toBe("just now");
  });

  it("returns minutes ago for times less than an hour", () => {
    const date = new Date("2024-06-15T11:30:00Z");
    expect(formatDistanceToNow(date)).toBe("30m ago");
  });

  it("returns hours ago for times less than a day", () => {
    const date = new Date("2024-06-15T09:00:00Z");
    expect(formatDistanceToNow(date)).toBe("3h ago");
  });

  it('returns "yesterday" for times 1 day ago', () => {
    const date = new Date("2024-06-14T12:00:00Z");
    expect(formatDistanceToNow(date)).toBe("yesterday");
  });

  it("returns days ago for times less than a week", () => {
    const date = new Date("2024-06-12T12:00:00Z");
    expect(formatDistanceToNow(date)).toBe("3d ago");
  });

  it("returns weeks ago for times less than a month", () => {
    const date = new Date("2024-06-01T12:00:00Z");
    expect(formatDistanceToNow(date)).toBe("2w ago");
  });

  it("returns formatted date for older times", () => {
    const date = new Date("2024-05-01T12:00:00Z");
    const result = formatDistanceToNow(date);
    expect(result).toContain("May");
  });
});

describe("formatDate", () => {
  it("formats date with weekday, month, and day", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const result = formatDate(date);
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });
});

describe("formatFullDate", () => {
  it("formats date with full weekday, month, day, and year", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const result = formatFullDate(date);
    expect(result).toContain("June");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });
});

describe("getWeekNumber", () => {
  it("returns correct week number for start of year", () => {
    const date = new Date("2024-01-01");
    expect(getWeekNumber(date)).toBeGreaterThanOrEqual(1);
  });

  it("returns higher week numbers later in the year", () => {
    const early = new Date("2024-02-01");
    const late = new Date("2024-06-01");
    expect(getWeekNumber(late)).toBeGreaterThan(getWeekNumber(early));
  });
});

describe("getStartOfWeek", () => {
  it("returns Monday for a mid-week date", () => {
    const wednesday = new Date("2024-06-12T15:30:00"); // Wednesday
    const result = getStartOfWeek(wednesday);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(10); // June 10, 2024
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("returns same Monday for a Monday date", () => {
    const monday = new Date("2024-06-10T10:00:00"); // Monday
    const result = getStartOfWeek(monday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(10);
  });

  it("returns previous Monday for a Sunday", () => {
    const sunday = new Date("2024-06-16T10:00:00"); // Sunday
    const result = getStartOfWeek(sunday);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(10); // Previous Monday
  });
});

describe("getEndOfWeek", () => {
  it("returns Sunday end of day for a mid-week date", () => {
    const wednesday = new Date("2024-06-12T15:30:00"); // Wednesday
    const result = getEndOfWeek(wednesday);
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(16); // June 16, 2024
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
  });

  it("returns correct Sunday for a Monday", () => {
    const monday = new Date("2024-06-10T10:00:00"); // Monday
    const result = getEndOfWeek(monday);
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(16);
  });
});
