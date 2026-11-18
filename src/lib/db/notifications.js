import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/format";

export function subscribeNotifications({ isAdmin, memberId }, callback) {
  const base = collection(db, "notifications");
  let q;
  if (isAdmin) {
    q = query(base, where("toMemberId", "==", "admin"), orderBy("createdAt", "desc"), limit(30));
  } else if (memberId) {
    q = query(
      base,
      where("toMemberId", "in", [memberId, "family"]),
      orderBy("createdAt", "desc"),
      limit(30)
    );
  } else {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
      callback(items);
    },
    () => callback([])
  );
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

export async function announceToFamily({ title, body, link, actor }) {
  await addDoc(collection(db, "notifications"), {
    toMemberId: "family",
    type: "announcement",
    title,
    body,
    link: link || "",
    actorId: actor?.uid || "",
    actorName: actor?.name || "",
    read: false,
    createdAt: serverTimestamp()
  });
}
