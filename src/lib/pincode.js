let cache = null;

export function validatePincode(value) {
  return /^[1-9][0-9]{5}$/.test(String(value || "").trim());
}

export async function loadPincodes() {
  if (!cache) {
    cache = fetch("/data/pincodes.json")
      .then((response) => (response.ok ? response.json() : { pincodes: {} }))
      .then((data) => data.pincodes || data || {})
      .catch(() => ({}));
  }
  return cache;
}

export async function lookupPincode(value) {
  if (!validatePincode(value)) return null;
  const data = await loadPincodes();
  return data[String(value).trim()] || null;
}
