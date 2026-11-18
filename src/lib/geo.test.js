import { describe, expect, it } from "vitest";
import { bearingDeg, compass, distanceKm, formatKm, hasCoords } from "./geo";

const chennai = { latitude: 13.0827, longitude: 80.2707 };
const bengaluru = { latitude: 12.9716, longitude: 77.5946 };
const north = { latitude: 13.5, longitude: 80.2707 };
const east = { latitude: 13.0827, longitude: 80.7 };

describe("hasCoords", () => {
  it("rejects missing, non-numeric and 0,0 coordinates", () => {
    expect(hasCoords(chennai)).toBe(true);
    expect(hasCoords({ latitude: "13.08", longitude: "80.27" })).toBe(true);
    expect(hasCoords(null)).toBe(false);
    expect(hasCoords({ latitude: 0, longitude: 0 })).toBe(false);
    expect(hasCoords({ latitude: "abc", longitude: 1 })).toBe(false);
  });
});

describe("distanceKm", () => {
  it("matches the known Chennai to Bengaluru distance", () => {
    const km = distanceKm(chennai, bengaluru);
    expect(km).toBeGreaterThan(280);
    expect(km).toBeLessThan(300);
  });

  it("is zero for the same point and null without coordinates", () => {
    expect(distanceKm(chennai, chennai)).toBe(0);
    expect(distanceKm(chennai, { latitude: null, longitude: null })).toBeNull();
  });
});

describe("bearingDeg", () => {
  it("points north at 0 and east at 90", () => {
    expect(bearingDeg(chennai, north)).toBeCloseTo(0, 0);
    expect(bearingDeg(chennai, east)).toBeCloseTo(90, 0);
  });
});

describe("compass", () => {
  it("maps bearings onto eight points", () => {
    expect(compass(0)).toBe("N");
    expect(compass(44)).toBe("NE");
    expect(compass(90)).toBe("E");
    expect(compass(180)).toBe("S");
    expect(compass(350)).toBe("N");
    expect(compass(null)).toBe("—");
  });
});

describe("formatKm", () => {
  it("keeps one decimal under ten and rounds above", () => {
    expect(formatKm(0.4)).toBe("<1 km");
    expect(formatKm(3)).toBe("3.0 km");
    expect(formatKm(12.4)).toBe("12 km");
    expect(formatKm(null)).toBe("—");
  });
});
