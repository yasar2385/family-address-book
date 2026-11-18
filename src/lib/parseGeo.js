const PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&](?:q|query|destination|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/
];

export function extractCoordinates(value) {
  if (!value) return null;
  for (const pattern of PATTERNS) {
    const match = String(value).match(pattern);
    if (match) {
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);
      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180
      ) {
        return { latitude, longitude };
      }
    }
  }
  return null;
}

export function mapsLink(latitude, longitude) {
  if (latitude === null || longitude === null || latitude === "" || longitude === "") return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
