import { formatAddress } from "./format";
import { waNumber } from "./phone";

export function waLink(number, text = "") {
  const digits = waNumber(number);
  if (!digits) return null;
  const suffix = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${suffix}`;
}

export const templates = {
  shareAddress(member) {
    const lines = [
      `${member.name}'s address`,
      formatAddress(member)
    ];
    if (member.googleMapUrl) lines.push(member.googleMapUrl);
    return lines.join("\n");
  },

  requestUpdate(member, joinUrl) {
    return [
      `Vanakkam ${member.name},`,
      "We are updating the family register. Please confirm your current address using this private link:",
      joinUrl,
      "The link works once and can be opened on your phone."
    ].join("\n");
  },

  addressChanged(member) {
    return [
      `${member.name} updated their address.`,
      formatAddress(member)
    ].join("\n");
  },

  sendJoinLink(member, joinUrl, senderName) {
    return [
      `${senderName || "The family"} added you to the family register.`,
      `Claim your record and keep your address current: ${joinUrl}`,
      "This link works once."
    ].join("\n");
  }
};
