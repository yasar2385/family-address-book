import { describe, expect, it } from "vitest";
import { displayPhone, isValidPhone, normalizePhone, waNumber } from "./phone";

describe("normalizePhone", () => {
  it("accepts the common Indian formats", () => {
    expect(normalizePhone("9876543210")).toBe("+919876543210");
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("09876543210")).toBe("+919876543210");
    expect(normalizePhone("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhone("919876543210")).toBe("+919876543210");
  });

  it("rejects anything that is not a valid mobile number", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("5876543210")).toBeNull();
    expect(normalizePhone("98765432101")).toBeNull();
  });
});

describe("formatting helpers", () => {
  it("groups a number for display", () => {
    expect(displayPhone("9876543210")).toBe("+91 98765 43210");
    expect(displayPhone("")).toBe("—");
  });

  it("builds the wa.me digits without a plus", () => {
    expect(waNumber("9876543210")).toBe("919876543210");
    expect(waNumber("nope")).toBeNull();
  });

  it("reports validity", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("000")).toBe(false);
  });
});
