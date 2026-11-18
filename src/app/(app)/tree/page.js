"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { useAuth } from "@/lib/auth/AuthProvider";
import { childIdsFor } from "@/lib/kinship/buildTree";
import { useLegend } from "@/components/shell/AppShell";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { EmptyState, MonoLabel, Stamp } from "@/components/sheet";
import { WhatsAppButton } from "@/components/address-book/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { formatAreaState } from "@/lib/format";

function buildForest(tree) {
  const visited = new Set();
  const nodes = new Map();

  function make(memberId) {
    if (visited.has(memberId)) return null;
    visited.add(memberId);
    const spouseId = tree.spouseOf.get(memberId);
    const spouse = spouseId && !visited.has(spouseId) ? spouseId : null;
    if (spouse) visited.add(spouse);
    const childIds = childIdsFor(tree, memberId).filter((childId) => !visited.has(childId));
    const children = childIds.map((childId) => make(childId)).filter(Boolean);
    const node = { id: memberId, spouseId: spouse, children };
    nodes.set(memberId, node);
    return node;
  }

  const roots = [];
  tree.rootGroups.forEach((group) => {
    group.forEach((memberId) => {
      const node = make(memberId);
      if (node) roots.push(node);
    });
  });
  [...tree.byId.keys()].forEach((memberId) => {
    const node = make(memberId);
    if (node) roots.push(node);
  });

  return { roots, nodes };
}

function PersonCard({ member, tree }) {
  const generation = (tree.depthOf.get(member.id) || 0) + 1;
  return (
    <div className="w-44 shrink-0 border border-border bg-card px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <span className="mono-caption shrink-0">G{generation}</span>
      </div>
      {member.nameTamil ? (
        <p lang="ta" className="truncate font-tamil text-[11px] text-ink-soft">
          {member.nameTamil}
        </p>
      ) : null}
      <p className="mt-1 text-[11px] text-ink-soft">{member.relationLabel || "—"}</p>
      <p className="truncate text-[11px] text-ink-soft">{formatAreaState(member)}</p>
      <p className="font-mono text-[10px] text-ink-soft">{member.pincode || "no pincode"}</p>
      <div className="-ml-2 mt-1">
        <WhatsAppButton member={member} variant="ghost" />
      </div>
    </div>
  );
}

function Branch({ node, tree }) {
  const member = tree.byId.get(node.id);
  const spouse = node.spouseId ? tree.byId.get(node.spouseId) : null;
  if (!member) return null;
  return (
    <li className="relative border-l border-border pl-4">
      <div className="flex items-center gap-2 py-2">
        <PersonCard member={member} tree={tree} />
        {spouse ? (
          <>
            <span aria-hidden="true" className="text-ink-soft">
              —
            </span>
            <PersonCard member={spouse} tree={tree} />
          </>
        ) : null}
      </div>
      {node.children.length ? (
        <ul className="ml-3 space-y-0 border-l border-dashed border-border pl-4">
          {node.children.map((child) => (
            <Branch key={child.id} node={child} tree={tree} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function TreePage() {
  const { tree, members, loading } = useDirectory();
  const { isAdmin } = useAuth();
  const forest = useMemo(() => buildForest(tree), [tree]);
  const review = tree.relations.filter((relation) => relation.needsReview).length;

  useLegend(
    useMemo(
      () => [
        { term: "G1 · G2", detail: "generation depth from the oldest known parents" },
        { term: "—", detail: "a married couple, shown side by side" },
        { term: "┈", detail: "dashed rule: siblings and cousins under one parent" },
        { term: `${tree.relations.length}`, detail: "relationship edges in use" },
        ...(tree.droppedRelations.length
          ? [{ term: `${tree.droppedRelations.length}`, detail: "edges ignored (missing member)" }]
          : []),
        ...(review ? [{ term: `${review}`, detail: "edges flagged for review" }] : [])
      ],
      [tree.relations.length, tree.droppedRelations.length, review]
    )
  );

  return (
    <div>
      <SheetHeader
        eyebrow="Family tree"
        meta={`${members.length} people · ${tree.relations.length} edges`}
        title="Generations"
        description="Built from relationship edges, not names. A couple shares one branch; children sit under the parent who anchors them."
        actions={
          isAdmin ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Review edges</Link>
            </Button>
          ) : null
        }
      />

      {loading ? (
        <div className="h-64 animate-pulse border border-border bg-card" />
      ) : members.length === 0 ? (
        <EmptyState
          title="No people yet"
          body="Add family members, then connect them as parent, spouse or sibling."
          action={
            isAdmin ? (
              <Button asChild>
                <Link href="/address-book">Add a member</Link>
              </Button>
            ) : null
          }
        />
      ) : tree.relations.length === 0 ? (
        <EmptyState
          title="No relationships recorded"
          body={
            isAdmin
              ? "Import the old relations, or add edges from the admin desk. Groups of people will render as separate roots until they are connected."
              : "The tree appears once relationships are recorded by an admin."
          }
          action={
            isAdmin ? (
              <Button asChild>
                <Link href="/admin/migrate">Run migration</Link>
              </Button>
            ) : null
          }
        />
      ) : null}

      {tree.cycles.length ? (
        <p className="mb-4 border border-stamp/40 bg-stamp/5 px-3 py-2 text-xs leading-relaxed text-stamp">
          A loop was found between {tree.cycles.length} record
          {tree.cycles.length === 1 ? "" : "s"}. The tree stops at the loop instead of crashing — an
          edge is probably stored in the reverse direction.
        </p>
      ) : null}

      {review ? (
        <p className="mb-4 flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2 text-xs text-ink-soft">
          <Stamp>Needs review</Stamp>
          {review} imported edge{review === 1 ? "" : "s"} came from the old Son/Daughter labels.
          {isAdmin ? (
            <Link href="/admin" className="ml-auto underline underline-offset-2 hover:text-ink">
              Check them
            </Link>
          ) : null}
        </p>
      ) : null}

      {members.length > 0 && tree.relations.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-paper">
          <div className="min-w-[560px] p-4">
            <MonoLabel className="mb-2 block">Oldest generation at the top</MonoLabel>
            <ul className="space-y-4">
              {forest.roots.map((root) => (
                <Branch key={root.id} node={root} tree={tree} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        Spouse and sibling edges are symmetric and stored once. A parent edge means the first
        person is the parent of the second.
      </p>
    </div>
  );
}
