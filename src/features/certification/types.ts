export type LocationPermission = 'undetermined' | 'granted' | 'denied';

export interface SummitProximity {
  permission: LocationPermission;
  /** Current device position, once available. */
  position: { latitude: number; longitude: number; accuracyM: number | null } | null;
  distanceMeters: number | null;
  /** Client-side eligibility — spec §14. The server rechecks on insert. */
  eligible: boolean;
  isLocating: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Everything captured at the summit — spec §5.2 required fields. */
export interface CaptureDraft {
  mountainId: string;
  photoUri: string;
  latitude: number;
  longitude: number;
  gpsAccuracyM: number | null;
  capturedAt: string;
  verificationRadiusM: number;
  distanceMeters: number;
}

export interface CreatedCertification {
  sessionId: string;
  mountainId: string;
  photoUrl: string;
  capturedAt: string;
  /** True the first time this user completes this mountain (spec §10.2). */
  newlyCollected: boolean;
}
