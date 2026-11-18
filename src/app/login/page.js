"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContourBackdrop, MonoLabel, SheetCard, Stamp } from "@/components/sheet";

function messageFor(error) {
  switch (error?.code) {
    case "auth/operation-not-allowed":
      return "Google sign-in is switched off for this project. Enable it in Firebase Authentication → Sign-in method.";
    case "auth/unauthorized-domain":
      return "This web address is not an authorised domain. Add it in Firebase Authentication → Settings.";
    case "auth/popup-blocked":
    case "auth/popup-closed-by-user":
      return "The Google window did not finish. Allow pop-ups, or try again.";
    case "auth/invalid-api-key":
      return "The Firebase API key is missing. Check .env.local.";
    default:
      return "Google sign-in did not complete. Try again.";
  }
}

export default function LoginPage() {
  const { status, isAdmin } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (status === "admin") router.replace("/dashboard");
    if (status === "member") router.replace("/address-book");
  }, [status, router]);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (signInError) {
      if (
        signInError?.code === "auth/popup-blocked" ||
        signInError?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          await signInWithRedirect(auth, new GoogleAuthProvider());
          return;
        } catch (redirectError) {
          setError(messageFor(redirectError));
        }
      } else if (signInError?.code !== "auth/popup-closed-by-user") {
        setError(messageFor(signInError));
      }
    } finally {
      setBusy(false);
    }
  }

  function openInvite(event) {
    event.preventDefault();
    const clean = code.trim().toLowerCase();
    if (clean) router.push(`/join?code=${encodeURIComponent(clean)}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      <ContourBackdrop className="text-ochre/40" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-10 md:py-10">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <p className="mono-caption">Kudumbam · Family register</p>
          <p className="mono-caption hidden sm:block">Private · family only</p>
        </div>

        <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <section>
            <Stamp>Register no. 01</Stamp>
            <h1 className="mt-5 font-display text-[2.7rem] leading-[1.02] tracking-tight sm:text-6xl">
              The family
              <br />
              register.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              Names, homes and how everyone is related — kept current by the family itself,
              from Chennai to Kochi.
            </p>

            <dl className="mt-10 max-w-md border-t border-border">
              {[
                ["Admin", "Google account · keeps the register and sends invites"],
                ["Member", "One-time link · keeps only their own address"],
                ["Visitor", "Sees this page only · no directory access"]
              ].map(([role, detail]) => (
                <div key={role} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-border py-3">
                  <dt className="mono-caption pt-0.5">{role}</dt>
                  <dd className="text-sm text-ink-soft">{detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <SheetCard className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <MonoLabel>Sign in</MonoLabel>
              <span className="font-mono text-[10px] text-ink-soft">
                {status === "loading" ? "checking…" : status === "unclaimed" ? "not an admin" : "ready"}
              </span>
            </div>

            {status === "unclaimed" ? (
              <p className="mt-4 border border-stamp/40 bg-stamp/5 px-3 py-2 text-xs leading-relaxed text-stamp">
                This Google account is not on the admin list. If the family sent you a one-time
                link, open it below.
              </p>
            ) : null}

            <h2 className="mt-4 text-2xl">Open the register</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Admins sign in with Google. Everyone else uses the link they were sent.
            </p>

            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={signIn}
              disabled={busy || status === "loading"}
            >
              {busy ? "Opening Google…" : isAdmin ? "Continue as admin" : "Sign in with Google"}
            </Button>

            {error ? (
              <p role="alert" className="mt-3 text-xs leading-relaxed text-stamp">
                {error}
              </p>
            ) : null}

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="mono-caption">or use an invite</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={openInvite} className="space-y-2">
              <label htmlFor="invite-code" className="mono-caption block">
                One-time code
              </label>
              <div className="flex gap-2">
                <Input
                  id="invite-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="e.g. k3f9xq2m…"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-xs"
                />
                <Button type="submit" variant="outline" disabled={!code.trim()}>
                  Open
                </Button>
              </div>
            </form>

            <p className="mt-6 border-t border-border pt-4 text-[11px] leading-relaxed text-ink-soft">
              A member sees every name, address and number in the register, but can only change
              their own address.{" "}
              <Link href="/join" className="underline underline-offset-2 hover:text-ink">
                I was sent a link
              </Link>
              .
            </p>
          </SheetCard>
        </div>

        <p className="border-t border-border pt-2 mono-caption">
          Chithi · Mama · Periyamma · Athai · Thatha · Paati — everyone, in one place.
        </p>
      </div>
    </main>
  );
}
