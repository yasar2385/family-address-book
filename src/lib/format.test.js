import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatAddress,
  formatArea,
  formatAreaState,
  formatDate,
  initials,
  isAlive,
  timeAgo,
  toDate,
  toNumberOrNull
} from "./format";

afterEach(() => {
  vi.useRealTimers();
});

describe("toDate", () => {
  it("accepts Firestore timestamps, dates and ISO strings", () => {
    const date = new Date(2026, 10, 18);
    expect(toDate({ toDate: () => date })).toBe(date);
    expect(toDate(date)).toBe(date);
    expect(toDate(date.toISOString())?.getTime()).toBe(date.getTime());
  });

  it("returns null for missing or invalid values", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate("not-a-date")).toBeNull();
  });
});

describe("formatAddress", () => {
  it("joins the non-empty parts", () => {
    expect(
      formatAddress({
        addressLine1: "12 Kutchery Road",
        addressLine2: "",
        city: "Adyar",
        district: "Chennai",
        state: "Tamil Nadu",
        pincode: "600020"
      })
    ).toBe("12 Kutchery Road, Adyar, Chennai, Tamil Nadu, 600020");
  });

  it("falls back when nothing is set", () => {
    expect(formatAddress({})).toBe("No address yet");
    expect(formatAddress(null)).toBe("No address yet");
  });
});

describe("formatArea and formatAreaState", () => {
  it("prefers city and district, then state", () => {
    expect(formatArea({ city: "Adyar", district: "Chennai" })).toBe("Adyar, Chennai");
    expect(formatArea({ state: "Kerala" })).toBe("Kerala");
    expect(formatArea({})).toBe("No area");
  });

  it("renders area with state or a dash", () => {
    expect(formatAreaState({ city: "Kochi", district: "Ernakulam", state: "Kerala" })).toBe(
      "Kochi, Ernakulam, Kerala"
    );
    expect(formatAreaState(null)).toBe("—");
  });
});

describe("formatDate", () => {
  it("uses the Indian day-month-year style", () => {
    expect(formatDate(new Date(2026, 10, 18))).toBe("18 Nov 2026");
    expect(formatDate(null)).toBe("—");
  });
});

describe("timeAgo", () => {
  it("scales from just now to days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 12, 0, 0));
    const seconds = (n) => new Date(2026, 10, 18, 12, 0, 0).getTime() - n * 1000;
    expect(timeAgo(seconds(30))).toBe("just now");
    expect(timeAgo(seconds(300))).toBe("5m ago");
    expect(timeAgo(seconds(3 * 3600))).toBe("3h ago");
    expect(timeAgo(seconds(2 * 86400))).toBe("2d ago");
  });

  it("returns empty for missing values", () => {
    expect(timeAgo(null)).toBe("");
  });
});

describe("initials, isAlive and toNumberOrNull", () => {
  it("takes up to two initials", () => {
    expect(initials("R. Venkatraman")).toBe("RV");
    expect(initials("Meena")).toBe("M");
    expect(initials("")).toBe("?");
  });

  it("treats only an explicit false as deceased", () => {
    expect(isAlive({ isAlive: false })).toBe(false);
    expect(isAlive({})).toBe(true);
    expect(isAlive(null)).toBe(true);
  });

  it("coerces numeric strings and rejects blanks", () => {
    expect(toNumberOrNull("13.0012")).toBe(13.0012);
    expect(toNumberOrNull("0")).toBe(0);
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull("abc")).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
  });
});
