import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getDistanceMeters, isWithinVerificationRadius } from '@/lib/geo';
import { hasVerificationCoordinates } from '@/features/mountains/api';
import type { Mountain } from '@/types';

import type { LocationPermission, SummitProximity } from './types';

/**
 * Live distance from the device to a mountain's summit — spec §5.1, §14.
 * Requests foreground permission, then watches the position while mounted.
 */
export function useSummitProximity(mountain: Mountain | null | undefined): SummitProximity {
  const [permission, setPermission] = useState<LocationPermission>('undetermined');
  const [position, setPosition] = useState<SummitProximity['position']>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  const applyLocation = useCallback((loc: Location.LocationObject) => {
    setPosition({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracyM: loc.coords.accuracy ?? null,
    });
    setError(null);
  }, []);

  const startWatching = useCallback(async () => {
    subscription.current?.remove();
    setIsLocating(true);
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      applyLocation(current);
      subscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 3 },
        applyLocation,
        () => setError('위치를 잡지 못했어요. 하늘이 보이는 곳에서 다시 시도해주세요.'),
      );
    } catch {
      setError('위치를 잡지 못했어요. 하늘이 보이는 곳에서 다시 시도해주세요.');
    } finally {
      setIsLocating(false);
    }
  }, [applyLocation]);

  const requestPermission = useCallback(async () => {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      if (result.status === 'granted') {
        setPermission('granted');
        await startWatching();
      } else {
        setPermission('denied');
      }
    } catch {
      setPermission('denied');
    }
  }, [startWatching]);

  useEffect(() => {
    let cancelled = false;
    Location.getForegroundPermissionsAsync()
      .then((result) => {
        if (cancelled) return;
        if (result.status === 'granted') {
          setPermission('granted');
          return startWatching();
        }
        setPermission(result.status === 'denied' && !result.canAskAgain ? 'denied' : 'undetermined');
        return undefined;
      })
      .catch(() => {
        if (!cancelled) setPermission('undetermined');
      });
    return () => {
      cancelled = true;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [startWatching]);

  const target = hasVerificationCoordinates(mountain) ? mountain : null;
  const distanceMeters =
    position && target
      ? getDistanceMeters(position, { latitude: target.latitude, longitude: target.longitude })
      : null;

  const eligible =
    distanceMeters !== null && target
      ? isWithinVerificationRadius({
          distanceMeters,
          verificationRadiusM: target.verification_radius_m,
          locationPermissionGranted: permission === 'granted',
          currentPositionAvailable: position !== null,
        })
      : false;

  return {
    permission,
    position,
    distanceMeters,
    eligible,
    isLocating,
    error,
    requestPermission,
    refresh: startWatching,
  };
}
