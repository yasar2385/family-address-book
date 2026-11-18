import { describe, expect, it } from "vitest";
import { filterMembers } from "./filters";

const EMPTY = {
  query: "",
  state: "",
  district: "",
  area: "",
  pincode: "",
  relation: "",
  claimed: "all"
};

const members = [
  {
    id: "venkat",
    name: "R. Venkatraman",
    nameTamil: "ரா. வெங்கட்ராமன்",
    spouseName: "Lakshmi",
    relationLabel: "Mama",
    city: "Adyar",
    district: "Chennai",
    state: "Tamil Nadu",
    pincode: "600020",
    contactNumber: "+919876543210",
    whatsappNumber: ""
  },
  {
    id: "meena",
    name: "S. Meena",
    nameTamil: "",
    spouseName: "",
    relationLabel: "Chithi",
    city: "Kochi",
    district: "Ernakulam",
    state: "Kerala",
    pincode: "682001",
    contactNumber: "+914840000000",
    whatsappNumber: ""
  },
  {
    id: "madurai",
    name: "K. Murugan",
    relationLabel: "",
    city: "Madurai",
    district: "Madurai",
    state: "Tamil Nadu",
    pincode: "625001",
    contactNumber: "",
    whatsappNumber: ""
  }
];

const claimed = new Map([["venkat", "uid-1"]]);
const run = (filters, options = {}) =>
  filterMembers(members, { ...EMPTY, ...filters }, claimed, options.showClaimStatus ?? true);

describe("filterMembers", () => {
  it("returns everyone for empty filters", () => {
    expect(run({}).map((member) => member.id)).toEqual(["venkat", "meena", "madurai"]);
  });

  it("searches name, Tamil name, spouse, area, and phone case-insensitively", () => {
    expect(run({ query: "VENKAT" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ query: "வெங்கட்" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ query: "lakshmi" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ query: "adyar" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ query: "98765" }).map((member) => member.id)).toEqual(["venkat"]);
  });

  it("trims the query before matching", () => {
    expect(run({ query: "  meena  " }).map((member) => member.id)).toEqual(["meena"]);
  });

  it("filters by state, district and area exactly", () => {
    expect(run({ state: "Kerala" }).map((member) => member.id)).toEqual(["meena"]);
    expect(run({ district: "Chennai" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ area: "Madurai" }).map((member) => member.id)).toEqual(["madurai"]);
  });

  it("prefix-matches pincodes", () => {
    expect(run({ pincode: "6000" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ pincode: "625001" }).map((member) => member.id)).toEqual(["madurai"]);
    expect(run({ pincode: "1" })).toEqual([]);
  });

  it("matches the relation label without case", () => {
    expect(run({ relation: "mama" }).map((member) => member.id)).toEqual(["venkat"]);
  });

  it("applies claim status only for admins", () => {
    expect(run({ claimed: "claimed" }).map((member) => member.id)).toEqual(["venkat"]);
    expect(run({ claimed: "unclaimed" }).map((member) => member.id)).toEqual(["meena", "madurai"]);
    expect(run({ claimed: "unclaimed" }, { showClaimStatus: false })).toHaveLength(3);
  });

  it("combines a query with a structural filter", () => {
    expect(run({ query: "madurai", state: "Tamil Nadu" }).map((member) => member.id)).toEqual([
      "madurai"
    ]);
    expect(run({ query: "madurai", state: "Kerala" })).toEqual([]);
  });
});
