import { FlatList } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState, LoadingSkeleton, MountainCard, Pill, SearchField, TopBar } from '@/components/ui';
import { colors, spacing } from '@/constants';
import {
  MOUNTAIN_FILTERS,
  REGION_ORDER,
  filterMountains,
  useCompletedMountainIds,
  useMountains,
  type MountainFilter,
} from '@/features/mountains';
import type { Mountain } from '@/types';

/** 명산 도감 — spec §4.2. Two-column, image-first, completion scannable at a glance. */
export default function MountainsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<MountainFilter>('all');
  const [region, setRegion] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const mountains = useMountains();
  const completedQuery = useCompletedMountainIds();
  const completed = useMemo(() => completedQuery.data ?? new Set<string>(), [completedQuery.data]);

  const visible = useMemo(
    () => filterMountains(mountains.data ?? [], { filter, region, search, completed }),
    [mountains.data, filter, region, search, completed],
  );

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    (mountains.data ?? []).forEach((m, i) => map.set(m.id, m.display_order ?? i + 1));
    return map;
  }, [mountains.data]);

  const header = (
    <View style={styles.header}>
      <TopBar title="명산 도감" />
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
        <SearchField
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="산 이름을 검색해보세요"
        />
      </View>
      <View style={styles.summary}>
        <AppText variant="bodySmall" color="inkMuted">
          {visible.length}개의 산
        </AppText>
        <AppText variant="bodySmall" color="inkMuted">
          수집 {completed.size} / {(mountains.data ?? []).length || 100}
        </AppText>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Mountain }) => (
    <View style={styles.cell}>
      <MountainCard
        mountain={item}
        index={indexById.get(item.id) ?? 0}
        completed={completed.has(item.id)}
        onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: item.id } })}
      />
    </View>
  );

  const renderEmpty = () => {
    if (mountains.isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.cell}>
              <LoadingSkeleton height={220} radius={18} />
            </View>
          ))}
        </View>
      );
    }
    if (mountains.isError) {
      return (
        <EmptyState
          title="잠깐 연결이 끊겼어요."
          description="다시 시도해주세요."
          actionLabel="다시 시도"
          onAction={() => mountains.refetch()}
        />
      );
    }
    if (search.trim()) {
      return <EmptyState title={`'${search.trim()}' 산은 도감에 없어요`} description="이름을 다시 확인해볼까요?" />;
    }
    if (filter === 'done') {
      return (
        <EmptyState
          title="아직 인증한 산이 없어요"
          description="첫 산은 어디로 갈 건데?"
          actionLabel="미인증 산 보기"
          onAction={() => setFilter('todo')}
        />
      );
    }
    return <EmptyState title="여기엔 산이 없네요" description="다른 필터를 골라보세요." />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
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
  filters: { gap: spacing.sm, paddingVertical: spacing.xs },
  search: { marginTop: spacing.md },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
