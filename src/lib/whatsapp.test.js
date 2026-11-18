import { describe, expect, it } from "vitest";
import { templates, waLink } from "./whatsapp";

const member = {
  name: "R. Venkatraman",
  addressLine1: "12 Kutchery Road",
  city: "Adyar",
  district: "Chennai",
  state: "Tamil Nadu",
  pincode: "600020",
  googleMapUrl: "https://maps.app.goo.gl/example"
};

describe("waLink", () => {
  it("encodes the message and uses wa.me digits", () => {
    expect(waLink("9876543210", "A & B")).toBe("https://wa.me/919876543210?text=A%20%26%20B");
  });

  it("omits the query when there is no text", () => {
    expect(waLink("9876543210")).toBe("https://wa.me/919876543210");
  });

  it("returns null for missing or invalid numbers", () => {
    expect(waLink(null, "hi")).toBeNull();
    expect(waLink("123", "hi")).toBeNull();
  });
});

describe("templates", () => {
  it("shareAddress includes the name, address and map link", () => {
    const text = templates.shareAddress(member);
    expect(text).toContain("R. Venkatraman's address");
    expect(text).toContain("12 Kutchery Road");
    expect(text).toContain("600020");
    expect(text).toContain(member.googleMapUrl);
  });

  it("requestUpdate includes the exact join link", () => {
    const text = templates.requestUpdate(member, "https://example.com/join?code=ABC");
    expect(text).toContain("Vanakkam R. Venkatraman");
    expect(text).toContain("https://example.com/join?code=ABC");
  });

  it("addressChanged names the member and the new address", () => {
    const text = templates.addressChanged(member);
    expect(text).toContain("updated their address");
    expect(text).toContain("Adyar");
  });
});
