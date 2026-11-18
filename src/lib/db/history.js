import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function subscribeHistory(memberId, callback) {
  if (!memberId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, "familyMembers", memberId, "history"),
    orderBy("at", "desc"),
    limit(25)
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    () => callback([])
  );
}
