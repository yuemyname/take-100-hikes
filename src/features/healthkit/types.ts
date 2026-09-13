export interface HealthKitHikingWorkout {
  sourceIdHash: string;
  startedAt: string;
  endedAt: string;
  movingSeconds: number;
  distanceM: number;
  elevationGainM: number | null;
}
