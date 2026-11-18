"use client";

import { useEffect, useState } from "react";
import { createMember, deleteMemberDeep, saveAddress, updateMember } from "@/lib/db/family";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/hooks/use-toast";
import { RELATION_LABEL_SUGGESTIONS } from "@/lib/kinship/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AddressForm } from "./AddressForm";
import { Hairline, MonoLabel, Stamp } from "@/components/sheet";

const EMPTY = {
  name: "",
  nameTamil: "",
  relationLabel: "",
  spouseName: "",
  dateOfBirth: "",
  dateOfMarriage: "",
  isAlive: true,
  dateOfDeath: ""
};

function Field({ label, htmlFor, children, className }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mono-caption mb-1.5 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function MemberDialog({ open, onOpenChange, member, onDone }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [identity, setIdentity] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editing = Boolean(member);
  const prefix = member?.id || "new";

  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    setIdentity(
      member
        ? {
            name: member.name || "",
            nameTamil: member.nameTamil || "",
            relationLabel: member.relationLabel || "",
            spouseName: member.spouseName || "",
            dateOfBirth: member.dateOfBirth || "",
            dateOfMarriage: member.dateOfMarriage || "",
            isAlive: member.isAlive !== false,
            dateOfDeath: member.dateOfDeath || ""
          }
        : EMPTY
    );
    // Re-seed only when a different record opens; live directory updates must not wipe typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member?.id]);

  function update(field, value) {
    setIdentity((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    if (!identity.name.trim()) {
      setError("Add a name before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await updateMember(member.id, identity);
        toast({ title: "Record saved", description: `${identity.name} is up to date.` });
      } else {
        await createMember({ identity, address: {}, actor: { uid: user.uid } });
        toast({ title: "Record added", description: `${identity.name} is in the register.` });
      }
      onDone?.();
      onOpenChange(false);
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteMemberDeep(member.id);
      toast({ title: "Record deleted", description: `${member.name} was removed from the register.` });
      onDone?.();
      onOpenChange(false);
    } catch {
      setError("Could not delete this record.");
    } finally {
      setBusy(false);
    }
  }

  async function saveMemberAddress(data, { notify }) {
    try {
      await saveAddress(member.id, data, {
        before: member,
        uid: user.uid,
        name: "Admin",
        role: "admin",
        notify
      });
      toast({ title: "Address saved", description: "The family register is up to date." });
      onDone?.();
    } catch {
      toast({
        variant: "destructive",
        title: "Address not saved",
        description: "Check your connection and try again."
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div>
            <Stamp>{editing ? "Record" : "New record"}</Stamp>
          </div>
          <DialogTitle className="mt-1 text-2xl">
            {editing ? member.name : "Add a family member"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Identity details belong to admins only. Address changes are logged and announced."
              : "Create the identity record first. An invite can be sent from the admin desk after saving."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor={`${prefix}-name`}>
            <Input
              id={`${prefix}-name`}
              value={identity.name}
              onChange={(event) => update("name", event.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Name in Tamil" htmlFor={`${prefix}-tamil`}>
            <Input
              id={`${prefix}-tamil`}
              value={identity.nameTamil}
              onChange={(event) => update("nameTamil", event.target.value)}
              lang="ta"
              className="font-tamil"
            />
          </Field>
          <Field label="Relation label" htmlFor={`${prefix}-relation`} className="sm:col-span-2">
            <Input
              id={`${prefix}-relation`}
              list={`${prefix}-relation-options`}
              value={identity.relationLabel}
              onChange={(event) => update("relationLabel", event.target.value)}
              placeholder="Mama · மாமா"
            />
            <datalist id={`${prefix}-relation-options`}>
              {RELATION_LABEL_SUGGESTIONS.map((label) => (
                <option key={label} value={label} />
              ))}
            </datalist>
          </Field>
          <Field label="Spouse's name (display)" htmlFor={`${prefix}-spouse`} className="sm:col-span-2">
            <Input
              id={`${prefix}-spouse`}
              value={identity.spouseName}
              onChange={(event) => update("spouseName", event.target.value)}
            />
          </Field>
          <Field label="Date of birth" htmlFor={`${prefix}-dob`}>
            <Input
              id={`${prefix}-dob`}
              type="date"
              value={identity.dateOfBirth}
              onChange={(event) => update("dateOfBirth", event.target.value)}
            />
          </Field>
          <Field label="Date of marriage" htmlFor={`${prefix}-dom`}>
            <Input
              id={`${prefix}-dom`}
              type="date"
              value={identity.dateOfMarriage}
              onChange={(event) => update("dateOfMarriage", event.target.value)}
            />
          </Field>
          <Field label="Living" htmlFor={`${prefix}-alive`} className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                id={`${prefix}-alive`}
                type="checkbox"
                checked={identity.isAlive}
                onChange={(event) => update("isAlive", event.target.checked)}
                className="h-3.5 w-3.5 accent-[hsl(var(--ink))]"
              />
              This person is living
            </label>
          </Field>
          {!identity.isAlive ? (
            <Field label="Date of death" htmlFor={`${prefix}-dod`} className="sm:col-span-2">
              <Input
                id={`${prefix}-dod`}
                type="date"
                value={identity.dateOfDeath}
                onChange={(event) => update("dateOfDeath", event.target.value)}
              />
            </Field>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-xs text-stamp">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save record" : "Add record"}
          </Button>
        </DialogFooter>

        {editing ? (
          <>
            <Hairline className="my-2" />
            <div>
              <MonoLabel as="h3" className="block">
                Address
              </MonoLabel>
              <p className="mt-1 text-xs text-ink-soft">
                Saved separately so the history and the family notification stay accurate.
              </p>
            </div>
            <AddressForm
              member={member}
              onSave={saveMemberAddress}
              submitLabel="Save address"
            />
            <Hairline className="my-2" />
            <div>
              <MonoLabel as="h3" className="block">
                Delete
              </MonoLabel>
              <p className="mt-1 text-xs text-ink-soft">
                Removes the record, its address, history, access and relationship edges. This
                cannot be undone.
              </p>
              {confirmDelete ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="destructive" size="sm" onClick={remove} disabled={busy}>
                    Delete {member.name} permanently
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Keep record
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-stamp/40 text-stamp hover:bg-stamp/5"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete record
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-ink-soft">
            Save the record first, then reopen it to add an address and send a one-time invite
            from the admin desk.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
