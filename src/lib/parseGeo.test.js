import { describe, expect, it } from "vitest";
import { extractCoordinates, mapsLink } from "./parseGeo";

describe("extractCoordinates", () => {
  it("reads the @lat,lng viewport form", () => {
    expect(extractCoordinates("https://www.google.com/maps/@13.0012,80.2565,15z")).toEqual({
      latitude: 13.0012,
      longitude: 80.2565
    });
  });

  it("reads the !3d/!4d place form", () => {
    expect(
      extractCoordinates(
        "https://www.google.com/maps/place/Adyar/data=!4m2!3d13.0012!4d80.2565?entry=ttu"
      )
    ).toEqual({ latitude: 13.0012, longitude: 80.2565 });
  });

  it("reads q, query and destination parameters", () => {
    expect(extractCoordinates("https://maps.google.com/?q=9.9252,78.1198")).toEqual({
      latitude: 9.9252,
      longitude: 78.1198
    });
    expect(extractCoordinates("https://maps.google.com/?destination=-33.8688,151.2093")).toEqual({
      latitude: -33.8688,
      longitude: 151.2093
    });
  });

  it("accepts a bare coordinate pair", () => {
    expect(extractCoordinates(" 13.0012, 80.2565 ")).toEqual({
      latitude: 13.0012,
      longitude: 80.2565
    });
  });

  it("returns null for short links, missing values and out-of-range points", () => {
    expect(extractCoordinates("https://maps.app.goo.gl/abc123")).toBeNull();
    expect(extractCoordinates("")).toBeNull();
    expect(extractCoordinates(null)).toBeNull();
    expect(extractCoordinates("https://www.google.com/maps/@91.0012,80.2565,15z")).toBeNull();
    expect(extractCoordinates("https://www.google.com/maps/@13.0012,190.2565,15z")).toBeNull();
  });
});

describe("mapsLink", () => {
  it("builds a directions URL, including zero coordinates", () => {
    expect(mapsLink(13.0012, 80.2565)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=13.0012,80.2565"
    );
    expect(mapsLink(0, 0)).toContain("destination=0,0");
  });

  it("returns an empty string until both coordinates exist", () => {
    expect(mapsLink(null, 80.2565)).toBe("");
    expect(mapsLink(13.0012, "")).toBe("");
  });
});
