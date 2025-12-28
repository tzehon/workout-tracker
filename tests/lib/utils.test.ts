import { describe, it, expect } from "vitest";
import { formatTime, parseRestTime, slugify, unslugify } from "@/lib/utils";

describe("formatTime", () => {
  it("formats 0 seconds as 0:00", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats seconds less than a minute", () => {
    expect(formatTime(30)).toBe("0:30");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(59)).toBe("0:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(125)).toBe("2:05");
  });

  it("formats longer durations", () => {
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(3661)).toBe("61:01");
  });
});

describe("parseRestTime", () => {
  it("parses MM:SS format correctly", () => {
    expect(parseRestTime("1:30")).toBe(90);
    expect(parseRestTime("2:00")).toBe(120);
    expect(parseRestTime("0:45")).toBe(45);
  });

  it("parses range format, taking the first value", () => {
    expect(parseRestTime("2:00-3:00")).toBe(120);
    expect(parseRestTime("1:30-2:30")).toBe(90);
  });

  it("returns default 90 seconds for invalid format", () => {
    expect(parseRestTime("invalid")).toBe(90);
    expect(parseRestTime("")).toBe(90);
    expect(parseRestTime("abc:def")).toBe(90);
  });
});

describe("slugify", () => {
  it("converts text to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces special characters with hyphens", () => {
    expect(slugify("Pull-Ups & Dips")).toBe("pull-ups-dips");
    expect(slugify("Ring Push-Ups (Advanced)")).toBe("ring-push-ups-advanced");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("!Hello World!")).toBe("hello-world");
    expect(slugify("  spaced  ")).toBe("spaced");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles consecutive special characters", () => {
    expect(slugify("one---two")).toBe("one-two");
    expect(slugify("a & b & c")).toBe("a-b-c");
  });
});

describe("unslugify", () => {
  it("converts slug back to title case", () => {
    expect(unslugify("hello-world")).toBe("Hello World");
  });

  it("handles single word", () => {
    expect(unslugify("hello")).toBe("Hello");
  });

  it("handles multiple hyphens", () => {
    expect(unslugify("ring-push-ups-advanced")).toBe("Ring Push Ups Advanced");
  });

  it("handles empty string", () => {
    expect(unslugify("")).toBe("");
  });
});
