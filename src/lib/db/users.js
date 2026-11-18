import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function subscribeUsers(callback) {
  return onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const users = snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }));
      callback(users, null);
    },
    (error) => callback([], error)
  );
}
