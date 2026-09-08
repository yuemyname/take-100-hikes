import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CollectionId, Mountain } from '@/types';

export interface CollectionDefinition {
  id: CollectionId;
  name: string;
  shortName: string;
  description: string;
  targetCount: number;
  accent: 'blue' | 'red';
}

export const COLLECTIONS: readonly CollectionDefinition[] = [
  {
    id: 'forest_service_100',
    name: '산림청 100대 명산',
    shortName: '산림청 100',
    description: '산림청이 선정한 대한민국 대표 명산 100곳',
    targetCount: 100,
    accent: 'blue',
  },
  {
    id: 'bac_100',
    name: 'BAC 명산100 기준',
    shortName: 'BAC 100',
    description: 'BLACKYAK CLUB 명산100 기준으로 채우는 컬렉션',
    targetCount: 100,
    accent: 'red',
  },
] as const;

const STORAGE_KEY = '100peaks.primaryCollection';
const queryKey = ['primaryCollection'] as const;

export const getCollection = (id: CollectionId) => COLLECTIONS.find((c) => c.id === id) ?? COLLECTIONS[0];

export function usePrimaryCollection() {
  const queryClient = useQueryClient();
  const selected = useQuery({
    queryKey,
    queryFn: async (): Promise<CollectionId> => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      return saved === 'bac_100' ? 'bac_100' : 'forest_service_100';
    },
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: async (id: CollectionId) => {
      await AsyncStorage.setItem(STORAGE_KEY, id);
      return id;
    },
    onSuccess: (id) => queryClient.setQueryData(queryKey, id),
  });

  const id = selected.data ?? 'forest_service_100';
  return {
    id,
    collection: getCollection(id),
    isLoading: selected.isLoading,
    setPrimaryCollection: mutation.mutate,
    isSaving: mutation.isPending,
  };
}

const normalize = (name: string) =>
  name
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/산$/, '산');

/**
 * Forestry rows already make up the current local 100-mountain seed.
 * BAC currently maps 79 of those rows. The remaining BAC-only entries are kept
 * in docs/data/bac100-candidates.csv until their verification points/coordinates
 * are verified and inserted as real mountain rows. Never synthesize coordinates.
 */
const BAC_MATCHED_FORESTRY_NAMES = new Set(
  [
    '관악산','도봉산','북한산','금정산','비슬산','마니산','무등산','계룡산','신불산','가지산','명지산','화악산','유명산','감악산','천마산','소요산','용문산',
    '가리산','가리왕산','계방산','덕항산','두타산','방태산','백덕산','백운산','삼악산','설악산','오대산','오봉산','용화산','응봉산','치악산','태백산','태화산','팔봉산',
    '구병산','금수산','대야산','도락산','민주지산','속리산','월악산','천태산','대둔산','칠갑산','변산','내장산','덕유산','마이산','모악산','선운산','운장산','장안산',
    '두륜산','방장산','백암산','월출산','조계산','천관산','팔영산','금오산','남산','내연산','소백산','주왕산','주흘산','청량산','팔공산','황악산','가야산','재약산',
    '지리산','천성산','화왕산','황매산','황석산','운악산','한라산',
  ].map(normalize),
);

export function isMountainInCollection(mountain: Mountain, collectionId: CollectionId): boolean {
  if (collectionId === 'forest_service_100') return true;
  return BAC_MATCHED_FORESTRY_NAMES.has(normalize(mountain.name_ko));
}

export function mountainsForCollection(mountains: Mountain[], collectionId: CollectionId): Mountain[] {
  return mountains.filter((m) => isMountainInCollection(m, collectionId));
}

export function completedCountForCollection(
  mountains: Mountain[],
  completedIds: Set<string>,
  collectionId: CollectionId,
): number {
  return mountains.filter((m) => completedIds.has(m.id) && isMountainInCollection(m, collectionId)).length;
}

export const BAC_CONNECTED_COUNT = 79;
export const BAC_PENDING_COUNT = 21;
