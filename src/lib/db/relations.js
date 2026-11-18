import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function subscribeRelations(callback) {
  return onSnapshot(
    collection(db, "relations"),
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      callback(items, null);
    },
    (error) => callback([], error)
  );
}

export function relationId(a, b, kind) {
  if (kind === "parent") return `${a}_parent_${b}`;
  return `${[a, b].sort().join("_")}_${kind}`;
}

export async function saveRelationData({ a, b, kind, label, needsReview }, actor) {
  const id = relationId(a, b, kind);
  const payload = {
    a,
    b,
    kind,
    label: label || "",
    createdBy: actor?.uid || "",
    createdAt: serverTimestamp()
  };
  if (needsReview !== undefined) payload.needsReview = needsReview;
  await setDoc(doc(db, "relations", id), payload, { merge: true });
  return id;
}

export async function markRelationReviewed(id) {
  await updateDoc(doc(db, "relations", id), { needsReview: false });
}

export async function deleteRelation(id) {
  await deleteDoc(doc(db, "relations", id));
}

