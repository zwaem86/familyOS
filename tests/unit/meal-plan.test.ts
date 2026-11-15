import { describe, expect, it } from "vitest";
import {
  normalizeDish,
  mealWeekLabel,
} from "../../src/features/meal-plan/meal-plan";
import {
  weekDates,
  shiftDate,
} from "../../src/features/calendar/demo-calendar";
describe("meal plan input", () => {
  it("trims names and allows an empty value to remove a meal", () => {
    expect(normalizeDish("  Lasagne  ")).toBe("Lasagne");
    expect(normalizeDish(" \n ")).toBe("");
  });
  it("limits the trimmed value, keeping invalid drafts available to the caller", () => {
    expect(normalizeDish(` ${"x".repeat(120)} `)).toHaveLength(120);
    expect(() => normalizeDish("x".repeat(121))).toThrow("120 Zeichen");
  });
});
describe("meal weeks use local date keys", () => {
  it("separates current and next weeks across New Year", () => {
    const current = weekDates("2026-12-31");
    const next = weekDates(shiftDate(current[0], 7));
    expect(current[0]).toBe("2026-12-28");
    expect(current[6]).toBe("2027-01-03");
    expect(next[0]).toBe("2027-01-04");
    expect(current.filter((day) => next.includes(day))).toEqual([]);
  });
  it.each(["2026-03-29", "2026-10-25"])(
    "keeps all seven days at DST boundary %s",
    (date) => {
      const days = weekDates(date);
      expect(days).toHaveLength(7);
      expect(new Set(days).size).toBe(7);
      expect(days[6]).toBe(date);
    },
  );
  it("labels the full week across month and year boundaries", () => {
    expect(mealWeekLabel("2026-12-31")).toBe(
      "28. Dezember 2026 – 3. Januar 2027",
    );
  });
});
