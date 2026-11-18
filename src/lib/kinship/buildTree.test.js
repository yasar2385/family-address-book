import { describe, expect, it } from "vitest";
import { buildTree, childIdsFor, relationBetween } from "./buildTree";
import { mapLegacyRelation } from "./legacy";

const person = (id, name, dateOfBirth = "") => ({ id, name, dateOfBirth });

describe("buildTree", () => {
  const members = [
    person("a", "Aravind", "1940-01-01"),
    person("b", "Bhavani", "1944-01-01"),
    person("c", "Chitra", "1970-01-01"),
    person("d", "Devan", "1972-01-01"),
    person("e", "Ezhil", "1995-01-01")
  ];
  const relations = [
    { a: "a", b: "c", kind: "parent" },
    { a: "b", b: "c", kind: "parent" },
    { a: "a", b: "b", kind: "spouse" },
    { a: "c", b: "e", kind: "parent" },
    { a: "c", b: "d", kind: "sibling" }
  ];

  it("derives parents, children, spouse and sibling edges", () => {
    const tree = buildTree(members, relations);
    expect(tree.parentsOf.get("c")).toEqual(["a", "b"]);
    expect(tree.childrenOf.get("a")).toContain("c");
    expect(tree.spouseOf.get("a")).toBe("b");
    expect(tree.spouseOf.get("b")).toBe("a");
    expect(tree.siblingsOf.get("c")).toContain("d");
    expect(tree.siblingsOf.get("d")).toContain("c");
    expect(tree.depthOf.get("a")).toBe(0);
    expect(tree.depthOf.get("c")).toBe(1);
    expect(tree.depthOf.get("e")).toBe(2);
  });

  it("collapses a root couple and keeps parentless siblings as their own roots", () => {
    const tree = buildTree([...members, person("f", "Fathima")], relations);
    expect(tree.rootGroups).toEqual([["a", "b"], ["d"], ["f"]]);
  });

  it("renders a shared child once, anchored under its first parent", () => {
    const tree = buildTree(members, relations);
    expect(tree.anchor.get("c")).toBe("a");
    expect(childIdsFor(tree, "a")).toContain("c");
    expect(childIdsFor(tree, "b")).toContain("c");
    expect(childIdsFor(tree, "c")).toEqual(["e"]);
  });

  it("drops relations with missing endpoints, self loops and unknown kinds", () => {
    const tree = buildTree(members, [
      ...relations,
      { a: "a", b: "missing", kind: "parent" },
      { a: "a", b: "a", kind: "spouse" },
      { a: "a", b: "c", kind: "cousin" }
    ]);
    expect(tree.droppedRelations).toHaveLength(3);
    expect(tree.relations).toHaveLength(relations.length);
  });

  it("detects a cycle instead of recursing forever", () => {
    const tree = buildTree(
      [person("x", "X"), person("y", "Y")],
      [
        { a: "x", b: "y", kind: "parent" },
        { a: "y", b: "x", kind: "parent" }
      ]
    );
    expect(tree.cycles.length).toBeGreaterThan(0);
    for (const depth of tree.depthOf.values()) expect(Number.isFinite(depth)).toBe(true);
    expect(tree.rootGroups).toEqual([]);
  });

  it("labels relatives along short paths", () => {
    const tree = buildTree(members, relations);
    expect(relationBetween(tree, "a", "c")).toBe("child");
    expect(relationBetween(tree, "c", "a")).toBe("parent");
    expect(relationBetween(tree, "a", "e")).toBe("grandchild");
    expect(relationBetween(tree, "c", "d")).toBe("sibling");
    expect(relationBetween(tree, "a", "a")).toBe("self");
    expect(relationBetween(tree, "a", "missing")).toBeNull();
  });
});

describe("mapLegacyRelation", () => {
  it("maps Father and Mother to a parent edge", () => {
    expect(mapLegacyRelation({ member1Id: "a", member2Id: "b", relationType: "Father" })).toEqual({
      a: "a",
      b: "b",
      kind: "parent",
      label: "father"
    });
  });

  it("flags Son and Daughter because their direction is ambiguous", () => {
    expect(mapLegacyRelation({ member1Id: "a", member2Id: "b", relationType: "Daughter" })).toMatchObject({
      kind: "parent",
      needsReview: true
    });
  });

  it("maps Brother and Sister to one symmetric sibling edge", () => {
    expect(mapLegacyRelation({ member1Id: "a", member2Id: "b", relationType: "Sister" })).toMatchObject({
      kind: "sibling"
    });
  });

  it("ignores canonical edges, unknown types and incomplete pairs", () => {
    expect(mapLegacyRelation({ member1Id: "a", member2Id: "b", kind: "parent" })).toBeNull();
    expect(mapLegacyRelation({ member1Id: "a", member2Id: "b", relationType: "Uncle" })).toBeNull();
    expect(mapLegacyRelation({ member1Id: "a", relationType: "Father" })).toBeNull();
  });
});
