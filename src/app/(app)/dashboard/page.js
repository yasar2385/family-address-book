"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cake, MapPin, Network, Radio, UserRoundX } from "lucide-react";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { useAuth } from "@/lib/auth/AuthProvider";
import { subscribeNotifications } from "@/lib/db/notifications";
import { upcomingEvents } from "@/lib/reminders";
import { hasCoords } from "@/lib/geo";
import { timeAgo, formatMonthDay } from "@/lib/format";
import { useLegend } from "@/components/shell/AppShell";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { EmptyState, MonoLabel, SheetCard, Stamp, Stat } from "@/components/sheet";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/address-book/WhatsAppButton";

export default function DashboardPage() {
  const { members, relations, tree, loading } = useDirectory();
  const { status, isAdmin, memberId } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (status === "signedOut" || status === "loading" || status === "unclaimed") return () => {};
    return subscribeNotifications({ isAdmin, memberId }, setNotifications);
  }, [isAdmin, memberId, status]);

  const me = members.find((member) => member.id === memberId) || null;

  const stats = useMemo(() => {
    const pinned = members.filter(hasCoords).length;
    const homes = members.filter((member) => member.pincode).length;
    const districts = new Set(members.map((member) => member.district).filter(Boolean)).size;
    const review = relations.filter((relation) => relation.needsReview).length;
    return { pinned, homes, districts, review };
  }, [members, relations]);

  const events = useMemo(() => upcomingEvents(members, 30).slice(0, 5), [members]);
  const changes = notifications.filter((item) => item.link).slice(0, 5);

  useLegend(
    useMemo(
      () => [
        { term: `${members.length}`, detail: "people in the register" },
        { term: `${stats.homes}`, detail: "records with a pincode" },
        { term: `${stats.pinned}`, detail: "homes pinned on the map" },
        { term: "●", detail: "claimed — the person keeps it current" },
        { term: "○", detail: "unclaimed — invite not opened yet" }
      ],
      [members.length, stats.homes, stats.pinned]
    )
  );

  return (
    <div>
      <SheetHeader
        eyebrow={
          <>
            Overview
            <span aria-hidden="true"> · </span>
            live
          </>
        }
        meta={`${stats.districts} districts`}
        title="The family register"
        description="A survey sheet of the family: who lives where, who is near whom, and what changed this week."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/address-book">
              Open register <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="People" value={loading ? "—" : members.length} detail="including elders and children" />
        <Stat label="Homes recorded" value={loading ? "—" : stats.homes} detail="pincode on record" />
        <Stat label="Pinned" value={loading ? "—" : stats.pinned} detail="placed on the map" />
        <Stat
          label="Needs review"
          value={loading ? "—" : isAdmin ? stats.review : stats.districts}
          detail={isAdmin ? "legacy relationship edges" : "districts represented"}
        />
      </div>

      {isAdmin && (stats.review > 0 || members.length === 0) ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-stamp/40 bg-stamp/5 px-4 py-3">
          <Stamp>Admin</Stamp>
          <p className="text-xs text-ink">
            {members.length === 0
              ? "The register is empty. Add the family, or migrate the old records."
              : `${stats.review} imported relationship${stats.review === 1 ? "" : "s"} need a glance — the old app stored some in the reverse direction.`}
          </p>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link href={members.length === 0 ? "/admin/migrate" : "/admin"}>
              {members.length === 0 ? "Run migration" : "Review edges"}
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section aria-labelledby="upcoming-heading">
          <div className="flex items-baseline justify-between border-b border-border pb-2">
            <MonoLabel as="h2" id="upcoming-heading">
              Coming up · next 30 days
            </MonoLabel>
            <span className="mono-caption">{events.length} events</span>
          </div>
          {events.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Cake}
                title="No birthdays or anniversaries soon"
                body="Add dates of birth in a record to see them here every year."
              />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {events.map((event) => (
                <li key={`${event.member.id}-${event.type}`} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="w-14 shrink-0">
                    <p className="font-mono text-xs tabular-nums text-ink">{event.daysAway}d</p>
                    <p className="mono-caption">{formatMonthDay(event.date)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.member.name}</p>
                    <p className="text-xs text-ink-soft">
                      {event.type === "birthday" ? "Birthday" : "Wedding anniversary"}
                      {event.years > 0 ? ` · ${event.years}${event.type === "birthday" ? " years" : " years married"}` : ""}
                    </p>
                  </div>
                  <WhatsAppButton member={event.member} label="" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="changes-heading">
          <div className="flex items-baseline justify-between border-b border-border pb-2">
            <MonoLabel as="h2" id="changes-heading">
              Recently changed
            </MonoLabel>
            <Link href="/address-book" className="mono-caption hover:text-ink">
              Register →
            </Link>
          </div>
          {changes.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={UserRoundX}
                title="No address changes yet"
                body="When someone updates their address, it appears here and in the bell."
              />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {changes.map((item) => (
                <li key={item.id} className="py-3">
                  <Link href={item.link} className="group block">
                    <p className="text-sm font-medium group-hover:underline group-hover:underline-offset-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-ink-soft">{item.body}</p>
                    <p className="mono-caption mt-1">{timeAgo(item.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8" aria-labelledby="move-heading">
        <div className="border-b border-border pb-2">
          <MonoLabel as="h2" id="move-heading">
            Move through the register
          </MonoLabel>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MoveCard
            href="/circle"
            icon={Radio}
            title="Kinship circle"
            body="Who lives within 5, 10, 25 or 50 km of one person."
          />
          <MoveCard
            href="/map"
            icon={MapPin}
            title="Map"
            body="Every recorded home, from Chennai to Kochi."
          />
          <MoveCard
            href="/tree"
            icon={Network}
            title="Family tree"
            body="Generations, couples and siblings from the relationship edges."
          />
        </div>
      </section>

      {me ? (
        <SheetCard className="mt-6 flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0">
            <MonoLabel>Your record</MonoLabel>
            <p className="mt-0.5 font-display text-lg leading-tight">{me.name}</p>
            <p className="text-xs text-ink-soft">{me.pincode ? `Pincode ${me.pincode}` : "No address yet"}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/me">Update my address</Link>
            </Button>
            <WhatsAppButton member={me} />
          </div>
        </SheetCard>
      ) : null}

      {tree.cycles.length ? (
        <p className="mt-6 border border-stamp/40 bg-stamp/5 px-3 py-2 text-xs text-stamp">
          The relationship graph has a loop ({tree.cycles.length} node
          {tree.cycles.length === 1 ? "" : "s"}). The tree renders the rest, but an edge is probably
          reversed.
        </p>
      ) : null}
    </div>
  );
}

function MoveCard({ href, icon: Icon, title, body }) {
  return (
    <Link
      href={href}
      className="group border border-border bg-card p-4 transition-colors hover:border-ink/30 hover:bg-secondary/60"
    >
      <Icon className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      <p className="mt-2 font-display text-base group-hover:underline group-hover:underline-offset-2">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
    </Link>
  );
}
