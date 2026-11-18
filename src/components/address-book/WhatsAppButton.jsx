"use client";

import { MessageCircle } from "lucide-react";
import { waLink, templates } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

export function WhatsAppButton({ member, text, label = "WhatsApp", variant = "outline", addHref }) {
  const href = waLink(member.whatsappNumber || member.contactNumber, text ?? templates.shareAddress(member));

  if (!href) {
    if (addHref) {
      return (
        <Button asChild variant="outline" size="sm">
          <a href={addHref}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Add a number
          </a>
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        title="No phone number on this record yet"
        aria-label={`No WhatsApp number for ${member.name}`}
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size="sm">
      <a href={href} target="_blank" rel="noreferrer" aria-label={`Message ${member.name} on WhatsApp`}>
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{label}</span>
      </a>
    </Button>
  );
}
