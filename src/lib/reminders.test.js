import { describe, expect, it } from "vitest";
import { nextOccurrence, recentYears, upcomingEvents } from "./reminders";

const now = new Date(2026, 10, 18);

describe("nextOccurrence", () => {
  it("finds a date later this year", () => {
    const result = nextOccurrence("1990-11-20", now);
    expect(result.daysAway).toBe(2);
    expect(result.next.getFullYear()).toBe(2026);
  });

  it("treats today as day zero", () => {
    expect(nextOccurrence("1985-11-18", now).daysAway).toBe(0);
  });

  it("rolls a passed date to next year", () => {
    const result = nextOccurrence("1990-11-17", now);
    expect(result.next.getFullYear()).toBe(2027);
    expect(result.daysAway).toBe(364);
  });

  it("handles a year boundary", () => {
    const result = nextOccurrence("1990-01-02", new Date(2026, 11, 30));
    expect(result.daysAway).toBe(3);
    expect(result.next.getFullYear()).toBe(2027);
  });

  it("returns null for missing or malformed values", () => {
    expect(nextOccurrence("", now)).toBeNull();
    expect(nextOccurrence("not-a-date", now)).toBeNull();
    expect(nextOccurrence(undefined, now)).toBeNull();
  });
});

describe("upcomingEvents", () => {
  const member = {
    id: "venkat",
    name: "R. Venkatraman",
    isAlive: true,
    dateOfBirth: "1990-11-20",
    dateOfMarriage: "2015-11-25"
  };

  it("collects births and anniversaries inside the window", () => {
    const events = upcomingEvents([member], 30, now);
    expect(events.map((event) => event.type)).toEqual(["birthday", "anniversary"]);
    expect(events[0].years).toBe(36);
    expect(events[1].years).toBe(11);
  });

  it("skips deceased members", () => {
    expect(upcomingEvents([{ ...member, isAlive: false }], 30, now)).toEqual([]);
  });

  it("excludes events beyond the window", () => {
    expect(
      upcomingEvents([{ ...member, dateOfBirth: "1990-12-28", dateOfMarriage: "" }], 30, now)
    ).toEqual([]);
  });

  it("does not report a same-year marriage as an anniversary", () => {
    expect(upcomingEvents([{ ...member, dateOfMarriage: "2026-11-25" }], 30, now)).toEqual([
      expect.objectContaining({ type: "birthday" })
    ]);
  });

  it("sorts nearest first", () => {
    const other = { id: "meena", name: "S. Meena", isAlive: true, dateOfBirth: "1992-11-19" };
    const events = upcomingEvents([member, other], 30, now);
    expect(events[0].member.id).toBe("meena");
  });
});

describe("recentYears", () => {
  it("collects births and deaths within the last year", () => {
    const members = [
      { id: "new", isAlive: true, dateOfBirth: "2026-02-01" },
      { id: "old", isAlive: true, dateOfBirth: "1950-02-01" },
      { id: "gone", isAlive: false, dateOfDeath: "2026-06-01" }
    ];
    const { births, deaths } = recentYears(members, now);
    expect(births.map((entry) => entry.member.id)).toEqual(["new"]);
    expect(deaths.map((entry) => entry.member.id)).toEqual(["gone"]);
  });
});
