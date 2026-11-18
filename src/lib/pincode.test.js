import { afterEach, describe, expect, it, vi } from "vitest";
import dataset from "../../public/data/pincodes.json";
import { lookupPincode, validatePincode } from "./pincode";

const fixture = {
  pincodes: {
    "600020": { area: "Adyar", district: "Chennai", state: "Tamil Nadu" }
  }
};

describe("validatePincode", () => {
  it("requires six digits and no leading zero", () => {
    expect(validatePincode("600020")).toBe(true);
    expect(validatePincode(" 682001 ")).toBe(true);
    expect(validatePincode("012345")).toBe(false);
    expect(validatePincode("60002")).toBe(false);
    expect(validatePincode("6000200")).toBe(false);
    expect(validatePincode("")).toBe(false);
  });
});

describe("shipped pincode extract", () => {
  it("covers Tamil Nadu and Kerala with real rows", () => {
    expect(Object.keys(dataset.pincodes).length).toBeGreaterThan(3000);
    expect(dataset.pincodes["600020"]).toMatchObject({
      area: "Adyar",
      district: "Chennai",
      state: "Tamil Nadu"
    });
    expect(dataset.pincodes["682001"]).toMatchObject({ district: "Ernakulam", state: "Kerala" });
  });

  it("has no placeholder-only area lists", () => {
    for (const row of Object.values(dataset.pincodes)) {
      expect(row.area).not.toBe("NA");
      expect(row.areas).not.toContain("NA");
    }
  });
});

describe("lookupPincode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the fixture row through the lazy loader", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => fixture }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupPincode("600020")).resolves.toEqual(fixture.pincodes["600020"]);
    expect(fetchMock).toHaveBeenCalledWith("/data/pincodes.json");
  });

  it("returns null for an unknown pincode and skips fetch for invalid input", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupPincode("682001")).resolves.toBeNull();
    await expect(lookupPincode("12")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
