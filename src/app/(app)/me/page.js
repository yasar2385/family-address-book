"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { useAuth } from "@/lib/auth/AuthProvider";
import { saveAddress } from "@/lib/db/family";
import { subscribeHistory } from "@/lib/db/history";
import { useToast } from "@/components/hooks/use-toast";
import { distanceKm, compass, formatKm } from "@/lib/geo";

import { displayPhone } from "@/lib/phone";
import { tamilFor } from "@/lib/kinship/labels";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { EmptyState, MonoLabel, SheetCard, Stamp } from "@/components/sheet";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/address-book/AddressForm";
import { ChangeHistory } from "@/components/address-book/ChangeHistory";
import { WhatsAppButton } from "@/components/address-book/WhatsAppButton";
import { NotifyFamilyDialog } from "@/components/address-book/NotifyFamilyDialog";

export default function MePage() {
  const { memberId, isAdmin, user, status } = useAuth();
  const { members, loading } = useDirectory();
  const { toast } = useToast();
  const router = useRouter();
  const [history, setHistory] = useState([]);

  const member = members.find((item) => item.id === memberId) || null;
  const tamil = tamilFor(member?.relationLabel);

  useEffect(() => {
    if (isAdmin) router.replace("/address-book");
  }, [isAdmin, router]);

  useEffect(() => {
    if (!memberId) return () => {};
    return subscribeHistory(memberId, setHistory);
  }, [memberId]);

  const neighbours = useMemo(() => {
    if (!member) return [];
    return members
      .filter((item) => item.id !== member.id)
      .map((item) => {
        const km = distanceKm(member, item);
        return km === null ? null : { member: item, km, bearing: bearingOf(member, item) };
      })
      .filter(Boolean)
      .filter((item) => item.km <= 50)
      .sort((a, b) => a.km - b.km)
      .slice(0, 6);
  }, [member, members]);

  async function save(data, { notify }) {
    try {
      await saveAddress(member.id, data, {
        before: member,
        uid: user.uid,
        name: member.name,
        role: "member",
        notify
      });
      toast({
        title: "Address saved",
        description: notify ? "The family has been told." : "Saved without notifying the family."
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Address not saved",
        description: "Check your connection and try again."
      });
    }
  }

  if (isAdmin) return null;

  if (loading) {
    return <div className="h-64 animate-pulse border border-border bg-card" />;
  }

  if (!member) {
    return (
      <div>
        <SheetHeader eyebrow="My record" title="Record not found" />
        <EmptyState
          title="This account is not linked to a record"
          body="Ask an admin to send a fresh invite from your entry, then open it on this device."
          action={
            <Button asChild>
              <Link href="/join">Open invite link</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <SheetHeader
        eyebrow={
          <>
            My record
            <span aria-hidden="true"> · </span>
            {status === "member" ? "claimed" : status}
          </>
        }
        meta={member.relationLabel ? `${member.relationLabel}${tamil ? ` · ${tamil.ta}` : ""}` : "relation not set"}
        title={member.name}
        description="Only you can change this address. Every save is logged and the family is told once — no group chat required."
        actions={<WhatsAppButton member={member} addHref={`#${member.id}-contact`} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SheetCard className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Stamp>Address</Stamp>
            <span className="mono-caption">
              {member.pincode ? `PIN ${member.pincode}` : "no pincode yet"}
            </span>
            <span className="ml-auto font-mono text-[11px] text-ink-soft">
              {displayPhone(member.whatsappNumber || member.contactNumber)}
            </span>
          </div>
          <AddressForm member={member} onSave={save} submitLabel="Save my address" />
        </SheetCard>

        <div className="space-y-6">
          <section aria-labelledby="neighbours-heading">
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <MonoLabel as="h2" id="neighbours-heading">
                Family within 50 km
              </MonoLabel>
              <Link href={`/circle?member=${member.id}`} className="mono-caption hover:text-ink">
                Circle →
              </Link>
            </div>
            {!member.pincode ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Save a pincode and pin this home to see nearby relatives.
              </p>
            ) : neighbours.length === 0 ? (
              <p className="mt-3 border border-dashed border-border px-3 py-6 text-xs text-ink-soft">
                No relatives with pinned homes within 50 km yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border border-y border-border">
                {neighbours.map((item) => (
                  <li key={item.member.id} className="flex items-baseline gap-3 py-2">
                    <span className="w-14 shrink-0 font-mono text-xs tabular-nums">
                      {formatKm(item.km)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.member.name}</span>
                      <span className="block text-[11px] text-ink-soft">
                        {item.member.relationLabel || "relative"} · {item.bearing}
                      </span>
                    </span>
                    <WhatsAppButton member={item.member} label="" variant="ghost" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <SheetCard className="p-4">
            <MonoLabel>Share this address</MonoLabel>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Opens WhatsApp with the full address already typed. On a computer this is WhatsApp
              Web; on a phone it is the app. Nothing is sent until you press send.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <WhatsAppButton member={member} label="Send my address" />
              <NotifyFamilyDialog member={member} members={members} />
            </div>
          </SheetCard>

          <SheetCard className="p-4">
            <ChangeHistory entries={history} />
          </SheetCard>
        </div>
      </div>
    </div>
  );
}

function bearingOf(origin, target) {
  if (!origin || !target) return "—";
  const lat1 = (Number(origin.latitude) * Math.PI) / 180;
  const lat2 = (Number(target.latitude) * Math.PI) / 180;
  const dLng = ((Number(target.longitude) - Number(origin.longitude)) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return compass((Math.atan2(y, x) * 180) / Math.PI);
}
