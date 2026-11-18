"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { subscribeNotifications, markNotificationRead } from "@/lib/db/notifications";
import { useAuth } from "@/lib/auth/AuthProvider";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const { isAdmin, memberId, status } = useAuth();
  const [items, setItems] = useState([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signedOut" || status === "loading" || status === "unclaimed") {
      setItems([]);
      return () => {};
    }
    return subscribeNotifications({ isAdmin, memberId }, setItems);
  }, [isAdmin, memberId, status]);

  useEffect(() => {
    setItems((current) => current);
  }, [pathname]);

  const unread = items.filter((item) => !item.read).length;

  if (!isAdmin && !memberId) return null;

  async function open(item) {
    if (!item.read) {
      await markNotificationRead(item.id).catch(() => {});
    }
    if (item.link) router.push(item.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-stamp px-1 font-mono text-[9px] text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-baseline justify-between">
          <span>Changes</span>
          <span className="mono-caption">{unread} unread</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-ink-soft">
            No changes yet. Address updates appear here.
          </p>
        ) : (
          items.slice(0, 8).map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => open(item)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className={item.read ? "text-xs text-ink-soft" : "text-xs font-medium text-ink"}>
                {item.title}
              </span>
              <span className="text-[11px] text-ink-soft">{item.body}</span>
              <span className="mono-caption mt-0.5">{timeAgo(item.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AccountMenu() {
  const { isAdmin, status, user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const label = isAdmin ? "Admin" : status === "member" ? "Member" : "Visitor";
  const initial = (user?.email?.[0] || (isAdmin ? "A" : "M")).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Account: ${label}`}>
          <span className="flex h-7 w-7 items-center justify-center border border-border font-mono text-[10px] uppercase">
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-xs font-medium">{label}</span>
          {user?.email ? (
            <span className="block truncate text-[11px] font-normal text-ink-soft">{user.email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Admin desk
            </Link>
          </DropdownMenuItem>
        ) : null}
        {status === "member" ? (
          <DropdownMenuItem asChild>
            <Link href="/me">
              <UserRound className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> My record
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
