import { describe, expect, it } from "vitest";
import { placeRelatives, radiusFor, ringFor, RING_RADIUS } from "./circle";

const at = (id, latitude, longitude) => ({ id, name: id, latitude, longitude });
const centre = at("c", 13, 80);

describe("ringFor", () => {
  it("uses the smallest ring that contains the distance", () => {
    expect(ringFor(0)).toBe(5);
    expect(ringFor(5)).toBe(5);
    expect(ringFor(5.1)).toBe(10);
    expect(ringFor(25)).toBe(25);
    expect(ringFor(26)).toBe(50);
    expect(ringFor(500)).toBe(50);
  });
});

describe("radiusFor", () => {
  it("returns zero at the centre and the outer radius beyond 50 km", () => {
    expect(radiusFor(0)).toBe(0);
    expect(radiusFor(500)).toBe(RING_RADIUS[50]);
  });

  it("interpolates outward and stays inside the frame", () => {
    expect(radiusFor(3)).toBeLessThan(radiusFor(7));
    expect(radiusFor(25)).toBeCloseTo(RING_RADIUS[25]);
    expect(radiusFor(40)).toBeGreaterThan(RING_RADIUS[25]);
    expect(radiusFor(40)).toBeLessThan(RING_RADIUS[50]);
  });
});

describe("placeRelatives", () => {
  it("places north east and west relatives in the matching quadrant", () => {
    const placed = placeRelatives(centre, [
      at("n", 13.05, 80),
      at("e", 13, 80.05),
      at("w", 13, 79.95)
    ]);
    const byId = Object.fromEntries(placed.map((item) => [item.member.id, item]));

    expect(byId.n.y).toBeLessThan(0);
    expect(Math.abs(byId.n.x)).toBeLessThan(0.01);
    expect(byId.e.x).toBeGreaterThan(0);
    expect(Math.abs(byId.e.y)).toBeLessThan(0.01);
    expect(byId.w.x).toBeLessThan(0);
  });

  it("excludes the centre, unlocated members and anything past the range", () => {
    const placed = placeRelatives(centre, [
      centre,
      { id: "blank", name: "Blank" },
      at("far", 13, 80.6)
    ]);
    expect(placed).toEqual([]);
  });

  it("sorts nearest first and records the ring", () => {
    const placed = placeRelatives(centre, [
      at("near", 13.02, 80),
      at("middle", 13.1, 80),
      at("edge", 13.3, 80)
    ]);
    expect(placed.map((item) => item.member.id)).toEqual(["near", "middle", "edge"]);
    for (let i = 1; i < placed.length; i += 1) {
      expect(placed[i].km).toBeGreaterThanOrEqual(placed[i - 1].km);
    }
    expect(placed[0].ring).toBe(5);
  });
});
