import { FlatList } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MountainMap } from '@/components/mountains';
import { AppText, CollectionSwitcher, EmptyState, LoadingSkeleton, MountainCard, Pill, SearchField, SegmentedControl, TopBar } from '@/components/ui';
import { spacing, colors } from '@/constants';
import { BAC_PENDING_COUNT, completedCountForCollection, mountainsForCollection, usePrimaryCollection } from '@/features/collections';
import {
  MOUNTAIN_FILTERS,
  REGION_ORDER,
  filterMountains,
  useMountains,
  type MountainFilter,
} from '@/features/mountains';
import { useCompletedMountains, useViewerId } from '@/features/social';
import type { Mountain } from '@/types';

const DEFAULT_MOUNTAIN_PHOTO = require('../../assets/photos/home-hero.png');
const VIEW_OPTIONS = [
  { key: 'list', label: '리스트' },
  { key: 'map', label: '지도' },
] as const;

type CatalogView = (typeof VIEW_OPTIONS)[number]['key'];

export default function MountainsScreen() {
  const router = useRouter();
  const [catalogView, setCatalogView] = useState<CatalogView>('list');
  const [filter, setFilter] = useState<MountainFilter>('all');
  const [region, setRegion] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { id: collectionId, collection } = usePrimaryCollection();
  const viewerId = useViewerId();

  const mountains = useMountains();
  const completedQuery = useCompletedMountains(viewerId);
  const completed = useMemo(
    () => new Set((completedQuery.data ?? []).map((record) => record.mountainId)),
    [completedQuery.data],
  );
  const completionByMountain = useMemo(
    () => new Map((completedQuery.data ?? []).map((record) => [record.mountainId, record])),
    [completedQuery.data],
  );
  const collectionMountains = useMemo(
    () => mountainsForCollection(mountains.data ?? [], collectionId),
    [mountains.data, collectionId],
  );
  const collectionDone = useMemo(
    () => completedCountForCollection(mountains.data ?? [], completed, collectionId),
    [mountains.data, completed, collectionId],
  );

  const visible = useMemo(
    () => filterMountains(collectionMountains, { filter, region, search, completed }),
    [collectionMountains, filter, region, search, completed],
  );

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    collectionMountains.forEach((m, i) => map.set(m.id, i + 1));
    return map;
  }, [collectionMountains]);

  const mapContent = catalogView === 'map' ? (() => {
    if (mountains.isLoading || completedQuery.isLoading) {
      return (
        <View style={styles.mapState}>
          <LoadingSkeleton height={520} radius={24} />
        </View>
      );
    }

    if (mountains.isError || completedQuery.isError) {
      return (
        <View style={styles.mapState}>
          <EmptyState
            mascot={false}
            title="지도를 불러오지 못했어요"
            description="잠깐 연결이 끊겼어요. 다시 시도해주세요."
            actionLabel="다시 시도"
            onAction={() => {
              mountains.refetch();
              completedQuery.refetch();
            }}
          />
        </View>
      );
    }

    return (
      <MountainMap
        mountains={visible}
        completedIds={completed}
        onPressMountain={(id) => router.push({ pathname: '/mountain/[id]', params: { id } })}
      />
    );
  })() : null;

  const header = (
    <View style={styles.header}>
      <TopBar title="명산 도감" />
      <View style={styles.challenge}>
        <CollectionSwitcher showDescription />
      </View>
      {collectionId === 'bac_100' ? (
        <View style={styles.pendingNotice}>
          <AppText variant="caption" color="inkMuted">
            BAC 100개 산 정체성 연결 · 전용 {BAC_PENDING_COUNT}개는 인증지 좌표 검증 중
          </AppText>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {MOUNTAIN_FILTERS.map((item) => (
          <Pill
            key={item.key}
            label={item.label}
            tone="blue"
            selected={item.key === filter}
            onPress={() => {
              setFilter(item.key);
              if (item.key !== 'region') setRegion(null);
            }}
          />
        ))}
      </ScrollView>
      {filter === 'region' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Pill label="모든 지역" selected={region === null} onPress={() => setRegion(null)} />
          {REGION_ORDER.map((name) => (
            <Pill key={name} label={name} selected={region === name} onPress={() => setRegion(name)} />
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.search}>
        <SearchField value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder="산 이름을 검색해보세요" />
      </View>
      <View style={styles.summary}>
        <AppText variant="bodySmall" color="inkMuted">{visible.length}개의 산</AppText>
        <AppText variant="bodySmall" color="inkMuted">{collection.shortName} {collectionDone} / 100</AppText>
      </View>
      <View style={styles.viewSwitch}>
        <SegmentedControl options={VIEW_OPTIONS} value={catalogView} onChange={setCatalogView} />
      </View>
      {catalogView === 'map' ? mapContent : null}
    </View>
  );

  const renderItem = ({ item }: { item: Mountain }) => (
    <View style={styles.cell}>
      <MountainCard
        mountain={item}
        index={indexById.get(item.id) ?? 0}
        completed={completed.has(item.id)}
        certificationPhotoUri={completionByMountain.get(item.id)?.photoUrl}
        fallbackPhotoSource={DEFAULT_MOUNTAIN_PHOTO}
        onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: item.id } })}
      />
    </View>
  );

  const renderEmpty = () => {
    if (mountains.isLoading || completedQuery.isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.cell}><LoadingSkeleton height={220} radius={18} /></View>
          ))}
        </View>
      );
    }
    if (mountains.isError || completedQuery.isError) {
      return (
        <EmptyState
          title="잠깐 연결이 끊겼어요."
          description="다시 시도해주세요."
          actionLabel="다시 시도"
          onAction={() => {
            mountains.refetch();
            completedQuery.refetch();
          }}
        />
      );
    }
    if (search.trim()) return <EmptyState title={`'${search.trim()}' 산은 이 컬렉션에 없어요`} description="다른 컬렉션이나 이름을 확인해볼까요?" />;
    if (filter === 'done') {
      return <EmptyState title="아직 인증한 산이 없어요" description="첫 산은 어디로 갈 건데?" actionLabel="미인증 산 보기" onAction={() => setFilter('todo')} />;
    }
    return <EmptyState title="여기엔 산이 없네요" description="다른 필터를 골라보세요." />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={catalogView === 'list' ? visible : []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        ListEmptyComponent={catalogView === 'list' ? renderEmpty : null}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={mountains.isRefetching}
        onRefresh={() => {
          mountains.refetch();
          completedQuery.refetch();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  header: { marginBottom: spacing.md },
  challenge: { marginBottom: spacing.md },
  pendingNotice: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  filters: { gap: spacing.sm, paddingVertical: spacing.xs },
  search: { marginTop: spacing.md },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  viewSwitch: { marginTop: spacing.md },
  mapState: { marginTop: spacing.md, marginBottom: spacing.huge },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
