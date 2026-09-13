import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import type { HealthKitHikingWorkout } from './types';

/** HealthKit is a native Apple API and is intentionally unavailable in Expo Go. */
export function canUseHealthKitInThisBuild(): boolean {
  return Platform.OS === 'ios' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

function elevationFromMetadata(metadata: Record<string, unknown>): number | null {
  const value = metadata.HKElevationAscended;
  if (!value || typeof value !== 'object' || !('quantity' in value)) return null;
  const quantity = Number((value as { quantity: unknown }).quantity);
  return Number.isFinite(quantity) && quantity >= 0 ? Math.round(quantity) : null;
}

export async function readRecentHikingWorkouts(): Promise<HealthKitHikingWorkout[]> {
  if (!canUseHealthKitInThisBuild()) {
    throw new Error('HEALTHKIT_BUILD_REQUIRED');
  }

  // Load the native package only after the TestFlight/runtime guard. Importing
  // it eagerly inside Expo Go can fail before we can show a useful message.
  const healthKit = await import('@kingstinct/react-native-healthkit');
  if (!(await healthKit.isHealthDataAvailableAsync())) {
    throw new Error('HEALTHKIT_UNAVAILABLE');
  }

  await healthKit.requestAuthorization({ toRead: [healthKit.WorkoutTypeIdentifier] });

  const since = new Date();
  since.setMonth(since.getMonth() - 6);
  const samples = await healthKit.queryWorkoutSamples({
    limit: 60,
    ascending: false,
    filter: {
      workoutActivityType: healthKit.WorkoutActivityType.hiking,
      date: { startDate: since },
    },
  });

  const workouts = await Promise.all(
    samples.map(async (sample) => {
      const sourceIdHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        sample.uuid,
      );
      return {
        sourceIdHash,
        startedAt: new Date(sample.startDate).toISOString(),
        endedAt: new Date(sample.endDate).toISOString(),
        movingSeconds: Math.round(sample.duration.quantity),
        distanceM: Math.round(sample.totalDistance?.quantity ?? 0),
        elevationGainM: elevationFromMetadata(sample.metadata),
      } satisfies HealthKitHikingWorkout;
    }),
  );

  return workouts.filter((workout) => workout.movingSeconds >= 60 && workout.distanceM >= 100);
}
