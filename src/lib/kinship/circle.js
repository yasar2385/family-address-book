import { bearingDeg, distanceKm, hasCoords } from "../geo";

export const RINGS = [5, 10, 25, 50];
export const RING_RADIUS = { 5: 0.22, 10: 0.42, 25: 0.68, 50: 0.94 };

export function ringFor(km) {
  return RINGS.find((ring) => km <= ring) || RINGS[RINGS.length - 1];
}

export function radiusFor(km) {
  if (km <= 0) return 0;
  if (km >= RINGS[RINGS.length - 1]) return RING_RADIUS[RINGS[RINGS.length - 1]];
  const ring = ringFor(km);
  const index = RINGS.indexOf(ring);
  const previous = index === 0 ? 0 : RINGS[index - 1];
  const previousRadius = index === 0 ? 0 : RING_RADIUS[previous];
  const t = (km - previous) / (ring - previous);
  return previousRadius + t * (RING_RADIUS[ring] - previousRadius);
}

export function placeRelatives(centre, members, { maxKm = 50 } = {}) {
  if (!hasCoords(centre)) return [];
  return members
    .filter((member) => member.id !== centre.id && hasCoords(member))
    .map((member) => {
      const km = distanceKm(centre, member);
      if (km === null || km > maxKm) return null;
      const bearing = bearingDeg(centre, member) ?? 0;
      const radius = radiusFor(km);
      const radians = (bearing * Math.PI) / 180;
      return {
        member,
        km,
        bearing,
        radius,
        ring: ringFor(km),
        x: radius * Math.sin(radians),
        y: -radius * Math.cos(radians)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.km - b.km);
}
