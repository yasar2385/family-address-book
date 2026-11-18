export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonthDay(value) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}

export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return "";
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function formatAddress(source) {
  if (!source) return "No address yet";
  const parts = [
    source.addressLine1,
    source.addressLine2,
    source.city,
    source.district,
    source.state,
    source.pincode
  ].filter((part) => typeof part === "string" && part.trim());
  return parts.length ? parts.join(", ") : "No address yet";
}

export function formatArea(source) {
  if (!source) return "No area";
  const parts = [source.city, source.district].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return source.state || "No area";
}

export function formatAreaState(source) {
  const parts = [source?.city, source?.district, source?.state].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function initials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function isAlive(member) {
  return member?.isAlive !== false;
}

export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
