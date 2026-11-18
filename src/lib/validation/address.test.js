import { describe, expect, it } from "vitest";
import { addressSchema, identitySchema, parseAddress } from "./address";

const valid = {
  addressLine1: "12, Kutchery Road",
  addressLine2: "",
  city: "Adyar",
  district: "Chennai",
  state: "Tamil Nadu",
  pincode: "600020",
  contactNumber: "+919876543210",
  whatsappNumber: "",
  latitude: 13.0012,
  longitude: 80.2565,
  googleMapUrl: ""
};

describe("parseAddress", () => {
  it("accepts a complete address", () => {
    const result = parseAddress(valid);
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ city: "Adyar", pincode: "600020", latitude: 13.0012 });
  });

  it("fills defaults for optional fields", () => {
    const result = parseAddress({
      city: "Adyar",
      district: "Chennai",
      state: "Tamil Nadu",
      pincode: "600020"
    });
    expect(result.ok).toBe(true);
    expect(result.data.addressLine1).toBe("");
    expect(result.data.latitude).toBeNull();
    expect(result.data.longitude).toBeNull();
  });

  it("requires city, district and state", () => {
    const result = parseAddress({ ...valid, city: "", district: "", state: undefined });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(["city", "district", "state"]);
  });

  it("rejects pincodes that are not six digits", () => {
    for (const pincode of ["", "60002", "6000201", "60002a"]) {
      const result = parseAddress({ ...valid, pincode });
      expect(result.ok).toBe(false);
      expect(result.errors.pincode).toMatch(/6-digit pincode/);
    }
  });

  it("keeps the first message per field", () => {
    const result = parseAddress({ ...valid, city: "" });
    expect(result.errors.city).toBe("Add an area");
  });

  it("strips unknown keys from the parsed data", () => {
    const result = parseAddress({ ...valid, role: "admin" });
    expect(result.ok).toBe(true);
    expect(result.data).not.toHaveProperty("role");
  });
});

describe("addressSchema", () => {
  it("rejects addresses over the line length limit", () => {
    const result = addressSchema.safeParse({ ...valid, addressLine1: "x".repeat(141) });
    expect(result.success).toBe(false);
  });

  it("accepts null coordinates", () => {
    const result = addressSchema.safeParse({ ...valid, latitude: null, longitude: null });
    expect(result.success).toBe(true);
  });
});

describe("identitySchema", () => {
  it("requires a name and defaults the rest", () => {
    const result = identitySchema.safeParse({ name: "R. Venkatraman" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: "R. Venkatraman",
      nameTamil: "",
      relationLabel: "",
      isAlive: true
    });
  });

  it("rejects a blank name", () => {
    expect(identitySchema.safeParse({ name: "" }).success).toBe(false);
  });
});
