"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasCoords, formatKm, compass } from "@/lib/geo";
import { initials } from "@/lib/format";
import { placeRelatives, RINGS, RING_RADIUS } from "@/lib/kinship/circle";
import { relationBetween } from "@/lib/kinship/buildTree";
import { useLegend } from "@/components/shell/AppShell";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { EmptyState, MonoLabel, SheetCard, Stamp } from "@/components/sheet";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/address-book/WhatsAppButton";

const SELECT =
  "h-9 w-full border border-input bg-transparent px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre";

function CircleInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { members, tree, loading } = useDirectory();
  const { memberId: viewerId, isAdmin } = useAuth();
  const [centreId, setCentreId] = useState(params.get("member") || "");
  const [maxKm, setMaxKm] = useState(50);
  const [relationFilter, setRelationFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (centreId && members.some((member) => member.id === centreId)) return;
    const fallback =
      (viewerId && members.some((member) => member.id === viewerId) ? viewerId : "") ||
      members.find(hasCoords)?.id ||
      members[0]?.id ||
      "";
    if (fallback) setCentreId(fallback);
  }, [members, viewerId, centreId]);

  const centre = members.find((member) => member.id === centreId) || null;
  const centroid = useMemo(() => {
    const located = members.filter(hasCoords);
    if (!located.length) return null;
    return {
      latitude: located.reduce((sum, member) => sum + Number(member.latitude), 0) / located.length,
      longitude: located.reduce((sum, member) => sum + Number(member.longitude), 0) / located.length
    };
  }, [members]);

  const placed = useMemo(() => {
    if (!centre) return [];
    const origin = hasCoords(centre) ? centre : centroid;
    if (!origin) return [];
    return placeRelatives(origin, members, { maxKm }).map((item) => ({
      ...item,
      relation: relationBetween(tree, centre.id, item.member.id) || item.member.relationLabel || "relative"
    }));
  }, [centre, members, maxKm, tree, centroid]);

  const relationOptions = useMemo(
    () => [...new Set(placed.map((item) => item.relation))].sort(),
    [placed]
  );

  const shown = relationFilter ? placed.filter((item) => item.relation === relationFilter) : placed;
  const selected = shown.find((item) => item.member.id === selectedId) || null;
  const unplaced = members.filter((member) => member.id !== centreId && !hasCoords(member)).length;

  useLegend(
    useMemo(
      () => [
        { term: "5 · 10 · 25 · 50", detail: "km rings, drawn to scale" },
        { term: "●", detail: "a relative with a pinned home" },
        { term: "↑", detail: "north is always up" },
        { term: `${shown.length}`, detail: "relatives inside the circle" },
        ...(relationFilter ? [{ term: "relation", detail: relationFilter }] : []),
        ...(unplaced ? [{ term: `${unplaced}`, detail: "records without coordinates" }] : [])
      ],
      [shown.length, relationFilter, unplaced]
    )
  );

  useEffect(() => {
    if (centreId) router.replace(`/circle?member=${centreId}`, { scroll: false });
  }, [centreId, router]);

  return (
    <div>
      <SheetHeader
        eyebrow="Kinship circle"
        meta={`${shown.length} relatives within ${maxKm} km`}
        title="Who is near whom"
        description="Pick a record. Each ring is a real distance; every dot sits at its true bearing from that home."
      />

      {loading ? (
        <div className="h-[420px] animate-pulse border border-border bg-card" />
      ) : members.length === 0 ? (
        <EmptyState
          title="The register is empty"
          body="Add a record with a pincode and a pinned location to start the circle."
          action={
            isAdmin ? (
              <Button asChild>
                <Link href="/address-book">Open register</Link>
              </Button>
            ) : null
          }
        />
      ) : !centre ? (
        <p className="text-sm text-ink-soft">Choose a record to centre the circle.</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="grid gap-3 border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-3">
              <label htmlFor="circle-centre" className="block lg:col-span-2">
                <MonoLabel className="mb-1 block">Centre of the circle</MonoLabel>
                <select
                  id="circle-centre"
                  className={SELECT}
                  value={centreId}
                  onChange={(event) => {
                    setCentreId(event.target.value);
                    setSelectedId("");
                  }}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {hasCoords(member) ? "" : " — no location"}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="circle-relation" className="block">
                <MonoLabel className="mb-1 block">Relation</MonoLabel>
                <select
                  id="circle-relation"
                  className={SELECT}
                  value={relationFilter}
                  onChange={(event) => setRelationFilter(event.target.value)}
                >
                  <option value="">All relatives</option>
                  {relationOptions.map((relation) => (
                    <option key={relation} value={relation}>
                      {relation}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="circle-range" className="block sm:col-span-2 lg:col-span-3">
                <MonoLabel className="mb-1 block">Within {maxKm} km</MonoLabel>
                <input
                  id="circle-range"
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={maxKm}
                  onChange={(event) => setMaxKm(Number(event.target.value))}
                  className="w-full accent-[hsl(var(--ochre))]"
                />
                <span className="mt-1 flex justify-between font-mono text-[10px] text-ink-soft">
                  <span>5 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </span>
              </label>
            </div>

            {!hasCoords(centre) ? (
              <p className="mt-3 border border-stamp/40 bg-stamp/5 px-3 py-2 text-xs text-stamp">
                {centre.name} has no coordinates. Distances are drawn from the average of all pinned
                homes. Paste a Maps link on the record for a true circle.
              </p>
            ) : null}

            <SheetCard className="mt-4 overflow-hidden">
              <svg
                viewBox="-1.1 -1.1 2.2 2.2"
                role="group"
                aria-label={`Kinship circle centred on ${centre.name}. ${shown.length} relatives within ${maxKm} kilometres.`}
                className="mx-auto block w-full max-w-[620px]"
              >
                <defs>
                  <radialGradient id="circle-paper" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--sheet))" />
                    <stop offset="100%" stopColor="hsl(var(--paper))" />
                  </radialGradient>
                </defs>
                <circle cx="0" cy="0" r="1" fill="url(#circle-paper)" stroke="hsl(var(--border))" strokeWidth="0.002" />

                {RINGS.map((ring, index) => (
                  <g key={ring}>
                    <circle
                      cx="0"
                      cy="0"
                      r={RING_RADIUS[ring]}
                      fill="none"
                      stroke="hsl(var(--ochre))"
                      strokeOpacity={index === 0 ? 0.55 : 0.32}
                      strokeWidth="0.0025"
                      strokeDasharray={index === 0 ? "none" : "0.012 0.01"}
                      pathLength="1"
                      className="ring-draw"
                      style={{ animationDelay: `${index * 90}ms` }}
                    />
                    <text
                      x="0.012"
                      y={-RING_RADIUS[ring] + 0.028}
                      fontSize="0.03"
                      fill="hsl(var(--ink-soft))"
                      fontFamily="var(--font-mono)"
                    >
                      {ring} km
                    </text>
                  </g>
                ))}

                {["N", "E", "S", "W"].map((direction, index) => {
                  const angle = (index * Math.PI) / 2;
                  return (
                    <text
                      key={direction}
                      x={Math.sin(angle) * 1.045}
                      y={-Math.cos(angle) * 1.045}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="0.03"
                      fill="hsl(var(--ink-soft))"
                      fontFamily="var(--font-mono)"
                    >
                      {direction}
                    </text>
                  );
                })}

                {shown.map((item) => (
                  <line
                    key={`beam-${item.member.id}`}
                    x1="0"
                    y1="0"
                    x2={item.x}
                    y2={item.y}
                    stroke="hsl(var(--ink))"
                    strokeOpacity={selectedId === item.member.id ? 0.35 : 0.12}
                    strokeWidth="0.0018"
                  />
                ))}

                <circle cx="0" cy="0" r="0.035" fill="hsl(var(--ink))" />
                <text
                  x="0"
                  y="0.075"
                  textAnchor="middle"
                  fontSize="0.032"
                  fill="hsl(var(--ink))"
                  fontFamily="var(--font-display)"
                  fontWeight="600"
                >
                  {centre.name}
                </text>

                {shown.map((item) => {
                  const active = selectedId === item.member.id;
                  return (
                    <g
                      key={item.member.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.member.name}, ${item.relation}, ${formatKm(item.km)} to the ${compass(item.bearing)}. Show details.`}
                      onClick={() => setSelectedId(item.member.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(item.member.id);
                        }
                      }}
                      className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[0.008]"
                    >
                      <circle
                        cx={item.x}
                        cy={item.y}
                        r={active ? 0.045 : 0.034}
                        fill={active ? "hsl(var(--stamp))" : "hsl(var(--sheet))"}
                        stroke={active ? "hsl(var(--stamp))" : "hsl(var(--ink))"}
                        strokeWidth="0.004"
                      />
                      <text
                        x={item.x}
                        y={item.y + 0.001}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="0.024"
                        fill={active ? "hsl(var(--sheet))" : "hsl(var(--ink))"}
                        fontFamily="var(--font-mono)"
                        pointerEvents="none"
                      >
                        {initials(item.member.name).slice(0, 2)}
                      </text>
                      <title>
                        {item.member.name} · {item.relation} · {formatKm(item.km)} {compass(item.bearing)}
                      </title>
                    </g>
                  );
                })}
              </svg>
              <p className="border-t border-border px-4 py-2 text-[11px] text-ink-soft">
                Centre: {centre.name}
                {hasCoords(centre) ? "" : " (average location)"} · drag the slider to widen the
                circle. Select a dot to see the person.
              </p>
            </SheetCard>

            {selected ? (
              <SheetCard className="mt-3 flex flex-wrap items-center gap-3 p-4">
                <div>
                  <Stamp>{selected.relation}</Stamp>
                  <p className="mt-1 font-display text-lg">{selected.member.name}</p>
                  <p className="text-xs text-ink-soft">
                    {formatKm(selected.km)} {compass(selected.bearing)} · {selected.member.pincode || "no pincode"}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <WhatsAppButton member={selected.member} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/address-book?member=${selected.member.id}`}>Open record</Link>
                  </Button>
                </div>
              </SheetCard>
            ) : null}
          </div>

          <section aria-labelledby="nearby-heading">
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <MonoLabel as="h2" id="nearby-heading">
                Nearest first
              </MonoLabel>
              <span className="mono-caption">{shown.length}</span>
            </div>
            {shown.length === 0 ? (
              <p className="mt-3 border border-dashed border-border px-3 py-6 text-xs leading-relaxed text-ink-soft">
                No relatives within {maxKm} km. Widen the slider, or add pinned locations to the
                records.
              </p>
            ) : (
              <ol className="mt-2 divide-y divide-border border-y border-border">
                {shown.map((item) => (
                  <li key={item.member.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.member.id)}
                      className="flex w-full items-baseline gap-3 py-2 text-left hover:bg-secondary/50"
                    >
                      <span className="w-14 shrink-0 font-mono text-xs tabular-nums">
                        {formatKm(item.km)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{item.member.name}</span>
                        <span className="block text-[11px] text-ink-soft">
                          {item.relation} · {item.member.city || item.member.district || "no area"}
                        </span>
                      </span>
                      <span className="mono-caption">{compass(item.bearing)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {unplaced ? (
              <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
                {unplaced} record{unplaced === 1 ? "" : "s"} without coordinates cannot be placed.
              </p>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

export default function CirclePage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <CircleInner />
    </Suspense>
  );
}
