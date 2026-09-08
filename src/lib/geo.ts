export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6_371_000;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Haversine great-circle distance in meters — 100PEAKS_MASTER_SPEC.md §14. */
export function getDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface EligibilityInput {
  distanceMeters: number;
  verificationRadiusM: number;
  locationPermissionGranted: boolean;
  currentPositionAvailable: boolean;
}

/** Client-side certification eligibility — spec §14. Server must recheck. */
export function isWithinVerificationRadius(input: EligibilityInput): boolean {
  return (
    input.locationPermissionGranted &&
    input.currentPositionAvailable &&
    input.distanceMeters <= input.verificationRadiusM
  );
}

/** Human-readable distance for UI copy, e.g. "37m" or "1.2km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
