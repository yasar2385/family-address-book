"use client";

import { ArrowUpDown, RotateCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DISTRICTS } from "@/lib/data/locations";
import { SORT_OPTIONS } from "@/lib/constants";
import { MonoLabel } from "@/components/sheet";

const SELECT =
  "h-9 w-full border border-input bg-transparent px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre";

export const EMPTY_FILTERS = {
  query: "",
  state: "",
  district: "",
  area: "",
  pincode: "",
  relation: "",
  claimed: "all",
  sort: "name",
  dir: "asc"
};

function Select({ label, value, onChange, options, anyLabel, id }) {
  return (
    <label htmlFor={id} className="block">
      <MonoLabel className="mb-1 block">{label}</MonoLabel>
      <select id={id} className={SELECT} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MemberFilters({ filters, setFilters, members, activeCount, showClaimStatus }) {
  const states = [...new Set(members.map((member) => member.state).filter(Boolean))].sort();
  const districts = [
    ...new Set([
      ...(filters.state ? DISTRICTS[filters.state] || [] : []),
      ...members.map((member) => member.district).filter(Boolean)
    ])
  ].sort();
  const areas = [...new Set(members.map((member) => member.city).filter(Boolean))].sort();
  const relations = [...new Set(members.map((member) => member.relationLabel).filter(Boolean))].sort();

  function set(field, value) {
    setFilters((current) => {
      const next = { ...current, [field]: value };
      if (field === "state") next.district = "";
      return next;
    });
  }

  const activeChips = [
    filters.query ? { field: "query", label: `“${filters.query}”` } : null,
    filters.state ? { field: "state", label: filters.state } : null,
    filters.district ? { field: "district", label: filters.district } : null,
    filters.area ? { field: "area", label: filters.area } : null,
    filters.pincode ? { field: "pincode", label: `PIN ${filters.pincode}` } : null,
    filters.relation ? { field: "relation", label: filters.relation } : null,
    filters.claimed !== "all" ? { field: "claimed", label: filters.claimed, reset: "all" } : null
  ].filter(Boolean);

  return (
    <section aria-label="Filters" className="border border-border bg-card">
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
        <label htmlFor="register-search" className="block sm:col-span-2 lg:col-span-1">
          <MonoLabel className="mb-1 block">Search</MonoLabel>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <Input
              id="register-search"
              value={filters.query}
              onChange={(event) => set("query", event.target.value)}
              placeholder="Name, area, pincode, phone…"
              className="pl-8"
            />
          </span>
        </label>

        <Select
          id="filter-state"
          label="State"
          value={filters.state}
          onChange={(value) => set("state", value)}
          options={states}
          anyLabel="Any state"
        />
        <Select
          id="filter-district"
          label="District"
          value={filters.district}
          onChange={(value) => set("district", value)}
          options={districts}
          anyLabel="Any district"
        />
        <Select
          id="filter-area"
          label="Area"
          value={filters.area}
          onChange={(value) => set("area", value)}
          options={areas}
          anyLabel="Any area"
        />
        <Select
          id="filter-relation"
          label="Relation"
          value={filters.relation}
          onChange={(value) => set("relation", value)}
          options={relations}
          anyLabel="Any relation"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border p-3">
        <label htmlFor="filter-pincode" className="block w-32">
          <MonoLabel className="mb-1 block">Pincode</MonoLabel>
          <Input
            id="filter-pincode"
            inputMode="numeric"
            maxLength={6}
            value={filters.pincode}
            onChange={(event) => set("pincode", event.target.value.replace(/\D/g, ""))}
            placeholder="600020"
            className="font-mono"
          />
        </label>

        {showClaimStatus ? (
          <label htmlFor="filter-claimed" className="block w-36">
            <MonoLabel className="mb-1 block">Claim</MonoLabel>
            <select
              id="filter-claimed"
              className={SELECT}
              value={filters.claimed}
              onChange={(event) => set("claimed", event.target.value)}
            >
              <option value="all">Everyone</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>
          </label>
        ) : null}

        <label htmlFor="filter-sort" className="block w-40">
          <MonoLabel className="mb-1 block">Sort</MonoLabel>
          <select
            id="filter-sort"
            className={SELECT}
            value={filters.sort}
            onChange={(event) => set("sort", event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set("dir", filters.dir === "asc" ? "desc" : "asc")}
          aria-label={`Sort ${filters.dir === "asc" ? "descending" : "ascending"}`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
          {filters.dir === "asc" ? "A–Z" : "Z–A"}
        </Button>

        {activeCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>

      {activeChips.length ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
          <MonoLabel className="mr-1">Filtering</MonoLabel>
          {activeChips.map((chip) => (
            <button
              key={chip.field}
              type="button"
              onClick={() => set(chip.field, chip.reset ?? "")}
              className="inline-flex items-center gap-1 border border-border bg-paper px-2 py-0.5 text-[11px] text-ink hover:border-ink/40"
            >
              {chip.label}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
