import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { mountainKeys } from '@/features/mountains';

import {
  fetchCertifiedUsers,
  fetchCompletedMountains,
  fetchFollowSets,
  fetchMountainCertificationHistory,
  fetchProfile,
  fetchProfileStats,
  fetchProfilesByIds,
  resolveViewerId,
  searchProfiles,
  setFollow,
  updateProfile,
} from './api';
import { relationshipOf, type FollowSets, type UpdateProfileInput } from './types';

export const socialKeys = {
  profile: (id: string) => ['profile', id] as const,
  profiles: (ids: string[]) => ['profiles', ...ids] as const,
  search: (viewerId: string, term: string) => ['profiles', 'search', viewerId, term] as const,
  followSets: (viewerId: string) => ['follows', viewerId] as const,
  certifiers: (mountainId: string, viewerId: string) => ['certifiers', mountainId, viewerId] as const,
  completed: (userId: string) => ['completedMountains', userId] as const,
  history: (userId: string, mountainId: string) => ['mountainCertificationHistory', userId, mountainId] as const,
  stats: (userId: string) => ['profileStats', userId] as const,
};

export function useViewerId(): string {
  const { user } = useAuth();
  return resolveViewerId(user?.id ?? null);
}

export function useProfile(id: string | undefined) {
  return useQuery({ queryKey: socialKeys.profile(id ?? ''), queryFn: () => fetchProfile(id ?? ''), enabled: Boolean(id) });
}

export function useUpdateProfile() {
  const viewerId = useViewerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(viewerId, input),
    onSuccess: (profile) => {
      queryClient.setQueryData(socialKeys.profile(viewerId), profile);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['certifiers'] });
      queryClient.invalidateQueries({ queryKey: ['certificationSession'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitableFriends'] });
    },
  });
}

export function useProfilesByIds(ids: string[]) {
  return useQuery({ queryKey: socialKeys.profiles(ids), queryFn: () => fetchProfilesByIds(ids), enabled: ids.length > 0 });
}

export function useProfileSearch(term: string) {
  const viewerId = useViewerId();
  const trimmed = term.trim();
  return useQuery({
    queryKey: socialKeys.search(viewerId, trimmed),
    queryFn: () => searchProfiles(trimmed, viewerId),
    enabled: trimmed.length > 0,
  });
}

/** The viewer's follow graph: following / followers / mutual (spec §7.1). */
export function useFollowSets() {
  const viewerId = useViewerId();
  return useQuery({ queryKey: socialKeys.followSets(viewerId), queryFn: () => fetchFollowSets(viewerId) });
}

export function useRelationship(otherId: string | undefined) {
  const sets = useFollowSets();
  return {
    ...sets,
    relationship: sets.data && otherId ? relationshipOf(sets.data, otherId) : null,
  };
}

export function useToggleFollow() {
  const viewerId = useViewerId();
  const queryClient = useQueryClient();
  const key = socialKeys.followSets(viewerId);

  return useMutation({
    mutationFn: ({ targetId, follow }: { targetId: string; follow: boolean }) => setFollow(viewerId, targetId, follow),
    onMutate: async ({ targetId, follow }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FollowSets>(key);
      if (previous) {
        const following = new Set(previous.following);
        if (follow) following.add(targetId);
        else following.delete(targetId);
        const mutual = new Set([...following].filter((id) => previous.followers.has(id)));
        queryClient.setQueryData<FollowSets>(key, { ...previous, following, mutual });
      }
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: (_d, _e, { targetId }) => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: socialKeys.stats(targetId) });
      queryClient.invalidateQueries({ queryKey: socialKeys.stats(viewerId) });
      // Mutual-first ordering on mountain pages depends on the follow graph.
      queryClient.invalidateQueries({ queryKey: ['certifiers'] });
    },
  });
}

/** Certified users of a mountain, mutual friends first (spec §4.3, §7.2). */
export function useCertifiedUsers(mountainId: string | undefined) {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: socialKeys.certifiers(mountainId ?? '', viewerId),
    queryFn: () => fetchCertifiedUsers(mountainId ?? '', viewerId),
    enabled: Boolean(mountainId),
  });
}

export function useCompletedMountains(userId: string | undefined) {
  return useQuery({
    queryKey: socialKeys.completed(userId ?? ''),
    queryFn: () => fetchCompletedMountains(userId ?? ''),
    enabled: Boolean(userId),
  });
}

export function useMountainCertificationHistory(mountainId: string | undefined) {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: socialKeys.history(viewerId, mountainId ?? ''),
    queryFn: () => fetchMountainCertificationHistory(viewerId, mountainId ?? ''),
    enabled: Boolean(mountainId),
  });
}

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: socialKeys.stats(userId ?? ''),
    queryFn: () => fetchProfileStats(userId ?? ''),
    enabled: Boolean(userId),
  });
}

/** Query keys other features must invalidate when certifications change. */
export const invalidateAfterCertification = (queryClient: ReturnType<typeof useQueryClient>, userId: string) => {
  queryClient.invalidateQueries({ queryKey: ['certifiers'] });
  queryClient.invalidateQueries({ queryKey: ['mountainCertificationHistory'] });
  queryClient.invalidateQueries({ queryKey: socialKeys.completed(userId) });
  queryClient.invalidateQueries({ queryKey: socialKeys.stats(userId) });
  queryClient.invalidateQueries({ queryKey: mountainKeys.all });
};
