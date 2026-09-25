const KM_PER_DEGREE_LATITUDE = 111.32;

/**
 * Distance between two points in kilometres, using an equirectangular
 * approximation. Accurate to well under a percent at the distances this app
 * deals in (a few km), and far cheaper than haversine.
 *
 * Longitude degrees narrow away from the equator, hence the cos() term.
 */
export function distanceKm(
  fromLongitude: number,
  fromLatitude: number,
  toLongitude: number,
  toLatitude: number
): number {
  const latitudeKm = (fromLatitude - toLatitude) * KM_PER_DEGREE_LATITUDE;
  const longitudeKm =
    (fromLongitude - toLongitude) *
    KM_PER_DEGREE_LATITUDE *
    Math.cos((fromLatitude * Math.PI) / 180);
  return Math.sqrt(latitudeKm * latitudeKm + longitudeKm * longitudeKm);
}

/** "800m" under a kilometre, "2.4km" above it. */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "";
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// The API sends coordinates as strings on some endpoints ("5.6000000") and
// numbers on others.
export function toCoordinate(value: string | number | null | undefined): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
