import { signInAnonymously } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const INVITE_DAYS = 7;

export class ClaimError extends Error {}

export function generateInviteCode() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return output;
}

export function joinUrl(code) {
  if (typeof window === "undefined") return `/join?code=${code}`;
  return `${window.location.origin}/join?code=${code}`;
}

export async function createInvite(member, admin) {
  const code = generateInviteCode();
  await setDoc(doc(db, "invites", code), {
    memberId: member.id,
    memberName: member.name || "Family member",
    status: "open",
    usedBy: null,
    usedAt: null,
    createdAt: serverTimestamp(),
    createdBy: admin?.uid || "",
    expiresAt: Timestamp.fromDate(new Date(Date.now() + INVITE_DAYS * 86400000))
  });
  return code;
}

export function subscribeInvites(callback) {
  return onSnapshot(
    collection(db, "invites"),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => ({ code: item.id, ...item.data() }))
        .sort((a, b) => String(b.code).localeCompare(String(a.code)));
      callback(items, null);
    },
    (error) => callback([], error)
  );
}

export async function revokeInvite(code) {
  await updateDoc(doc(db, "invites", code), { status: "revoked" });
}

export async function deleteInvite(code) {
  await deleteDoc(doc(db, "invites", code));
}

export async function getInvite(code) {
  const snapshot = await getDoc(doc(db, "invites", code));
  if (!snapshot.exists()) return null;
  return { code, ...snapshot.data() };
}

export async function claimMember(code) {
  let user = auth.currentUser;
  if (!user) {
    const credential = await signInAnonymously(auth);
    user = credential.user;
  }
  const uid = user.uid;

  return runTransaction(db, async (transaction) => {
    const inviteRef = doc(db, "invites", code);
    const inviteSnapshot = await transaction.get(inviteRef);
    if (!inviteSnapshot.exists()) {
      throw new ClaimError("This link is not valid. Ask for a new one.");
    }
    const invite = inviteSnapshot.data();
    if (invite.status !== "open") {
      throw new ClaimError("This link has already been used. Ask for a new one.");
    }
    if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
      throw new ClaimError("This link has expired. Ask for a new one.");
    }

    const memberId = invite.memberId;
    transaction.update(inviteRef, {
      status: "used",
      usedBy: uid,
      usedAt: serverTimestamp()
    });
    transaction.set(doc(db, "familyMembers", memberId, "access", uid), {
      uid,
      claimedAt: serverTimestamp(),
      code
    });
    transaction.set(doc(db, "users", uid), {
      memberId,
      role: "member",
      claimedAt: serverTimestamp()
    });
    transaction.set(doc(collection(db, "notifications")), {
      toMemberId: "admin",
      type: "member_claim",
      title: `${invite.memberName || "A relative"} claimed their record`,
      body: "A new device joined the register. Check the claimed devices list if this was not expected.",
      link: "/admin",
      actorId: uid,
      actorName: invite.memberName || "",
      read: false,
      createdAt: serverTimestamp()
    });

    return { memberId, memberName: invite.memberName };
  });
}
