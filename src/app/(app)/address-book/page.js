"use client";

import { useEffect, useMemo, useState } from "react";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { useAuth } from "@/lib/auth/AuthProvider";
import { subscribeUsers } from "@/lib/db/users";
import { subscribeInvites } from "@/lib/db/invites";
import { useLegend } from "@/components/shell/AppShell";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { MemberFilters, EMPTY_FILTERS } from "@/components/address-book/MemberFilters";
import { AddressRegister, filterMembers } from "@/components/address-book/AddressRegister";
import { MemberDialog } from "@/components/address-book/MemberDialog";
import { MonoLabel, Stamp } from "@/components/sheet";
import { Button } from "@/components/ui/button";

export default function AddressBookPage() {
  const { members, loading, error } = useDirectory();
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (!isAdmin) return () => {};
    return subscribeUsers((items) => setUsers(items));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return () => {};
    return subscribeInvites((items) => setInvites(items));
  }, [isAdmin]);

  const claimedByMember = useMemo(
    () => new Map(users.filter((user) => user.memberId).map((user) => [user.memberId, user.uid])),
    [users]
  );

  const openInvites = useMemo(
    () => new Set(invites.filter((invite) => invite.status === "open").map((invite) => invite.memberId)),
    [invites]
  );

  const activeCount = [
    filters.query,
    filters.state,
    filters.district,
    filters.area,
    filters.pincode,
    filters.relation,
    filters.claimed !== "all" ? filters.claimed : ""
  ].filter(Boolean).length;

  const visibleCount = useMemo(
    () => filterMembers(members, filters, claimedByMember, isAdmin).length,
    [members, filters, claimedByMember, isAdmin]
  );

  const unclaimed = members.filter((member) => !claimedByMember.has(member.id)).length;

  useLegend(
    useMemo(() => {
      const items = [
        { term: "●", detail: "Claimed record" },
        { term: "○", detail: "Unclaimed" },
        { term: "◌", detail: "Invite sent, not yet opened" }
      ];
      if (filters.query) items.push({ term: "search", detail: `“${filters.query}”` });
      if (filters.pincode) items.push({ term: "PIN", detail: filters.pincode });
      if (filters.area) items.push({ term: "area", detail: filters.area });
      if (filters.relation) items.push({ term: "relation", detail: filters.relation });
      if (filters.claimed !== "all") items.push({ term: "claim", detail: filters.claimed });
      items.push({ term: `${visibleCount}/${members.length}`, detail: "records after filters" });
      return items;
    }, [filters, visibleCount, members.length])
  );

  return (
    <div>
      <SheetHeader
        eyebrow={
          <>
            Register
            <span aria-hidden="true"> · </span>
            {members.length} records
          </>
        }
        meta={
          isAdmin ? `${unclaimed} unclaimed · ${members.length - unclaimed} claimed` : "Live from the family"
        }
        title="The family register"
        description="Every name, home and number in one table. Search by anything you remember — a name, an area, a pincode, a phone number."
      />

      {error ? (
        <p role="alert" className="mb-4 border border-stamp/40 bg-stamp/5 px-3 py-2 text-xs leading-relaxed text-stamp">
          The register could not be read. If you are signed in, check that the Firestore rules are
          deployed and that this account is on the admin list.
        </p>
      ) : null}

      <MemberFilters
        filters={filters}
        setFilters={setFilters}
        members={members}
        activeCount={activeCount}
        showClaimStatus={isAdmin}
      />

      <div className="mt-5">
        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="h-10 animate-pulse border border-border bg-card" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="border border-dashed border-border bg-card px-6 py-10">
            <Stamp>Empty register</Stamp>
            <h2 className="mt-3 text-xl">No records yet</h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              {isAdmin
                ? "Add the first family member, then send them a one-time invite so they can keep their own address current."
                : "The admin has not added records yet. Check again after the family register is set up."}
            </p>
            {isAdmin ? (
              <Button className="mt-4" onClick={() => setAdding(true)}>
                Add the first member
              </Button>
            ) : null}
          </div>
        ) : (
          <AddressRegister
            members={members}
            filters={filters}
            claimedByMember={claimedByMember}
            openInvites={openInvites}
            isAdmin={isAdmin}
            onAdd={() => setAdding(true)}
          />
        )}
      </div>

      {!loading && members.length > 0 ? (
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <MonoLabel>Showing {visibleCount}</MonoLabel>
          {activeCount > 0 ? (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
            </Button>
          ) : null}
        </p>
      ) : null}

      <MemberDialog open={adding} onOpenChange={setAdding} member={null} onDone={() => setAdding(false)} />
    </div>
  );
}
