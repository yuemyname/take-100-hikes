import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, Screen, TopBar } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import {
  formatActivityDate,
  formatActivityDistance,
  formatActivityDuration,
  useActivityCertificationOptions,
  useAttachActivityToCertification,
  useMyActivities,
} from '@/features/activities';
import type { ActivityCertificationOption, HikingActivity } from '@/types';

function timeDistanceLabel(activity: HikingActivity, certification: ActivityCertificationOption): string {
  const midpoint = (new Date(activity.started_at).getTime() + new Date(activity.ended_at).getTime()) / 2;
  const differenceHours = Math.abs(new Date(certification.capturedAt).getTime() - midpoint) / (60 * 60 * 1000);
  if (differenceHours < 1) return '운동 시간과 매우 가까움';
  if (differenceHours < 6) return `${Math.round(differenceHours)}시간 차이`;
  const days = Math.round(differenceHours / 24);
  return `${days}일 차이`;
}

export default function LinkActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ activityId?: string }>();
  const activityId = typeof params.activityId === 'string' ? params.activityId : '';
  const activities = useMyActivities();
  const certifications = useActivityCertificationOptions();
  const attach = useAttachActivityToCertification();
  const activity = activities.data?.find((candidate) => candidate.id === activityId) ?? null;
  const orderedOptions = useMemo(() => {
    if (!activity) return certifications.data ?? [];
    const midpoint = (new Date(activity.started_at).getTime() + new Date(activity.ended_at).getTime()) / 2;
    return [...(certifications.data ?? [])].sort(
      (a, b) => Math.abs(new Date(a.capturedAt).getTime() - midpoint) - Math.abs(new Date(b.capturedAt).getTime() - midpoint),
    );
  }, [activity, certifications.data]);

  const link = (certificationId: string) => {
    if (!activity || attach.isPending) return;
    attach.mutate(
      { activityId: activity.id, certificationId },
      { onSuccess: () => router.replace('/activities') },
    );
  };

  return (
    <Screen>
      <TopBar title="산 인증 연결" onBack={() => router.back()} />

      {activities.isLoading || certifications.isLoading ? (
        <View style={styles.loading}>
          <AppText variant="bodySmall" color="inkMuted" align="center">기록을 확인하고 있어요.</AppText>
        </View>
      ) : activities.isError || certifications.isError ? (
        <EmptyState
          mascot={false}
          title="인증 기록을 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() => {
            activities.refetch();
            certifications.refetch();
          }}
        />
      ) : !activity ? (
        <EmptyState mascot={false} title="연결할 활동 기록을 찾지 못했어요" />
      ) : (
        <>
          <View style={styles.activitySummary}>
            <MaterialCommunityIcons name="heart-pulse" size={34} color={colors.green} />
            <View style={styles.summaryCopy}>
              <AppText variant="heading3">{formatActivityDate(activity.started_at)}</AppText>
              <AppText variant="bodySmall" color="inkMuted">
                {formatActivityDistance(activity.distance_m)} · {formatActivityDuration(activity.moving_seconds)}
              </AppText>
            </View>
          </View>

          <View style={styles.explanation}>
            <AppText variant="body" weight="800">같은 날의 정상 인증을 골라주세요</AppText>
            <AppText variant="bodySmall" color="inkMuted" style={styles.explanationBody}>
              인증 시각이 운동 구간과 가깝고 거리·페이스가 정상 범위인 Apple Fitness 기록만 랭킹 후보가 돼요. 연결만으로는 공개되지 않아요.
            </AppText>
          </View>

          <AppText variant="heading2" style={styles.heading}>내 정상 인증</AppText>
          {orderedOptions.length ? (
            <View style={styles.list}>
              {orderedOptions.map((option) => (
                <Pressable
                  key={option.certificationId}
                  onPress={() => link(option.certificationId)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.mountainName} 인증 연결`}
                  disabled={attach.isPending}
                  style={({ pressed }) => [styles.option, pressed ? styles.pressed : null, attach.isPending ? styles.disabled : null]}
                >
                  <View style={styles.optionCopy}>
                    <AppText variant="heading3">{option.mountainName}</AppText>
                    <AppText variant="bodySmall" color="inkMuted">
                      {formatActivityDate(option.capturedAt)} · {timeDistanceLabel(activity, option)}
                    </AppText>
                  </View>
                  <MaterialCommunityIcons name="link-variant" size={26} color={colors.blue} />
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState
              title="연결할 정상 인증이 없어요"
              description="먼저 인증 탭에서 정상 인증을 완료해주세요."
            />
          )}
          {attach.isError ? (
            <AppText variant="bodySmall" color="danger" style={styles.error}>
              인증을 연결하지 못했어요. 이미 다른 활동에 연결했는지 확인해주세요.
            </AppText>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.huge },
  activitySummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.cardLarge, backgroundColor: colors.surface },
  summaryCopy: { flex: 1 },
  explanation: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radii.cardLarge, backgroundColor: colors.yellow },
  explanationBody: { marginTop: spacing.xs },
  heading: { marginTop: spacing.xxxl, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  option: { minHeight: MIN_TOUCH_TARGET + 20, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.card, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  optionCopy: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.5 },
  error: { marginTop: spacing.md },
});
