"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, MapPin, Pencil, Plus, Send, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { EmptyState, Hairline, MonoLabel, Stamp } from "@/components/sheet";
import { useToast } from "@/components/hooks/use-toast";
import { createInvite, joinUrl } from "@/lib/db/invites";
import { subscribeHistory } from "@/lib/db/history";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatAreaState, formatAddress, timeAgo, toDate } from "@/lib/format";
import { displayPhone } from "@/lib/phone";
import { templates, waLink } from "@/lib/whatsapp";
import { tamilFor } from "@/lib/kinship/labels";
import { filterMembers } from "@/lib/filters";
import { WhatsAppButton } from "./WhatsAppButton";
import { ChangeHistory } from "./ChangeHistory";
import { MemberDialog } from "./MemberDialog";

function sortMembers(members, { sort, dir }) {
  const factor = dir === "desc" ? -1 : 1;
  return [...members].sort((a, b) => {
    if (sort === "area") return factor * String(a.city || "").localeCompare(String(b.city || ""));
    if (sort === "pincode") return factor * String(a.pincode || "").localeCompare(String(b.pincode || ""));
    if (sort === "updated") {
      const left = toDate(a.addressUpdatedAt)?.getTime() || 0;
      const right = toDate(b.addressUpdatedAt)?.getTime() || 0;
      return factor * (left - right);
    }
    return factor * String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export { filterMembers };

function StatusDot({ claimed, invited }) {
  if (claimed) {
    return (
      <span className="inline-flex items-center gap-1.5" title="Claimed">
        <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
        <span className="sr-only">Claimed</span>
      </span>
    );
  }
  if (invited) {
    return (
      <span className="inline-flex items-center gap-1.5" title="Invite sent">
        <span className="h-1.5 w-1.5 rounded-full border border-stamp" aria-hidden="true" />
        <span className="sr-only">Invite sent</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5" title="Unclaimed">
      <span className="h-1.5 w-1.5 rounded-full border border-ink/40" aria-hidden="true" />
      <span className="sr-only">Unclaimed</span>
    </span>
  );
}

function MemberDetail({ member, open, onOpenChange, claimedByMember, isAdmin, onEdit }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [inviting, setInviting] = useState(false);
  const [history, setHistory] = useState([]);
  const claimed = claimedByMember.has(member?.id);
  const tamil = tamilFor(member?.relationLabel);

  useEffect(() => {
    setInviteCode("");
    if (!open || !isAdmin || !member?.id) {
      setHistory([]);
      return () => {};
    }
    return subscribeHistory(member.id, setHistory);
  }, [open, isAdmin, member?.id]);

  async function makeInvite() {
    setInviting(true);
    try {
      const code = await createInvite(member, user);
      setInviteCode(code);
      toast({ title: "Invite ready", description: "Send this link to the person on WhatsApp." });
    } catch {
      toast({ variant: "destructive", title: "Could not create an invite" });
    } finally {
      setInviting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl(inviteCode));
      toast({ title: "Link copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Select the link and copy it manually." });
    }
  }

  const link = inviteCode ? joinUrl(inviteCode) : "";
  const sendHref = inviteCode
    ? waLink(member?.whatsappNumber || member?.contactNumber, templates.sendJoinLink(member, link, "The family"))
    : null;

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Stamp>
              <StatusDot claimed={claimed} invited={false} />
              {claimed ? "Claimed" : "Unclaimed"}
            </Stamp>
            {member.relationLabel ? <Stamp tone="ink">{member.relationLabel}</Stamp> : null}
          </div>
          <DialogTitle className="mt-1 text-3xl">{member.name}</DialogTitle>
          {member.nameTamil ? (
            <p lang="ta" className="font-tamil text-sm text-ink-soft">
              {member.nameTamil}
            </p>
          ) : null}
          <DialogDescription>
            {formatAreaState(member)}
            {tamil ? ` · ${tamil.ta}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section>
            <MonoLabel as="h3" className="block">
              Address
            </MonoLabel>
            <p className="mt-1 text-sm leading-relaxed">{formatAddress(member)}</p>
            <p className="mono-caption mt-1">
              {member.pincode || "No pincode"}
              {member.addressUpdatedAt ? ` · updated ${timeAgo(member.addressUpdatedAt)}` : ""}
            </p>
            {member.googleMapUrl || (member.latitude !== null && member.longitude !== null) ? (
              <a
                href={member.googleMapUrl || `https://www.google.com/maps?q=${member.latitude},${member.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-ink"
              >
                <MapPin className="h-3 w-3" aria-hidden="true" /> Open location
              </a>
            ) : null}
          </section>

          <Hairline />

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="mono-caption">Contact</dt>
              <dd className="mt-0.5">{displayPhone(member.contactNumber)}</dd>
            </div>
            <div>
              <dt className="mono-caption">WhatsApp</dt>
              <dd className="mt-0.5">{displayPhone(member.whatsappNumber || member.contactNumber)}</dd>
            </div>
            <div>
              <dt className="mono-caption">Spouse</dt>
              <dd className="mt-0.5">{member.spouseName || "—"}</dd>
            </div>
            <div>
              <dt className="mono-caption">Pincode</dt>
              <dd className="mt-0.5 font-mono">{member.pincode || "—"}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <WhatsAppButton member={member} />
            {isAdmin ? (
              <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit record
              </Button>
            ) : null}
            {isAdmin ? (
              <Button size="sm" variant="secondary" onClick={makeInvite} disabled={inviting}>
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {inviting ? "Creating…" : claimed ? "New invite link" : "Create invite link"}
              </Button>
            ) : null}
          </div>

          {inviteCode ? (
            <div className="border border-border bg-paper p-3">
              <MonoLabel className="block">One-time link</MonoLabel>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={link} className="font-mono text-[11px]" onFocus={(event) => event.target.select()} />
                <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy invite link">
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sendHref ? (
                  <Button asChild size="sm">
                    <a href={sendHref} target="_blank" rel="noreferrer">
                      Send on WhatsApp
                    </a>
                  </Button>
                ) : (
                  <p className="text-[11px] text-ink-soft">
                    No phone number on this record — copy the link and send it yourself.
                  </p>
                )}
              </div>
              <p className="mt-2 text-[11px] text-ink-soft">
                Works once, expires in 7 days. Opening it in a private window will spend it.
              </p>
            </div>
          ) : null}

          {isAdmin ? (
            <>
              <Hairline />
              <ChangeHistory entries={history} />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddressRegister({
  members,
  filters,
  claimedByMember,
  openInvites,
  isAdmin,
  onAdd
}) {
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [paramHandled, setParamHandled] = useState(false);

  useEffect(() => {
    if (paramHandled || members.length === 0) return;
    const id = new URLSearchParams(window.location.search).get("member");
    if (id) {
      const found = members.find((member) => member.id === id);
      if (found) setDetail(found);
    }
    setParamHandled(true);
  }, [members, paramHandled]);

  const visible = useMemo(
    () => sortMembers(filterMembers(members, filters, claimedByMember, isAdmin), filters),
    [members, filters, claimedByMember, isAdmin]
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
        <MonoLabel>
          {visible.length} shown · {members.length} records
        </MonoLabel>
        {isAdmin ? (
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add member
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={UserRoundX}
            title="No records match these filters"
            body="Try a different pincode or area, or clear the filters to see the whole register."
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Family register: {visible.length} records with name, relation, area, pincode, contact
                and last update
              </caption>
              <thead>
                <tr className="border-b border-border bg-card text-left">
                  <th scope="col" className="mono-caption px-3 py-2 font-normal">Name</th>
                  <th scope="col" className="mono-caption px-3 py-2 font-normal">Relation</th>
                  <th scope="col" className="mono-caption px-3 py-2 font-normal">Area</th>
                  <th scope="col" className="mono-caption px-3 py-2 font-normal">Pincode</th>
                  <th scope="col" className="mono-caption px-3 py-2 font-normal">Contact</th>
                  <th scope="col" className="mono-caption px-3 py-2 font-normal">Updated</th>
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => (
                  <tr key={member.id} className="border-b border-border align-top transition-transform hover:bg-secondary/50">
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setDetail(member)}
                        className="text-left font-medium hover:underline hover:underline-offset-2"
                      >
                        {member.name}
                      </button>
                      <div className="flex items-center gap-2">
                        {member.nameTamil ? (
                          <span lang="ta" className="font-tamil text-[11px] text-ink-soft">
                            {member.nameTamil}
                          </span>
                        ) : null}
                        {isAdmin ? (
                          <StatusDot
                            claimed={claimedByMember.has(member.id)}
                            invited={openInvites.has(member.id)}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{member.relationLabel || "—"}</td>
                    <td className="px-3 py-2.5">{formatAreaState(member)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{member.pincode || "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {displayPhone(member.whatsappNumber || member.contactNumber)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-ink-soft">
                      {member.addressUpdatedAt ? timeAgo(member.addressUpdatedAt) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <WhatsAppButton member={member} label="" />
                        <Button variant="ghost" size="sm" onClick={() => setDetail(member)}>
                          Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:hidden">
            {visible.map((member) => (
              <li key={member.id}>
                <article className="h-full border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => setDetail(member)}
                        className="text-left font-display text-lg leading-tight hover:underline hover:underline-offset-2"
                      >
                        {member.name}
                      </button>
                      {member.nameTamil ? (
                        <p lang="ta" className="font-tamil text-[11px] text-ink-soft">
                          {member.nameTamil}
                        </p>
                      ) : null}
                    </div>
                    {isAdmin ? (
                      <StatusDot
                        claimed={claimedByMember.has(member.id)}
                        invited={openInvites.has(member.id)}
                      />
                    ) : null}
                  </div>
                  <p className="mono-caption mt-2">{member.relationLabel || "Relation not set"}</p>
                  <p className="mt-1 text-sm">{formatAreaState(member)}</p>
                  <p className="font-mono text-xs text-ink-soft">{member.pincode || "No pincode"}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
                    <span className="font-mono text-[11px] text-ink-soft">
                      {displayPhone(member.whatsappNumber || member.contactNumber)}
                    </span>
                    <div className="flex gap-1">
                      <WhatsAppButton member={member} label="" />
                      <Button variant="ghost" size="sm" onClick={() => setDetail(member)}>
                        Open
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}

      <MemberDetail
        member={detail}
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        claimedByMember={claimedByMember}
        isAdmin={isAdmin}
        onEdit={(member) => {
          setDetail(null);
          setEditing(member);
        }}
      />

      <MemberDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        member={editing}
        onDone={() => setEditing(null)}
      />
    </div>
  );
}
