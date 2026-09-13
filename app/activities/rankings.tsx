import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, EmptyState, Screen, SearchField, SegmentedControl, TopBar } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { formatActivityDistance, formatActivityPace, useMyActivities, usePaceLeaderboard } from '@/features/activities';
import { useMountains } from '@/features/mountains';
import type { PaceLeaderboardScope } from '@/types';

const SCOPE_OPTIONS: readonly { key: PaceLeaderboardScope; label: string }[] = [
  { key: 'friends', label: '맞팔 친구' },
  { key: 'public', label: '전체 공개' },
];

export default function PaceRankingsScreen() {
  const router = useRouter();
  const mountains = useMountains();
  const myActivities = useMyActivities();
  const [scope, setScope] = useState<PaceLeaderboardScope>('friends');
  const [mountainId, setMountainId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const defaultMountainId = myActivities.data?.find((activity) => activity.mountain_id)?.mountain_id
    ?? mountains.data?.[0]?.id
    ?? null;
  const effectiveMountainId = mountainId ?? defaultMountainId;
  const leaderboard = usePaceLeaderboard(effectiveMountainId, scope);
  const selectedMountain = useMemo(
    () => (mountains.data ?? []).find((mountain) => mountain.id === effectiveMountainId) ?? null,
    [effectiveMountainId, mountains.data],
  );
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return (mountains.data ?? []).filter((mountain) => mountain.name_ko.toLowerCase().includes(term)).slice(0, 6);
  }, [mountains.data, search]);

  const selectMountain = (id: string, name: string) => {
    setMountainId(id);
    setSearch(name);
  };

  return (
    <Screen>
      <TopBar title="페이스 랭킹" onBack={() => router.back()} />

      <View style={styles.hero}>
        <MaterialCommunityIcons name="podium-gold" size={44} color={colors.ink} />
        <View style={styles.heroCopy}>
          <AppText variant="heading3">산마다, 가장 빠른 한 기록</AppText>
          <AppText variant="bodySmall" color="inkMuted">
            정상 인증과 연결된 Apple Fitness 기록 중 직접 참여를 켠 기록만 비교해요.
          </AppText>
        </View>
      </View>

      <AppText variant="bodySmall" weight="700" style={styles.label}>산 선택</AppText>
      <SearchField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        placeholder={selectedMountain?.name_ko ?? '산 이름 검색'}
        accessibilityLabel="랭킹을 볼 산 검색"
      />
      {results.length > 0 && search !== selectedMountain?.name_ko ? (
        <View style={styles.results}>
          {results.map((mountain) => (
            <Pressable
              key={mountain.id}
              onPress={() => selectMountain(mountain.id, mountain.name_ko)}
              accessibilityRole="button"
              accessibilityLabel={`${mountain.name_ko} 랭킹 선택`}
              style={styles.resultRow}
            >
              <AppText variant="body" weight="700">{mountain.name_ko}</AppText>
              <AppText variant="caption" color="inkMuted">{mountain.region ?? ''}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {selectedMountain ? <AppText variant="heading2" style={styles.selected}>{selectedMountain.name_ko}</AppText> : null}

      <SegmentedControl options={SCOPE_OPTIONS} value={scope} onChange={setScope} />

      {leaderboard.isLoading ? (
        <View style={styles.loading}>
          <AppText variant="bodySmall" color="inkMuted" align="center">순위를 계산하고 있어요.</AppText>
        </View>
      ) : leaderboard.isError ? (
        <EmptyState
          mascot={false}
          title="랭킹을 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() => leaderboard.refetch()}
        />
      ) : leaderboard.data?.length ? (
        <View style={styles.rankingList}>
          {leaderboard.data.map((row) => {
            const name = row.display_name || row.username;
            return (
              <View key={row.activity_id} style={[styles.rankRow, row.rank <= 3 ? styles.topRank : null]}>
                <AppText variant="heading3" align="center" style={styles.rankNumber}>{row.rank}</AppText>
                <Avatar uri={row.avatar_url} name={name} />
                <View style={styles.person}>
                  <AppText variant="body" weight="800">{name}</AppText>
                  <AppText variant="caption" color="inkMuted">@{row.username} · {formatActivityDistance(row.distance_m)}</AppText>
                </View>
                <AppText variant="body" weight="800" color={row.rank === 1 ? 'blue' : 'ink'}>
                  {formatActivityPace(Number(row.pace_seconds_per_km))}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : effectiveMountainId ? (
        <EmptyState
          title="아직 공개된 페이스가 없어요"
          description={scope === 'friends' ? '맞팔 친구가 이 산의 검증된 기록으로 참여하면 여기에 보여요.' : '전체 공개로 참여한 첫 번째 인증자가 되어보세요.'}
        />
      ) : null}

      <View style={styles.fairness}>
        <AppText variant="caption" weight="700">공정성 기준</AppText>
        <AppText variant="caption" color="inkMuted" style={styles.fairnessCopy}>
          수동 기록 제외 · 정상 인증 시각 대조 · 비정상 거리/페이스 제외 · 사용자별 최고 기록 1개
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, marginBottom: spacing.xxl, borderRadius: radii.cardLarge, backgroundColor: colors.yellow },
  heroCopy: { flex: 1, gap: spacing.xs },
  label: { marginBottom: spacing.sm },
  results: { marginTop: spacing.sm, borderRadius: radii.card, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.surface },
  resultRow: { minHeight: MIN_TOUCH_TARGET + 4, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  selected: { marginTop: spacing.xxl, marginBottom: spacing.md },
  loading: { paddingVertical: spacing.huge },
  rankingList: { gap: spacing.sm, marginTop: spacing.xl },
  rankRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.card, backgroundColor: colors.surface },
  topRank: { borderWidth: 2, borderColor: colors.yellow },
  rankNumber: { width: 28 },
  person: { flex: 1 },
  fairness: { marginTop: spacing.xxxl, padding: spacing.lg, borderRadius: radii.card, backgroundColor: colors.surfaceMuted },
  fairnessCopy: { marginTop: spacing.xs },
});
