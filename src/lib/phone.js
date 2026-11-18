export function normalizePhone(input) {
  if (!input) return null;
  let digits = String(input).replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

export function waNumber(input) {
  const normalized = normalizePhone(input);
  return normalized ? normalized.slice(1) : null;
}

export function displayPhone(input) {
  const normalized = normalizePhone(input);
  if (!normalized) return input || "—";
  return `+91 ${normalized.slice(3, 8)} ${normalized.slice(8)}`;
}

export function isValidPhone(input) {
  return normalizePhone(input) !== null;
}
