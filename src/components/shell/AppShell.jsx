"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell, AccountMenu } from "./NotificationBell";
import { NavRail } from "./NavRail";
import { MemberGate } from "./MemberGate";
import { MonoLabel } from "@/components/sheet";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LegendContext = createContext(null);

const DEFAULT_LEGEND = [
  { term: "●", detail: "Claimed record — the person keeps it current" },
  { term: "○", detail: "Unclaimed — no one has opened the invite yet" },
  { term: "◫", detail: "Vermilion stamp marks something needing attention" },
  { term: "5 · 10 · 25 · 50", detail: "Kilometre rings in the kinship circle" }
];

export function useLegend(items) {
  const setLegend = useContext(LegendContext);
  const serialized = JSON.stringify(items);

  useEffect(() => {
    if (!setLegend) return;
    setLegend(items || []);
    return () => setLegend(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setLegend]);
}

export function AppShell({ children }) {
  const [legend, setLegend] = useState(null);
  const items = legend && legend.length ? legend : DEFAULT_LEGEND;
  const pathname = usePathname();
  const contextValue = useMemo(() => setLegend, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <LegendContext.Provider value={contextValue}>
      <div className="min-h-screen bg-paper">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-xs focus:text-sheet"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
          <div className="flex h-12 items-center gap-3 px-4 md:px-5">
            <Link href="/dashboard" className="flex items-baseline gap-2.5">
              <span className="font-display text-base font-semibold tracking-tight">Kudumbam</span>
              <span className="mono-caption hidden sm:inline">Family register</span>
            </Link>
            <div className="ml-auto flex items-center gap-0.5">
              <NotificationBell />
              <AccountMenu />
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-[1680px] grid-cols-1 md:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_15rem]">
          <NavRail />
          <main id="main" className="min-w-0 px-4 py-6 md:px-8 md:py-8">
            <MemberGate>{children}</MemberGate>
          </main>
          <aside className="hidden border-l border-border xl:block">
            <div className="sticky top-12 px-5 py-8">
              <MonoLabel>Legend</MonoLabel>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={`${item.term}-${item.detail}`} className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <span className="font-mono text-[11px] leading-snug text-ink">{item.term}</span>
                    <span className="text-xs leading-snug text-ink-soft">{item.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-border pt-4">
                <MonoLabel>Invites</MonoLabel>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  Each record has its own one-time link. The person who opens it can keep that
                  address current — nobody else can.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </LegendContext.Provider>
  );
}
