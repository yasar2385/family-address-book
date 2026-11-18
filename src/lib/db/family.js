import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toNumberOrNull } from "@/lib/format";

const TEXT_FIELDS = [
  "addressLine1",
  "addressLine2",
  "city",
  "district",
  "state",
  "pincode",
  "contactNumber",
  "whatsappNumber",
  "googleMapUrl"
];

export const ADDRESS_FIELDS = [...TEXT_FIELDS, "latitude", "longitude"];

export function emptyAddress() {
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    contactNumber: "",
    whatsappNumber: "",
    googleMapUrl: "",
    latitude: null,
    longitude: null
  };
}

export function addressFrom(member) {
  const address = emptyAddress();
  TEXT_FIELDS.forEach((field) => {
    address[field] = member?.[field] || "";
  });
  address.latitude = toNumberOrNull(member?.latitude);
  address.longitude = toNumberOrNull(member?.longitude);
  return address;
}

export function normalizeAddress(values = {}) {
  const address = emptyAddress();
  TEXT_FIELDS.forEach((field) => {
    address[field] = typeof values[field] === "string" ? values[field].trim() : values[field] || "";
  });
  address.latitude = toNumberOrNull(values.latitude);
  address.longitude = toNumberOrNull(values.longitude);
  return address;
}

export function diffAddress(before = {}, after = {}) {
  const changes = {};
  ADDRESS_FIELDS.forEach((field) => {
    const previous = before?.[field] ?? null;
    const next = after?.[field] ?? null;
    if (String(previous ?? "") !== String(next ?? "")) {
      changes[field] = { before: previous, after: next };
    }
  });
  return changes;
}

export function subscribeFamily(callback) {
  let rawMembers = null;
  let addressMap = new Map();
  let error = null;

  const emit = () => {
    if (rawMembers === null) return;
    const members = rawMembers.map((member) => {
      const stored = addressMap.get(member.id);
      return {
        ...member,
        ...(stored ? normalizeAddress(stored) : addressFrom(member)),
        hasAddressDoc: Boolean(stored),
        addressUpdatedAt: stored?.updatedAt || null
      };
    });
    callback({ members, loading: false, error });
  };

  const unsubscribeMembers = onSnapshot(
    collection(db, "familyMembers"),
    (snapshot) => {
      rawMembers = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      emit();
    },
    (snapshotError) => {
      error = snapshotError;
      rawMembers = [];
      emit();
    }
  );

  const unsubscribeAddresses = onSnapshot(
    collection(db, "addresses"),
    (snapshot) => {
      addressMap = new Map(snapshot.docs.map((item) => [item.id, item.data()]));
      emit();
    },
    () => {
      emit();
    }
  );

  return () => {
    unsubscribeMembers();
    unsubscribeAddresses();
  };
}

export async function createMember({ identity, address, actor }) {
  const memberRef = doc(collection(db, "familyMembers"));
  const batch = writeBatch(db);

  batch.set(memberRef, {
    name: identity.name?.trim() || "",
    nameTamil: identity.nameTamil?.trim() || "",
    spouseName: identity.spouseName?.trim() || "",
    relationLabel: identity.relationLabel?.trim() || "",
    dateOfBirth: identity.dateOfBirth || "",
    dateOfMarriage: identity.dateOfMarriage || "",
    isAlive: identity.isAlive !== false,
    dateOfDeath: identity.isAlive === false ? identity.dateOfDeath || "" : "",
    createdAt: serverTimestamp(),
    createdBy: actor?.uid || ""
  });

  batch.set(doc(db, "addresses", memberRef.id), {
    ...normalizeAddress(address),
    updatedAt: serverTimestamp(),
    updatedBy: actor?.uid || ""
  });

  await batch.commit();
  return memberRef.id;
}

export async function updateMember(memberId, identity) {
  await updateDoc(doc(db, "familyMembers", memberId), {
    name: identity.name?.trim() || "",
    nameTamil: identity.nameTamil?.trim() || "",
    spouseName: identity.spouseName?.trim() || "",
    relationLabel: identity.relationLabel?.trim() || "",
    dateOfBirth: identity.dateOfBirth || "",
    dateOfMarriage: identity.dateOfMarriage || "",
    isAlive: identity.isAlive !== false,
    dateOfDeath: identity.isAlive === false ? identity.dateOfDeath || "" : ""
  });
}

export async function saveAddress(memberId, values, actor = {}) {
  const clean = normalizeAddress(values);
  const batch = writeBatch(db);
  const changes = diffAddress(actor.before || {}, clean);

  batch.set(
    doc(db, "addresses", memberId),
    {
      ...clean,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid || ""
    },
    { merge: true }
  );

  if (Object.keys(changes).length) {
    batch.set(doc(collection(db, "familyMembers", memberId, "history")), {
      at: serverTimestamp(),
      by: actor.uid || "",
      byName: actor.name || "",
      changes
    });
  }

  if (actor.notify !== false) {
    const place = [clean.city, clean.district, clean.pincode].filter(Boolean).join(" · ");
    const base = {
      type: "address_change",
      title: `${actor.name || "A family member"} updated their address`,
      body: place || "Address updated",
      link: `/address-book?member=${memberId}`,
      actorId: actor.uid || "",
      actorName: actor.name || "",
      read: false,
      createdAt: serverTimestamp()
    };
    batch.set(doc(collection(db, "notifications")), { ...base, toMemberId: "family" });
    if (actor.role === "member") {
      batch.set(doc(collection(db, "notifications")), { ...base, toMemberId: "admin" });
    }
  }

  await batch.commit();
  return changes;
}

export async function deleteMemberDeep(memberId) {
  const refs = [
    doc(db, "familyMembers", memberId),
    doc(db, "addresses", memberId)
  ];

  const [asA, asB, access, history] = await Promise.all([
    getDocs(query(collection(db, "relations"), where("a", "==", memberId))),
    getDocs(query(collection(db, "relations"), where("b", "==", memberId))),
    getDocs(collection(db, "familyMembers", memberId, "access")),
    getDocs(collection(db, "familyMembers", memberId, "history"))
  ]);

  asA.docs.forEach((item) => refs.push(item.ref));
  asB.docs.forEach((item) => refs.push(item.ref));
  access.docs.forEach((item) => refs.push(item.ref));
  history.docs.forEach((item) => refs.push(item.ref));

  const unique = Array.from(new Map(refs.map((ref) => [ref.path, ref])).values());
  for (let index = 0; index < unique.length; index += 400) {
    const batch = writeBatch(db);
    unique.slice(index, index + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function fetchDirectoryOnce() {
  const [members, addresses, relations] = await Promise.all([
    getDocs(collection(db, "familyMembers")),
    getDocs(collection(db, "addresses")),
    getDocs(collection(db, "relations"))
  ]);
  return {
    members: members.docs.map((item) => ({ id: item.id, ...item.data() })),
    addresses: addresses.docs.map((item) => ({ id: item.id, ...item.data() })),
    relations: relations.docs.map((item) => ({ id: item.id, ...item.data() }))
  };
}
