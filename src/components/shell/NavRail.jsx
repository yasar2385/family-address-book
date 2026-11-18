"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookUser, LayoutGrid, Map, Network, Radar, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/address-book", label: "Register", icon: BookUser },
  { href: "/circle", label: "Circle", icon: Radar },
  { href: "/map", label: "Map", icon: Map },
  { href: "/tree", label: "Tree", icon: Network },
  { href: "/me", label: "My record", icon: UserRound, memberOnly: true },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true }
];

export function NavRail() {
  const pathname = usePathname();
  const { isAdmin, status } = useAuth();
  const items = ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.memberOnly) return status === "member";
    return true;
  });

  return (
    <>
      <nav
        aria-label="Register sections"
        className="flex gap-1 overflow-x-auto border-b border-border bg-paper px-3 py-2 md:hidden"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                active ? "bg-ink text-sheet" : "text-ink-soft hover:bg-secondary hover:text-ink"
              )}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <aside className="hidden border-r border-border md:block">
        <div className="sticky top-12 px-3 py-6">
          <p className="mono-caption px-3">Sections</p>
          <ul className="mt-3 space-y-0.5">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-ochre bg-secondary font-medium text-ink"
                        : "border-transparent text-ink-soft hover:border-border hover:bg-secondary/60 hover:text-ink"
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
