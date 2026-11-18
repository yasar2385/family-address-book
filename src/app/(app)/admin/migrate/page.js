"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Play } from "lucide-react";
import { planMigration, runMigration } from "@/lib/db/migrate";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/hooks/use-toast";
import { SheetHeader } from "@/components/shell/SheetHeader";
import { EmptyState, MonoLabel, SheetCard, Stat } from "@/components/sheet";
import { Button } from "@/components/ui/button";

export default function MigratePage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  if (!isAdmin) {
    return (
      <div>
        <SheetHeader eyebrow="Migration" title="Admins only" />
        <EmptyState
          title="This tool is for admins"
          body="Sign in with the admin Google account to preview or run the migration."
          action={
            <Button asChild>
              <Link href="/dashboard">Back to the register</Link>
            </Button>
          }
        />
      </div>
    );
  }

  async function preview() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setPlan(await planMigration());
    } catch (previewError) {
      setError(
        previewError?.code === "permission-denied"
          ? "Firestore denied the read. Confirm this account is an admin and the rules are deployed."
          : "Could not preview the migration. Check your connection."
      );
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      const written = await runMigration(plan);
      setResult({ written });
      setPlan(null);
      toast({ title: "Migration complete", description: `${written} writes committed in batches.` });
    } catch (runError) {
      setError(
        runError?.code === "permission-denied"
          ? "A write was denied. Nothing after that batch was attempted; preview again to see what remains."
          : "The migration stopped partway. Preview again to see the remaining work."
      );
    } finally {
      setBusy(false);
    }
  }

  const summary = plan?.summary;

  return (
    <div>
      <SheetHeader
        eyebrow="Migration"
        meta="Old records → canonical model"
        title="Bring the old data forward"
        description="Copies address fields out of familyMembers, coerces coordinates to numbers, converts children[] and legacy relations into canonical edges, and removes the old children array."
      />

      <div className="flex flex-wrap items-center gap-2 border border-stamp/40 bg-stamp/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-stamp" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-ink">
          Run this while the family is not editing. It is additive where possible, and it deletes the
          old <code className="font-mono">children</code> array and legacy relation documents only
          after writing their replacements.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={preview} disabled={busy}>
          {busy && !plan ? "Reading…" : "Preview migration"}
        </Button>
        <Button onClick={run} disabled={busy || !plan}>
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          {busy ? "Writing…" : plan ? `Run ${plan.operations.length} writes` : "Run migration"}
        </Button>
        {plan && !busy ? (
          <p className="self-center text-xs text-ink-soft">
            Preview ready. Run writes in batches of 400.
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 border border-stamp/40 bg-stamp/5 px-3 py-2 text-xs text-stamp">
          {error}
        </p>
      ) : null}

      {result ? (
        <SheetCard className="mt-6 p-5">
          <MonoLabel>Done</MonoLabel>
          <p className="mt-1 font-display text-2xl">{result.written} writes committed</p>
          <p className="mt-1 text-xs text-ink-soft">
            Preview again to confirm there is nothing left. Check the map and tree for missing pins or
            reversed edges.
          </p>
        </SheetCard>
      ) : null}

      {summary ? (
        <>
          <h2 className="mt-8 text-xl">Preview</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Members read" value={summary.members} />
            <Stat label="Address docs to create" value={summary.addressesToCreate} detail="copied from legacy fields" />
            <Stat label="Child edges" value={summary.childEdges} detail="from the old children[] array" />
            <Stat label="Legacy relations" value={summary.legacyRelations} detail="converted to canonical edges" />
            <Stat label="Unhandled relations" value={summary.unhandledRelations} detail="labels only — kept out of the tree" />
            <Stat label="Members to clean" value={summary.membersToClean} detail="children array removed" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
            Son/Daughter edges are imported as flagged <span className="font-mono">needsReview</span>{" "}
            because the old app stored them in both directions. Nothing is written until you press
            Run.
          </p>
        </>
      ) : null}
    </div>
  );
}
