import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Mountain } from '@/types';

import {
  fetchCompletedMountainIds,
  fetchFavoriteMountainIds,
  fetchMountain,
  fetchMountains,
  setFavorite,
} from './api';

export const mountainKeys = {
  all: ['mountains'] as const,
  detail: (id: string) => ['mountains', id] as const,
  completed: (userId: string | null) => ['mountains', 'completed', userId] as const,
  favorites: (userId: string | null) => ['mountains', 'favorites', userId] as const,
};

export function useMountains() {
  return useQuery({ queryKey: mountainKeys.all, queryFn: fetchMountains });
}

export function useMountain(id: string | undefined) {
  return useQuery({
    queryKey: mountainKeys.detail(id ?? ''),
    queryFn: () => fetchMountain(id ?? ''),
    enabled: Boolean(id),
  });
}

/** Distinct completed mountain ids for the current user (spec §10.2, §10.9). */
export function useCompletedMountainIds() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey: mountainKeys.completed(userId),
    queryFn: () => fetchCompletedMountainIds(userId),
  });
}

/**
 * Favorites with optimistic toggling. In guest / unconfigured mode the set
 * lives in memory only so the UI still responds.
 */
export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const key = mountainKeys.favorites(userId);
  const remote = isSupabaseConfigured && Boolean(userId);

  const query = useQuery({ queryKey: key, queryFn: () => fetchFavoriteMountainIds(userId) });
  const [localOverride, setLocalOverride] = useState<Set<string> | null>(null);

  const favorites = useMemo(() => localOverride ?? query.data ?? new Set<string>(), [localOverride, query.data]);

  const mutation = useMutation({
    mutationFn: ({ mountainId, favorite }: { mountainId: string; favorite: boolean }) =>
      setFavorite(userId ?? '', mountainId, favorite),
    onMutate: async ({ mountainId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Set<string>>(key);
      const next = new Set(previous ?? []);
      if (favorite) next.add(mountainId);
      else next.delete(mountainId);
      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const toggle = useCallback(
    (mountainId: string) => {
      const favorite = !favorites.has(mountainId);
      if (!remote) {
        const next = new Set(favorites);
        if (favorite) next.add(mountainId);
        else next.delete(mountainId);
        setLocalOverride(next);
        return;
      }
      mutation.mutate({ mountainId, favorite });
    },
    [favorites, mutation, remote],
  );

  return {
    favorites,
    isLoading: query.isLoading,
    isError: query.isError,
    toggle,
    isToggling: mutation.isPending,
  };
}

export type MountainFilter = 'all' | 'region' | 'done' | 'todo';

export const MOUNTAIN_FILTERS: { key: MountainFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'region', label: '지역별' },
  { key: 'done', label: '내 인증' },
  { key: 'todo', label: '미인증' },
];

/** Region order used for the 지역별 filter and profile region progress (spec §8). */
export const REGION_ORDER = ['서울·경기', '강원', '충청', '전라', '경상', '제주'] as const;

export function filterMountains(
  mountains: Mountain[],
  options: { filter: MountainFilter; region: string | null; search: string; completed: Set<string> },
): Mountain[] {
  const term = options.search.trim().toLowerCase();
  return mountains.filter((m) => {
    if (term && !m.name_ko.toLowerCase().includes(term) && !(m.name_en ?? '').toLowerCase().includes(term)) return false;
    switch (options.filter) {
      case 'done':
        return options.completed.has(m.id);
      case 'todo':
        return !options.completed.has(m.id);
      case 'region':
        return options.region ? m.region === options.region : true;
      case 'all':
      default:
        return true;
    }
  });
}

export function countByRegion(mountains: Mountain[], completed: Set<string>): { region: string; done: number; total: number }[] {
  return REGION_ORDER.map((region) => {
    const inRegion = mountains.filter((m) => m.region === region);
    return { region, total: inRegion.length, done: inRegion.filter((m) => completed.has(m.id)).length };
  });
}
