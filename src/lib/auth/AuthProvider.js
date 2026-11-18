"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(null);

async function resolveRole(uid) {
  let isAdmin = false;
  try {
    isAdmin = (await getDoc(doc(db, "admins", uid))).exists();
  } catch {
    isAdmin = false;
  }
  if (isAdmin) return { status: "admin", isAdmin: true, memberId: null };

  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    if (snapshot.exists() && snapshot.data().memberId) {
      return { status: "member", isAdmin: false, memberId: snapshot.data().memberId };
    }
  } catch {
    // not claimed yet
  }
  return { status: "unclaimed", isAdmin: false, memberId: null };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: "loading",
    user: null,
    isAdmin: false,
    memberId: null
  });

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (!user) {
        setState({ status: "signedOut", user: null, isAdmin: false, memberId: null });
        return;
      }
      setState((previous) => ({ ...previous, user }));
      const resolved = await resolveRole(user.uid);
      if (!cancelled) setState({ ...resolved, user });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    const resolved = await resolveRole(user.uid);
    setState({ ...resolved, user });
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setState({ status: "signedOut", user: null, isAdmin: false, memberId: null });
  }, []);

  const value = useMemo(() => ({ ...state, refresh, signOut }), [state, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
