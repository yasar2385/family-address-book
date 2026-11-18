"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Check, Copy, Send, ShieldCheck, Trash2, X } from "lucide-react";
import { useDirectory } from "@/lib/hooks/useDirectory";
import { useAuth } from "@/lib/auth/AuthProvider";
import { subscribeInvites, createInvite, joinUrl, revokeInvite, deleteInvite } from "@/lib/db/invites";
import { subscribeUsers } from "@/lib/db/users";
import { subscribeNotifications } from "@/lib/db/notifications";
import { announceToFamily } from "@/lib/db/notifications";
import { deleteRelation, markRelationReviewed, saveRelationData } from "@/lib/db/relations";
import { useToast } from "@/components/hooks/use-toast";
import { formatDate, timeAgo } from "@/lib/format";
import { templates, waLink } from "@/lib/whatsapp";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { EmptyState, Hairline, MonoLabel, SheetCard, Stamp, Stat } from "@/components/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SELECT =
  "h-9 w-full border border-input bg-transparent px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre";

export default function AdminPage() {
  const { isAdmin, user } = useAuth();
  const { members, relations, loading } = useDirectory();
  const { toast } = useToast();
  const [invites, setInvites] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inviteMemberId, setInviteMemberId] = useState("");
  const [lastInvite, setLastInvite] = useState(null);
  const [announcement, setAnnouncement] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return () => {};
    const offInvites = subscribeInvites((items) => setInvites(items));
    const offUsers = subscribeUsers((items) => setUsers(items));
    const offNotifications = subscribeNotifications({ isAdmin: true }, setNotifications);
    return () => {
      offInvites();
      offUsers();
      offNotifications();
    };
  }, [isAdmin]);

  const nameOf = useMemo(() => {
    const map = new Map(members.map((member) => [member.id, member.name]));
    return (id) => map.get(id) || "Removed record";
  }, [members]);

  const review = relations.filter((relation) => relation.needsReview);
  const openInvites = invites.filter((invite) => invite.status === "open");
  const changes = notifications.filter((item) => item.type === "address_change").slice(0, 12);

  if (!isAdmin) {
    return (
      <div>
        <SheetHeader eyebrow="Admin desk" title="Admins only" />
        <EmptyState
          icon={ShieldCheck}
          title="This desk is for admins"
          body="Sign in with the Google account whose UID has an admins/{uid} document in Firestore."
          action={
            <Button asChild>
              <Link href="/dashboard">Back to the register</Link>
            </Button>
          }
        />
      </div>
    );
  }

  async function makeInvite() {
    const member = members.find((item) => item.id === inviteMemberId);
    if (!member) {
      toast({ variant: "destructive", title: "Choose a record first" });
      return;
    }
    setBusy(true);
    try {
      const code = await createInvite(member, user);
      setLastInvite({ code, member });
      toast({ title: "Invite created", description: "Single use, expires in seven days." });
    } catch {
      toast({ variant: "destructive", title: "Could not create the invite" });
    } finally {
      setBusy(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Select the link and copy it manually." });
    }
  }

  async function discard(code) {
    setBusy(true);
    try {
      await deleteInvite(code);
      if (lastInvite?.code === code) setLastInvite(null);
      toast({ title: "Invite deleted" });
    } catch {
      toast({ variant: "destructive", title: "Could not delete the invite" });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(code) {
    setBusy(true);
    try {
      await revokeInvite(code);
      toast({ title: "Invite revoked" });
    } catch {
      toast({ variant: "destructive", title: "Could not revoke the invite" });
    } finally {
      setBusy(false);
    }
  }

  async function keepEdge(relation) {
    try {
      await markRelationReviewed(relation.id);
      toast({ title: "Edge kept" });
    } catch {
      toast({ variant: "destructive", title: "Could not update the edge" });
    }
  }

  async function reverseEdge(relation) {
    try {
      const newId = await saveRelationData(
        { a: relation.b, b: relation.a, kind: relation.kind, label: relation.label, needsReview: false },
        user
      );
      if (newId !== relation.id) await deleteRelation(relation.id);
      toast({ title: "Direction reversed", description: `${nameOf(relation.a)} is now the child of ${nameOf(relation.b)}.` });
    } catch {
      toast({ variant: "destructive", title: "Could not reverse the edge" });
    }
  }

  async function dropEdge(relation) {
    try {
      await deleteRelation(relation.id);
      toast({ title: "Edge deleted" });
    } catch {
      toast({ variant: "destructive", title: "Could not delete the edge" });
    }
  }

  async function announce(event) {
    event.preventDefault();
    if (!announcement.title.trim()) return;
    setBusy(true);
    try {
      await announceToFamily({
        title: announcement.title.trim(),
        body: announcement.body.trim(),
        actor: { uid: user.uid, name: "Admin" }
      });
      setAnnouncement({ title: "", body: "" });
      toast({ title: "Announcement sent", description: "Every claimed member sees it in the bell." });
    } catch {
      toast({ variant: "destructive", title: "Could not send the announcement" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SheetHeader
        eyebrow="Admin desk"
        meta={`${members.length} records · ${users.length} claims`}
        title="Keep the register honest"
        description="Invites, claims, imported relationship edges and the change log. Every action here is admin-only in Firestore rules."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/migrate">Migration</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Records" value={loading ? "—" : members.length} />
        <Stat label="Claimed" value={users.length} detail="devices linked to a record" />
        <Stat label="Open invites" value={openInvites.length} detail="unused, unexpired" />
        <Stat label="Needs review" value={review.length} detail="imported edges" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section aria-labelledby="invites-heading">
          <div className="border-b border-border pb-2">
            <MonoLabel as="h2" id="invites-heading">
              One-time invites
            </MonoLabel>
          </div>
          <SheetCard className="mt-3 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="invite-member" className="sr-only">
                Record to invite
              </label>
              <select
                id="invite-member"
                className={SELECT}
                value={inviteMemberId}
                onChange={(event) => setInviteMemberId(event.target.value)}
              >
                <option value="">Choose a record…</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.pincode ? ` · ${member.pincode}` : ""}
                  </option>
                ))}
              </select>
              <Button onClick={makeInvite} disabled={busy || !inviteMemberId} className="shrink-0">
                Create link
              </Button>
            </div>

            {lastInvite ? (
              <div className="mt-3 border border-border bg-paper p-3">
                <MonoLabel>New link for {lastInvite.member.name}</MonoLabel>
                <div className="mt-2 flex gap-2">
                  <Input
                    readOnly
                    value={joinUrl(lastInvite.code)}
                    className="font-mono text-[11px]"
                    onFocus={(event) => event.target.select()}
                  />
                  <Button variant="outline" size="icon" onClick={() => copy(joinUrl(lastInvite.code))} aria-label="Copy invite link">
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(() => {
                    const href = waLink(
                      lastInvite.member.whatsappNumber || lastInvite.member.contactNumber,
                      templates.sendJoinLink(lastInvite.member, joinUrl(lastInvite.code), "The family")
                    );
                    return href ? (
                      <Button asChild size="sm">
                        <a href={href} target="_blank" rel="noreferrer">
                          Send on WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <p className="text-[11px] text-ink-soft">
                        No number on the record — copy the link and send it yourself.
                      </p>
                    );
                  })()}
                </div>
              </div>
            ) : null}
          </SheetCard>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Invites created for family records</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="mono-caption px-2 py-2 font-normal">Record</th>
                  <th scope="col" className="mono-caption px-2 py-2 font-normal">Code</th>
                  <th scope="col" className="mono-caption px-2 py-2 font-normal">Status</th>
                  <th scope="col" className="mono-caption px-2 py-2 font-normal">Expires</th>
                  <th scope="col" className="px-2 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-xs text-ink-soft">
                      No invites yet. Create one above to let a member keep their own address.
                    </td>
                  </tr>
                ) : (
                  invites.map((invite) => {
                    const link = joinUrl(invite.code);
                    return (
                      <tr key={invite.code} className="border-b border-border align-top">
                        <td className="px-2 py-2">{invite.memberName || nameOf(invite.memberId)}</td>
                        <td className="px-2 py-2 font-mono text-[11px]">{invite.code.slice(0, 10)}…</td>
                        <td className="px-2 py-2">
                          <Stamp tone={invite.status === "open" ? "stamp" : "ink"}>{invite.status}</Stamp>
                        </td>
                        <td className="px-2 py-2 text-xs text-ink-soft">{formatDate(invite.expiresAt)}</td>
                        <td className="px-2 py-2">
                          <div className="flex justify-end gap-1">
                            {invite.status === "open" ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => copy(link)} aria-label="Copy link">
                                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => revoke(invite.code)} aria-label="Revoke invite">
                                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                              </>
                            ) : null}
                            <Button variant="ghost" size="sm" onClick={() => discard(invite.code)} aria-label="Delete invite">
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="claims-heading">
          <div className="border-b border-border pb-2">
            <MonoLabel as="h2" id="claims-heading">
              Claimed devices
            </MonoLabel>
          </div>
          {users.length === 0 ? (
            <p className="mt-3 border border-dashed border-border px-3 py-6 text-xs text-ink-soft">
              Nobody has opened an invite yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {users.map((claim) => (
                <li key={claim.uid} className="flex flex-wrap items-baseline gap-2 py-2 text-sm">
                  <span className="font-medium">{nameOf(claim.memberId)}</span>
                  <span className="mono-caption">{claim.uid.slice(0, 8)}…</span>
                  <span className="ml-auto text-xs text-ink-soft">
                    claimed {timeAgo(claim.claimedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Hairline className="my-6" />

          <div className="border-b border-border pb-2">
            <MonoLabel as="h2">Announce to the family</MonoLabel>
          </div>
          <form onSubmit={announce} className="mt-3 space-y-2">
            <Input
              value={announcement.title}
              onChange={(event) => setAnnouncement((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title — e.g. Register updated after the wedding"
              aria-label="Announcement title"
            />
            <textarea
              value={announcement.body}
              onChange={(event) => setAnnouncement((current) => ({ ...current, body: event.target.value }))}
              placeholder="One or two lines. Appears in the bell for every claimed member."
              aria-label="Announcement body"
              rows={2}
              className="w-full border border-input bg-transparent px-2.5 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre"
            />
            <Button type="submit" size="sm" disabled={busy || !announcement.title.trim()}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send announcement
            </Button>
          </form>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="review-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
          <MonoLabel as="h2" id="review-heading">
            Relationship edges to review
          </MonoLabel>
          <span className="mono-caption">{review.length} flagged</span>
        </div>
        {review.length === 0 ? (
          <p className="mt-3 border border-dashed border-border px-3 py-6 text-xs text-ink-soft">
            Nothing flagged. Imported Son/Daughter edges appear here because the old app stored them
            in both directions.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {review.map((relation) => (
              <li key={relation.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <p className="text-sm">
                  <span className="font-medium">{nameOf(relation.a)}</span>
                  <span className="text-ink-soft"> → parent of → </span>
                  <span className="font-medium">{nameOf(relation.b)}</span>
                </p>
                <span className="mono-caption">[{relation.label || relation.kind}]</span>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => keepEdge(relation)}>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Keep
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => reverseEdge(relation)}>
                    <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" /> Reverse
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => dropEdge(relation)} aria-label="Delete edge">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="log-heading">
        <div className="border-b border-border pb-2">
          <MonoLabel as="h2" id="log-heading">
            Change log
          </MonoLabel>
        </div>
        {changes.length === 0 ? (
          <p className="mt-3 border border-dashed border-border px-3 py-6 text-xs text-ink-soft">
            No address changes recorded yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {changes.map((item) => (
              <li key={item.id} className="py-2.5">
                <p className="text-sm">{item.title}</p>
                <p className="text-xs text-ink-soft">{item.body}</p>
                <p className="mono-caption mt-0.5">{timeAgo(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-soft">
        Inverse of the current model: members can read everything and write only their own address;
        admins write records, edges and invites. Relation ids are deterministic, so the same edge
        cannot be stored twice.
      </p>
    </div>
  );
}
