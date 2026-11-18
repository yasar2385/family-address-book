import { collection, deleteField, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchDirectoryOnce, normalizeAddress } from "./family";
import { mapLegacyRelation } from "@/lib/kinship/legacy";
import { relationId } from "./relations";

const LEGACY_ADDRESS_KEYS = [
  "addressLine1",
  "city",
  "district",
  "state",
  "pincode",
  "contactNumber",
  "whatsappNumber",
  "latitude",
  "longitude"
];

function hasLegacyAddress(member) {
  return LEGACY_ADDRESS_KEYS.some((key) => member[key] !== undefined && member[key] !== "");
}

export async function planMigration() {
  const { members, addresses, relations } = await fetchDirectoryOnce();
  const memberIds = new Set(members.map((member) => member.id));
  const addressIds = new Set(addresses.map((item) => item.id));
  const relationIds = new Set(relations.map((item) => item.id));
  const operations = [];
  const summary = {
    members: members.length,
    addressesToCreate: 0,
    childEdges: 0,
    legacyRelations: 0,
    unhandledRelations: 0,
    membersToClean: 0
  };

  members.forEach((member) => {
    if (!addressIds.has(member.id) && hasLegacyAddress(member)) {
      operations.push({
        type: "address",
        memberId: member.id,
        data: normalizeAddress(member)
      });
      summary.addressesToCreate += 1;
    }

    if (Array.isArray(member.children) && member.children.length) {
      member.children.forEach((childId) => {
        if (typeof childId !== "string" || !memberIds.has(childId) || childId === member.id) return;
        const id = relationId(member.id, childId, "parent");
        if (!relationIds.has(id)) {
          operations.push({
            type: "relation",
            id,
            data: {
              a: member.id,
              b: childId,
              kind: "parent",
              label: "child",
              createdBy: "migration",
              needsReview: true
            }
          });
          relationIds.add(id);
          summary.childEdges += 1;
        }
      });
      operations.push({ type: "cleanup", memberId: member.id });
      summary.membersToClean += 1;
    }
  });

  relations.forEach((relation) => {
    if (relation.kind) return;
    const mapped = mapLegacyRelation(relation);
    if (!mapped) {
      summary.unhandledRelations += 1;
      return;
    }
    operations.push({ type: "deleteRelation", id: relation.id });
    const newId = relationId(mapped.a, mapped.b, mapped.kind);
    if (!relationIds.has(newId)) {
      operations.push({
        type: "relation",
        id: newId,
        data: { ...mapped, createdBy: "migration" }
      });
      relationIds.add(newId);
    }
    summary.legacyRelations += 1;
  });

  return { operations, summary };
}

export async function runMigration(plan) {
  const operations = plan.operations;
  let written = 0;

  for (let index = 0; index < operations.length; index += 400) {
    const batch = writeBatch(db);
    operations.slice(index, index + 400).forEach((operation) => {
      if (operation.type === "address") {
        batch.set(doc(db, "addresses", operation.memberId), {
          ...operation.data,
          updatedAt: serverTimestamp(),
          updatedBy: "migration"
        });
      } else if (operation.type === "relation") {
        batch.set(doc(db, "relations", operation.id), {
          ...operation.data,
          createdAt: serverTimestamp()
        });
      } else if (operation.type === "deleteRelation") {
        batch.delete(doc(db, "relations", operation.id));
      } else if (operation.type === "cleanup") {
        batch.update(doc(db, "familyMembers", operation.memberId), { children: deleteField() });
      }
      written += 1;
    });
    await batch.commit();
  }

  return written;
}
