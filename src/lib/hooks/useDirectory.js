"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeFamily } from "@/lib/db/family";
import { subscribeRelations } from "@/lib/db/relations";
import { buildTree } from "@/lib/kinship/buildTree";

export function useDirectory() {
  const [family, setFamily] = useState({ members: [], loading: true, error: null });
  const [relations, setRelations] = useState({ items: [], loading: true, error: null });

  useEffect(() => subscribeFamily(setFamily), []);

  useEffect(
    () =>
      subscribeRelations((items, error) => {
        setRelations({ items, loading: false, error });
      }),
    []
  );

  const tree = useMemo(
    () => buildTree(family.members, relations.items),
    [family.members, relations.items]
  );

  return {
    members: family.members,
    relations: relations.items,
    tree,
    loading: family.loading || relations.loading,
    error: family.error || relations.error
  };
}
