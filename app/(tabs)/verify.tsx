import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, LoadingSkeleton, Mascot, MountainPhoto, OFFICIAL_ART, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { GUIDE_MASCOT } from '@/data/mascots';
import { useSummitProximity } from '@/features/certification';
import { useCompletedMountainIds, useMountains } from '@/features/mountains';
import { formatDistance, getDistanceMeters } from '@/lib/geo';

/** 인증 tab: pick the mountain you are standing on (nearest first), then capture — spec §5. */
export default function VerifyScreen() {
  const router = useRouter();
  const { mountainId } = useLocalSearchParams<{ mountainId?: string }>();
  const mountains = useMountains();
  const completed = useCompletedMountainIds();
  const proximity = useSummitProximity(null);

  // Arriving from a mountain detail CTA goes straight to the camera.
  useEffect(() => {
    if (mountainId) router.replace({ pathname: '/certification/capture', params: { mountainId } });
  }, [mountainId, router]);

  const nearest = useMemo(() => {
    const list = mountains.data ?? [];
    if (!proximity.position) return [];
    const pos = proximity.position;
    return list
      .map((m) => ({ mountain: m, distance: getDistanceMeters(pos, m) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [mountains.data, proximity.position]);

  const openCapture = (id: string) => router.push({ pathname: '/certification/capture', params: { mountainId: id } });

  return (
    <Screen>
      <TopBar title="인증" />
      <View style={styles.heroRow}>
        <Mascot look={GUIDE_MASCOT} size={OFFICIAL_ART.boxFor(96)} accessibilityLabel="백픽스 가이드 캐릭터" />
        <View style={styles.heroText}>
          <AppText variant="heading2">지금 어느 산 정상이에요?</AppText>
          <AppText variant="bodySmall" color="inkMuted">
            정상 반경 안에서 앱 카메라로 찍으면 인증돼요.
          </AppText>
        </View>
      </View>

      <AppText variant="heading3" style={styles.sectionTitle}>
        가까운 산
      </AppText>
      {proximity.permission === 'denied' ? (
        <EmptyState
          title="정상 인증을 위해 위치 권한이 필요해요."
          description="설정에서 위치 권한을 허용해주세요."
          actionLabel="설정 열기"
          onAction={() => Linking.openSettings().catch(() => {})}
          mascot={false}
        />
      ) : proximity.permission === 'undetermined' ? (
        <View style={styles.card}>
          <AppText variant="body">가까운 산을 찾으려면 위치 권한이 필요해요.</AppText>
          <SecondaryButton label="위치 권한 허용하기" onPress={proximity.requestPermission} />
        </View>
      ) : proximity.error && !proximity.position ? (
        <EmptyState title={proximity.error} actionLabel="다시 시도" onAction={proximity.refresh} mascot={false} />
      ) : !proximity.position || mountains.isLoading ? (
        <LoadingSkeleton lines={3} height={72} radius={18} />
      ) : (
        nearest.map(({ mountain, distance }) => (
          <Pressable
            key={mountain.id}
            onPress={() => openCapture(mountain.id)}
            accessibilityRole="button"
            accessibilityLabel={`${mountain.name_ko}, ${formatDistance(distance)} 거리, 인증 시작`}
            style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
          >
            <MountainPhoto uri={mountain.image_url} seed={mountain.display_order ?? 1} radius={radii.chip} style={styles.thumb} accessibilityLabel={`${mountain.name_ko} 사진`} />
            <View style={styles.rowText}>
              <AppText variant="body" weight="700">
                {mountain.name_ko}
              </AppText>
              <AppText variant="caption" color="inkMuted">
                {formatDistance(distance)} · {mountain.altitude_m?.toLocaleString('ko-KR')}m
                {completed.data?.has(mountain.id) ? ' · 인증 완료' : ''}
              </AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.inkMuted} />
          </Pressable>
        ))
      )}

      <View style={styles.footer}>
        <SecondaryButton label="도감에서 직접 고르기" onPress={() => router.push('/mountains')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  heroText: { flex: 1, gap: spacing.xs },
  sectionTitle: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 24,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  thumb: { width: 56, height: 56 },
  rowText: { flex: 1, gap: spacing.xxs },
  footer: { marginTop: spacing.xl },
});
