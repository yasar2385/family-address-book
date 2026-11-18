"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { claimMember, ClaimError, getInvite } from "@/lib/db/invites";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonoLabel, SheetCard, Stamp } from "@/components/sheet";

function JoinInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh, signOut } = useAuth();
  const code = (params.get("code") || "").trim().toLowerCase();

  const [invite, setInvite] = useState(null);
  const [lookup, setLookup] = useState(code ? "loading" : "idle");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [browserHint, setBrowserHint] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    if (!code) {
      setLookup("idle");
      return;
    }
    let cancelled = false;
    setLookup("loading");
    getInvite(code)
      .then((data) => {
        if (cancelled) return;
        setInvite(data);
        if (!data) setLookup("missing");
        else if (data.status !== "open") setLookup("used");
        else if (data.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now()) setLookup("expired");
        else setLookup("open");
      })
      .catch(() => {
        if (!cancelled) setLookup("error");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function claim() {
    setClaiming(true);
    setError("");
    setBrowserHint(false);
    try {
      await claimMember(code);
      await refresh();
      router.replace("/me");
    } catch (claimError) {
      if (claimError instanceof ClaimError) setError(claimError.message);
      else if (claimError?.code === "permission-denied") {
        setBrowserHint(true);
        setError("Could not link this record. The link may have been used already, or the register rules are not deployed yet.");
      } else {
        setBrowserHint(true);
        setError("Could not link this record. Check your connection and try again.");
      }
      setClaiming(false);
    }
  }

  function enterCode(event) {
    event.preventDefault();
    const clean = codeInput.trim().toLowerCase();
    if (clean) router.replace(`/join?code=${encodeURIComponent(clean)}`);
  }

  return (
    <div className="relative min-h-screen bg-paper px-5 py-10">
      <main className="mx-auto w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <Link href="/login" className="mono-caption hover:text-ink">
            Kudumbam · Family register
          </Link>
          <MonoLabel>Invite</MonoLabel>
        </div>

        <SheetCard className="mt-8 p-7 sm:p-9">
          <Stamp>One-time link</Stamp>

          {lookup === "idle" ? (
            <>
              <h1 className="mt-4 text-3xl">Enter your invite code</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                The code is the long string at the end of the link the family sent you on
                WhatsApp. It works once.
              </p>
              <form onSubmit={enterCode} className="mt-6 space-y-3">
                <Input
                  id="invite-code"
                  name="invite-code"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  placeholder="Paste the code here"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-xs"
                  aria-label="Invite code"
                />
                <Button type="submit" className="w-full" disabled={!codeInput.trim()}>
                  Continue
                </Button>
              </form>
            </>
          ) : null}

          {lookup === "loading" ? (
            <p className="mt-6 flex items-center gap-3 text-sm text-ink-soft">
              <span className="h-4 w-4 animate-spin rounded-full border border-border border-t-stamp" />
              Checking the link…
            </p>
          ) : null}

          {lookup === "open" && invite ? (
            <>
              <h1 className="mt-4 text-3xl">Is this you?</h1>
              <p className="mt-4 border-y border-border py-4 font-display text-2xl">
                {invite.memberName}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Claiming links this device to that record. You will be able to read the whole
                register and keep your own address current.
              </p>
              {error ? (
                <p role="alert" className="mt-4 text-xs leading-relaxed text-stamp">
                  {error}
                </p>
              ) : null}
              {browserHint ? (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
                  Opened this link inside WhatsApp? Copy it into Chrome or Safari and try again —
                  in-app browsers sometimes block the sign-in step.
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={claim} disabled={claiming}>
                  {claiming ? "Linking…" : "This is me"}
                </Button>
                <Button variant="outline" onClick={() => signOut()} disabled={claiming}>
                  Not me
                </Button>
              </div>
              <p className="mt-5 text-[11px] leading-relaxed text-ink-soft">
                A private browser window cannot keep this link. Open it in your normal browser,
                not inside WhatsApp&apos;s viewer if you can.
              </p>
            </>
          ) : null}

          {lookup === "used" ? (
            <>
              <h1 className="mt-4 text-2xl">This link has been used</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Each link works once. Ask an admin to send a fresh one from your record.
              </p>
            </>
          ) : null}

          {lookup === "expired" ? (
            <>
              <h1 className="mt-4 text-2xl">This link expired</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Invites last seven days. Ask an admin to send a new one.
              </p>
            </>
          ) : null}

          {lookup === "missing" ? (
            <>
              <h1 className="mt-4 text-2xl">No invite with that code</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Check the link ends with the full code. Codes are long and easy to cut short.
              </p>
            </>
          ) : null}

          {lookup === "error" ? (
            <>
              <h1 className="mt-4 text-2xl">Could not check this link</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                This usually means the Firestore rules have not been deployed, or you are
                offline. Try again in a moment.
              </p>
            </>
          ) : null}

          {lookup !== "idle" && lookup !== "open" ? (
            <div className="mt-6 flex gap-2">
              <Button asChild variant="outline">
                <Link href="/join">Try another code</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : null}
        </SheetCard>

        <p className="mt-6 text-[11px] leading-relaxed text-ink-soft">
          Only the person who opens the link can change that record&apos;s address. Admins can
          always edit it.
        </p>
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <JoinInner />
    </Suspense>
  );
}
