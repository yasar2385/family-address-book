"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { MonoLabel, Stamp } from "@/components/sheet";

function GateFrame({ children }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-border bg-card p-8">
        {children}
      </div>
    </div>
  );
}

export function MemberGate({ children }) {
  const { status, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "signedOut") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-stamp" />
        <MonoLabel>Opening the register</MonoLabel>
      </div>
    );
  }

  if (status === "unclaimed") {
    return (
      <GateFrame>
        <Stamp>Not linked</Stamp>
        <h1 className="mt-4 text-2xl">This device is not linked to a record yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Open the one-time link the family sent you on WhatsApp. It belongs to exactly one
          person and expires after seven days.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/join">Enter invite link</Link>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </GateFrame>
    );
  }

  return children;
}
