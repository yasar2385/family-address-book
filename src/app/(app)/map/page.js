"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { hasCoords } from "@/lib/geo";
import { useLegend } from "@/components/shell/AppShell";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { MemberFilters, EMPTY_FILTERS } from "@/components/address-book/MemberFilters";
import { filterMembers } from "@/components/address-book/AddressRegister";
import { EmptyState, MonoLabel } from "@/components/sheet";

const RegisterMap = dynamic(() => import("./RegisterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center border border-border bg-card">
      <MonoLabel>Drawing the map</MonoLabel>
    </div>
  )
});

export default function MapPage() {
  const { members, loading } = useDirectory();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const visible = useMemo(
    () => filterMembers(members, filters, new Map(), false),
    [members, filters]
  );
  const pinned = visible.filter(hasCoords);
  const unpinned = visible.length - pinned.length;

  const activeCount = [
    filters.query,
    filters.state,
    filters.district,
    filters.area,
    filters.pincode,
    filters.relation
  ].filter(Boolean).length;

  useLegend(
    useMemo(
      () => [
        { term: "●", detail: "a home with a pincode" },
        { term: "○", detail: "pinned, but no pincode on the record" },
        { term: `${pinned.length}`, detail: "homes shown" },
        ...(unpinned ? [{ term: `${unpinned}`, detail: "records without coordinates" }] : []),
        ...(filters.pincode ? [{ term: "PIN", detail: filters.pincode }] : []),
        ...(activeCount ? [{ term: `${activeCount}`, detail: "active filters" }] : [])
      ],
      [pinned.length, unpinned, filters.pincode, activeCount]
    )
  );

  return (
    <div>
      <SheetHeader
        eyebrow="Map"
        meta={`${pinned.length} pinned homes`}
        title="Where the family lives"
        description="Paste a Google Maps link on a record to place its home here. Pins fit the visible family after filters."
      />

      <MemberFilters
        filters={filters}
        setFilters={setFilters}
        members={members}
        activeCount={activeCount}
        showClaimStatus={false}
      />

      <div className="mt-4 h-[65vh] min-h-[420px] border border-border">
        {loading ? (
          <div className="h-full animate-pulse bg-card" />
        ) : pinned.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              title="No pinned homes to show"
              body="Add a Maps link or use the location button while editing an address — the pin appears here."
            />
          </div>
        ) : (
          <RegisterMap members={pinned} />
        )}
      </div>

      <p className="mt-2 flex flex-wrap gap-x-4 text-[11px] text-ink-soft">
        <span>{pinned.length} of {visible.length} filtered records have coordinates.</span>
        {unpinned ? (
          <span>{unpinned} still need a Google Maps link.</span>
        ) : null}
      </p>
    </div>
  );
}
