"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { MonoLabel } from "@/components/sheet";
import { displayPhone } from "@/lib/phone";
import { templates, waLink } from "@/lib/whatsapp";

export function NotifyFamilyDialog({ member, members }) {
  const message = templates.addressChanged(member);
  const recipients = members
    .filter((item) => item.id !== member.id)
    .map((item) => ({
      member: item,
      href: waLink(item.whatsappNumber || item.contactNumber, message)
    }))
    .filter((item) => item.href);
  const skipped = members.length - 1 - recipients.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Notify family
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tell the family</DialogTitle>
          <DialogDescription>
            One WhatsApp chat per person, opened only when you choose. On a computer the link
            opens WhatsApp Web; on a phone it opens the app. Nothing is sent until you press send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="border border-border bg-paper p-3">
            <MonoLabel>Message</MonoLabel>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed">{message}</p>
          </div>

          {recipients.length === 0 ? (
            <p className="border border-dashed border-border px-3 py-4 text-xs text-ink-soft">
              No other records have a WhatsApp number yet.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto border-y border-border">
              {recipients.map(({ member: relative, href }) => (
                <li key={relative.id}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 py-2 text-sm hover:text-ink"
                  >
                    <span className="min-w-0 flex-1 truncate">{relative.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-soft">
                      {displayPhone(relative.whatsappNumber || relative.contactNumber)}
                    </span>
                    <span className="mono-caption shrink-0 text-ochre">Send →</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] leading-relaxed text-ink-soft">
            {skipped > 0
              ? `${skipped} relative${skipped === 1 ? " is" : "s are"} skipped because no number is saved.`
              : "Every other record has a number."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
