import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useViewerId } from '@/features/social';
import type { HikingActivityVisibility, PaceLeaderboardScope } from '@/types';

import {
  attachActivityToCertification,
  createManualActivity,
  fetchActivityCertificationOptions,
  fetchMyHealthKitWorkoutHashes,
  fetchMyActivities,
  fetchPaceLeaderboard,
  importHealthKitActivity,
  setActivityRankingOptIn,
  updateActivityVisibility,
} from './api';
import type { CreateManualActivityInput, ImportHealthKitActivityInput } from './types';

export const activityKeys = {
  mine: (userId: string) => ['hikingActivities', 'mine', userId] as const,
  certifications: (userId: string) => ['hikingActivities', 'certifications', userId] as const,
  healthKitHashes: (userId: string) => ['hikingActivities', 'healthKitHashes', userId] as const,
  leaderboard: (mountainId: string, scope: PaceLeaderboardScope) =>
    ['hikingActivities', 'leaderboard', mountainId, scope] as const,
};

export function useMyActivities() {
  const userId = useViewerId();
  return useQuery({
    queryKey: activityKeys.mine(userId),
    queryFn: () => fetchMyActivities(userId),
  });
}

export function useCreateManualActivity() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManualActivityInput) => createManualActivity(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.mine(userId) }),
  });
}

export function useUpdateActivityVisibility() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, visibility }: { activityId: string; visibility: HikingActivityVisibility }) =>
      updateActivityVisibility(userId, activityId, visibility),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.mine(userId) }),
  });
}

export function useImportHealthKitActivity() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportHealthKitActivityInput) => importHealthKitActivity(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.mine(userId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.healthKitHashes(userId) });
    },
  });
}

export function useMyHealthKitWorkoutHashes() {
  const userId = useViewerId();
  return useQuery({
    queryKey: activityKeys.healthKitHashes(userId),
    queryFn: () => fetchMyHealthKitWorkoutHashes(userId),
  });
}

export function useActivityCertificationOptions() {
  const userId = useViewerId();
  return useQuery({
    queryKey: activityKeys.certifications(userId),
    queryFn: () => fetchActivityCertificationOptions(userId),
  });
}

export function useAttachActivityToCertification() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, certificationId }: { activityId: string; certificationId: string }) =>
      attachActivityToCertification(userId, activityId, certificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activityKeys.mine(userId) }),
  });
}

export function useSetActivityRankingOptIn() {
  const userId = useViewerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, optIn }: { activityId: string; optIn: boolean }) =>
      setActivityRankingOptIn(userId, activityId, optIn),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hikingActivities'] }),
  });
}

export function usePaceLeaderboard(mountainId: string | null, scope: PaceLeaderboardScope) {
  const userId = useViewerId();
  return useQuery({
    queryKey: activityKeys.leaderboard(mountainId ?? '', scope),
    queryFn: () => fetchPaceLeaderboard(userId, mountainId ?? '', scope),
    enabled: Boolean(mountainId),
  });
}
