const EARTH_RADIUS_KM = 6371;

export function hasCoords(member) {
  const lat = Number(member?.latitude);
  const lng = Number(member?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export function distanceKm(a, b) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const lat1 = (Number(a.latitude) * Math.PI) / 180;
  const lat2 = (Number(b.latitude) * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((Number(b.longitude) - Number(a.longitude)) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDeg(a, b) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const lat1 = (Number(a.latitude) * Math.PI) / 180;
  const lat2 = (Number(b.latitude) * Math.PI) / 180;
  const dLng = ((Number(b.longitude) - Number(a.longitude)) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function compass(bearing) {
  if (bearing === null || bearing === undefined) return "—";
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(((bearing % 360) / 45)) % 8];
}

export function formatKm(km) {
  if (km === null || km === undefined || !Number.isFinite(km)) return "—";
  if (km < 1) return "<1 km";
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
