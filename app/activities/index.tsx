import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, Pill, PrimaryButton, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import {
  formatActivityDate,
  formatActivityDistance,
  formatActivityDuration,
  formatActivityPace,
  useMyActivities,
  useSetActivityRankingOptIn,
  useUpdateActivityVisibility,
} from '@/features/activities';
import { useMountains } from '@/features/mountains';
import type { HikingActivity, HikingActivityVisibility } from '@/types';

const VISIBILITY_OPTIONS: readonly { key: HikingActivityVisibility; label: string }[] = [
  { key: 'private', label: '나만' },
  { key: 'friends', label: '맞팔' },
  { key: 'public', label: '전체' },
];

function ActivityCard({
  activity,
  mountainName,
  changing,
  rankingChanging,
  onVisibilityChange,
  onLinkCertification,
  onRankingChange,
}: {
  activity: HikingActivity;
  mountainName: string | null;
  changing: boolean;
  rankingChanging: boolean;
  onVisibilityChange: (visibility: HikingActivityVisibility) => void;
  onLinkCertification: () => void;
  onRankingChange: (optIn: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeading}>
          <AppText variant="caption" weight="700" color={activity.source === 'healthkit' ? 'green' : 'blue'}>
            {activity.source === 'healthkit' ? 'APPLE FITNESS' : '수동 기록'}
          </AppText>
          <AppText variant="heading3">{mountainName ?? '산 미지정'}</AppText>
          <AppText variant="caption" color="inkMuted">
            {formatActivityDate(activity.started_at)}
          </AppText>
        </View>
        <MaterialCommunityIcons
          name={activity.source === 'healthkit' ? 'heart-pulse' : 'notebook-edit-outline'}
          size={30}
          color={activity.source === 'healthkit' ? colors.green : colors.blue}
        />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <AppText variant="caption" color="inkMuted">거리</AppText>
          <AppText variant="body" weight="800">{formatActivityDistance(activity.distance_m)}</AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="caption" color="inkMuted">시간</AppText>
          <AppText variant="body" weight="800">{formatActivityDuration(activity.moving_seconds)}</AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="caption" color="inkMuted">평균 페이스</AppText>
          <AppText variant="body" weight="800">{formatActivityPace(Number(activity.pace_seconds_per_km))}</AppText>
        </View>
      </View>

      {activity.elevation_gain_m !== null ? (
        <AppText variant="bodySmall" color="inkMuted" style={styles.detailLine}>
          누적 상승 {activity.elevation_gain_m.toLocaleString('ko-KR')}m
        </AppText>
      ) : null}
      {activity.note ? <AppText variant="bodySmall" style={styles.note}>{activity.note}</AppText> : null}

      <View style={styles.rule} />
      <AppText variant="caption" weight="700">
        공개 범위
      </AppText>
      <View style={[styles.pills, changing ? styles.changing : null]}>
        {VISIBILITY_OPTIONS.map((option) => (
          <Pill
            key={option.key}
            label={option.label}
            selected={activity.visibility === option.key}
            tone={option.key === 'public' ? 'blue' : 'ink'}
            onPress={() => onVisibilityChange(option.key)}
          />
        ))}
      </View>
      <AppText variant="caption" color="inkMuted" style={styles.rankNote}>
        {activity.source === 'manual'
          ? '개인 기록 · 페이스 랭킹 제외'
          : activity.ranking_eligible
            ? activity.ranking_opt_in
              ? '인증 연결 완료 · 랭킹 참여 중'
              : '인증 연결 완료 · 랭킹 참여 가능'
            : activity.certification_id
              ? '인증은 연결됐지만 시간·거리 검증 기준에 맞지 않아 랭킹에서 제외돼요.'
              : '산 인증을 연결하면 랭킹 참여 가능 여부를 확인해요.'}
      </AppText>
      {activity.source === 'healthkit' && !activity.certification_id ? (
        <View style={styles.cardAction}>
          <SecondaryButton label="산 인증 연결" onPress={onLinkCertification} />
        </View>
      ) : null}
      {activity.source === 'healthkit' && activity.ranking_eligible ? (
        <View style={styles.cardAction}>
          <SecondaryButton
            label={activity.ranking_opt_in ? '랭킹 참여 중단' : '페이스 랭킹 참여'}
            onPress={() => onRankingChange(!activity.ranking_opt_in)}
            disabled={rankingChanging || (!activity.ranking_opt_in && activity.visibility === 'private')}
          />
          {!activity.ranking_opt_in && activity.visibility === 'private' ? (
            <AppText variant="caption" color="danger">맞팔 또는 전체 공개로 바꾼 뒤 참여할 수 있어요.</AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function ActivitiesScreen() {
  const router = useRouter();
  const activities = useMyActivities();
  const mountains = useMountains();
  const visibilityMutation = useUpdateActivityVisibility();
  const rankingMutation = useSetActivityRankingOptIn();
  const [changingId, setChangingId] = useState<string | null>(null);
  const [rankingChangingId, setRankingChangingId] = useState<string | null>(null);

  const mountainNames = useMemo(
    () => new Map((mountains.data ?? []).map((mountain) => [mountain.id, mountain.name_ko])),
    [mountains.data],
  );

  const changeVisibility = (activityId: string, visibility: HikingActivityVisibility) => {
    if (visibilityMutation.isPending) return;
    setChangingId(activityId);
    visibilityMutation.mutate(
      { activityId, visibility },
      { onSettled: () => setChangingId(null) },
    );
  };

  const changeRanking = (activityId: string, optIn: boolean) => {
    if (rankingMutation.isPending) return;
    setRankingChangingId(activityId);
    rankingMutation.mutate(
      { activityId, optIn },
      { onSettled: () => setRankingChangingId(null) },
    );
  };

  return (
    <Screen>
      <TopBar title="등산 활동" onBack={() => router.back()} />

      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <MaterialCommunityIcons name="shield-lock-outline" size={28} color={colors.ink} />
        </View>
        <View style={styles.introCopy}>
          <AppText variant="body" weight="800">내 기록은 내가 정해요</AppText>
          <AppText variant="bodySmall" color="inkMuted" style={styles.introDescription}>
            기본은 나만 보기예요. 수동 기록은 일지로만 저장되고 랭킹에는 반영되지 않아요.
          </AppText>
        </View>
      </View>

      <View style={styles.primaryActions}>
        <PrimaryButton label="Apple Fitness에서 가져오기" onPress={() => router.push('/activities/import')} />
        <SecondaryButton label="수동 기록 추가" onPress={() => router.push('/activities/new')} />
        <SecondaryButton label="페이스 랭킹 보기" onPress={() => router.push('/activities/rankings')} />
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="heading2">내 활동</AppText>
        {activities.data ? <AppText variant="bodySmall" color="inkMuted">{activities.data.length}개</AppText> : null}
      </View>

      {activities.isLoading ? (
        <View style={styles.loadingCard}>
          <AppText variant="bodySmall" color="inkMuted" align="center">활동 기록을 불러오고 있어요.</AppText>
        </View>
      ) : activities.isError ? (
        <EmptyState
          mascot={false}
          title="활동 기록을 불러오지 못했어요"
          description="연결을 확인하고 다시 시도해주세요."
          actionLabel="다시 시도"
          onAction={() => activities.refetch()}
        />
      ) : activities.data?.length ? (
        <View style={styles.list}>
          {activities.data.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              mountainName={activity.mountain_id ? mountainNames.get(activity.mountain_id) ?? null : null}
              changing={changingId === activity.id}
              rankingChanging={rankingChangingId === activity.id}
              onVisibilityChange={(visibility) => changeVisibility(activity.id, visibility)}
              onLinkCertification={() => router.push({ pathname: '/activities/link', params: { activityId: activity.id } })}
              onRankingChange={(optIn) => changeRanking(activity.id, optIn)}
            />
          ))}
          {visibilityMutation.isError ? (
            <AppText variant="bodySmall" color="danger">공개 범위를 바꾸지 못했어요. 다시 시도해주세요.</AppText>
          ) : null}
          {rankingMutation.isError ? (
            <AppText variant="bodySmall" color="danger">랭킹 설정을 바꾸지 못했어요. 공개 범위와 인증 연결을 확인해주세요.</AppText>
          ) : null}
        </View>
      ) : (
        <EmptyState
          title="아직 남긴 등산 기록이 없어요"
          description="첫 기록을 직접 남겨보세요. 다음 단계에서 Apple Fitness 기록도 불러올 수 있게 연결할게요."
          actionLabel="첫 기록 추가"
          onAction={() => router.push('/activities/new')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  introIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: colors.yellow,
  },
  introCopy: { flex: 1 },
  introDescription: { marginTop: spacing.xs },
  primaryActions: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
  },
  loadingCard: {
    paddingVertical: spacing.huge,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surface,
  },
  list: { gap: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardHeading: { gap: spacing.xxs },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metric: { flex: 1 },
  detailLine: { marginTop: spacing.md },
  note: { marginTop: spacing.md, padding: spacing.md, borderRadius: radii.chip, backgroundColor: colors.surfaceMuted },
  rule: { height: 1, marginVertical: spacing.lg, backgroundColor: colors.border },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  changing: { opacity: 0.5 },
  rankNote: { marginTop: spacing.sm },
  cardAction: { gap: spacing.xs, marginTop: spacing.md },
});
