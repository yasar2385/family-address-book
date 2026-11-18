// Maps the pre-migration `relations` docs onto the canonical edge shape.
// Son/Daughter used both directions in the old UI, so they stay flagged.
export function mapLegacyRelation(relation) {
  if (!relation || relation.kind) return null;
  const { member1Id: a, member2Id: b, relationType } = relation;
  if (!a || !b) return null;
  const label = String(relationType || "").toLowerCase();

  if (relationType === "Father" || relationType === "Mother") {
    return { a, b, kind: "parent", label };
  }
  if (relationType === "Son" || relationType === "Daughter") {
    return { a, b, kind: "parent", label, needsReview: true };
  }
  if (relationType === "Brother" || relationType === "Sister") {
    return { a, b, kind: "sibling", label };
  }
  return null;
}
