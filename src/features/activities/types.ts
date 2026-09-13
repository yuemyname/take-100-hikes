import type { HikingActivityVisibility } from '@/types';
import type { HealthKitHikingWorkout } from '@/features/healthkit';

export interface CreateManualActivityInput {
  mountainId: string | null;
  startedAt: string;
  endedAt: string;
  movingSeconds: number;
  distanceM: number;
  elevationGainM: number | null;
  note: string | null;
  visibility: HikingActivityVisibility;
}

export interface ImportHealthKitActivityInput extends HealthKitHikingWorkout {
  visibility: HikingActivityVisibility;
}

export function formatActivityDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}분`;
  return minutes === 0 ? `${hours}시간` : `${hours}시간 ${minutes}분`;
}

export function formatActivityDistance(distanceM: number): string {
  return `${(distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1)}km`;
}

export function formatActivityPace(secondsPerKm: number): string {
  const rounded = Math.max(0, Math.round(secondsPerKm));
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}'${String(seconds).padStart(2, '0')}\"/km`;
}

export function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}
