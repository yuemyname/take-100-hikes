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

type StoredSelection = { id: CollectionId; hasChosen: boolean };

export const DEFAULT_COLLECTION: CollectionDefinition = COLLECTIONS[0] as CollectionDefinition;

export const getCollection = (id: CollectionId): CollectionDefinition =>
  COLLECTIONS.find((c) => c.id === id) ?? DEFAULT_COLLECTION;

export function usePrimaryCollection() {
  const queryClient = useQueryClient();
  const selected = useQuery({
    queryKey,
    queryFn: async (): Promise<StoredSelection> => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'bac_100') return { id: 'bac_100', hasChosen: true };
      if (saved === 'forest_service_100') return { id: 'forest_service_100', hasChosen: true };
      return { id: 'forest_service_100', hasChosen: false };
    },
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: async (id: CollectionId) => {
      await AsyncStorage.setItem(STORAGE_KEY, id);
      return id;
    },
    onSuccess: (id) => queryClient.setQueryData<StoredSelection>(queryKey, { id, hasChosen: true }),
  });

  const id = selected.data?.id ?? 'forest_service_100';
  return {
    id,
    collection: getCollection(id),
    hasChosen: selected.data?.hasChosen ?? false,
    isLoading: selected.isLoading,
    setPrimaryCollection: mutation.mutate,
    isSaving: mutation.isPending,
  };
}

const normalize = (name: string) => name.replace(/\s+/g, '').replace(/\([^)]*\)/g, '');

/**
 * Full BAC 100 names. BAC-only identities are present even while their GPS
 * verification points remain pending and certification stays disabled.
 */
const BAC_NAMES = new Set(
  [
    '관악산','도봉산','북한산','수락산','청계산','금정산','비슬산','마니산','무등산','계룡산','신불산','가지산','연인산','명지산','화악산','유명산','감악산','천마산','소요산','용문산',
    '가리산','가리왕산','계방산','덕항산','두타산','방태산','백덕산','백운산','삼악산','설악산','오대산','오대산 노인봉','오봉산','용화산','응봉산','치악산','태백산','태화산','팔봉산','함백산',
    '구병산','금수산','대야산','도락산','민주지산','속리산','월악산','천태산','청화산','칠보산','가야산','광덕산','대둔산','오서산','용봉산','칠갑산','구봉산','변산','내장산',
    '덕유산','마이산','모악산','선운산','운장산','장안산','지리산','지리산 바래봉','지리산 반야봉','달마산','덕룡산','동악산','두륜산','방장산','백암산','백운산','불갑산','월출산','조계산','천관산','팔영산',
    '금오산','남산','내연산','소백산','조령산','주왕산','주흘산','청량산','팔공산','황악산','재약산','천성산','화왕산','황매산','황석산','운악산','한라산',
  ].map(normalize),
);

export function isMountainInCollection(mountain: Mountain, collectionId: CollectionId): boolean {
  // Until collection_mountains becomes the client source of truth, preserve the
  // original 100-row Forestry view and keep the newly appended BAC-only rows out.
  if (collectionId === 'forest_service_100') return (mountain.display_order ?? Number.MAX_SAFE_INTEGER) <= 100;

  // These are distinct same-name Forestry mountains, not BAC challenge targets.
  if (mountain.slug === 'baegunsan-pocheon' || mountain.slug === 'jirisan-tongyeong') return false;

  if (normalize(mountain.name_ko) === '축령산') {
    return /장성|전남|전라/.test(mountain.region ?? '') || /장성/.test(mountain.name_ko);
  }

  return BAC_NAMES.has(normalize(mountain.name_ko));
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

export const BAC_CONNECTED_COUNT = 100;
export const BAC_PENDING_COUNT = 21;
