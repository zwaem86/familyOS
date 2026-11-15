import { describe, expect, it } from "vitest";
import {
  monthDates,
  shiftDate,
  shiftMonth,
  weekDates,
} from "../../src/features/calendar/demo-calendar";
describe("Demo calendar navigation", () => {
  it("starts weeks on Monday across year boundaries", () => {
    expect(weekDates("2027-01-01")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });
  it("covers leap February in complete weeks", () => {
    const dates = monthDates("2028-02-15");
    expect(dates).toContain("2028-02-29");
    expect(dates.length % 7).toBe(0);
    expect(dates[0]).toBe("2028-01-31");
  });
  it("navigates month ends without skipping a month", () => {
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-01");
  });
  it("keeps date navigation stable at Berlin DST changes", () => {
    expect(shiftDate("2026-03-28", 1)).toBe("2026-03-29");
    expect(shiftDate("2026-10-25", 1)).toBe("2026-10-26");
  });
});
