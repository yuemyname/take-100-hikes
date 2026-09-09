import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, InvitationCard, LoadingSkeleton, MountainPhoto, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { getMountainImage } from '@/data/mountainImages';
import { OFFICIAL_CHARACTERS, OFFICIAL_STICKERS } from '@/data/officialArt';
import { useMyInvitations, useRespondToInvitation, useSummitProximity } from '@/features/certification';
import { hasVerificationCoordinates, useCompletedMountainIds, useMountains } from '@/features/mountains';
import { formatDistance, getDistanceMeters } from '@/lib/geo';

/** 인증 tab: pick the mountain you are standing on (nearest first), then capture — spec §5. */
export default function VerifyScreen() {
  const router = useRouter();
  const { mountainId } = useLocalSearchParams<{ mountainId?: string }>();
  const mountains = useMountains();
  const completed = useCompletedMountainIds();
  const proximity = useSummitProximity(null);
  const invitations = useMyInvitations();
  const respond = useRespondToInvitation();

  useEffect(() => {
    if (mountainId) router.replace({ pathname: '/certification/capture', params: { mountainId } });
  }, [mountainId, router]);

  const nearest = useMemo(() => {
    const list = mountains.data ?? [];
    if (!proximity.position) return [];
    const pos = proximity.position;
    return list
      .filter(hasVerificationCoordinates)
      .map((m) => ({ mountain: m, distance: getDistanceMeters(pos, m) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [mountains.data, proximity.position]);

  const openCapture = (id: string) => router.push({ pathname: '/certification/capture', params: { mountainId: id } });

  return (
    <Screen>
      <TopBar title="인증" />

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <AppText variant="displayL">정상에 왔으면{`\n`}남겨야지.</AppText>
          <AppText variant="bodySmall" color="inkMuted" style={styles.heroSub}>
            GPS가 정상을 확인하면 앱 카메라로 바로 인증할 수 있어요.
          </AppText>
        </View>
        <Image source={OFFICIAL_CHARACTERS.red[2]} contentFit="contain" style={styles.heroCharacter} accessibilityLabel="100PEAKS 공식 빨간 캐릭터" />
        <Image source={OFFICIAL_STICKERS.summitCheck} contentFit="contain" style={styles.heroSticker} accessibilityLabel="정상 접수 스티커" />
      </View>

      {(invitations.data ?? []).length > 0 ? (
        <View>
          <AppText variant="heading3" style={styles.sectionTitle}>
            같이 인증하자는 요청 {invitations.data?.length}
          </AppText>
          <View style={styles.invitations}>
            {(invitations.data ?? []).map((inv) => (
              <InvitationCard
                key={inv.sessionId}
                creator={inv.creator}
                mountainName={inv.mountain.name_ko}
                expiresAt={inv.expiresAt}
                onAccept={() => router.push({ pathname: '/certification/join', params: { sessionId: inv.sessionId } })}
                onDecline={() => respond.mutate({ sessionId: inv.sessionId, accept: false })}
                declining={respond.isPending && respond.variables?.sessionId === inv.sessionId}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <View>
          <AppText variant="heading2">지금 가까운 산</AppText>
          <AppText variant="caption" color="inkMuted">가까운 순서대로 보여줄게요.</AppText>
        </View>
        <Image source={OFFICIAL_STICKERS.mountain} contentFit="contain" style={styles.sectionSticker} accessibilityLabel="산 스티커" />
      </View>

      {proximity.permission === 'denied' ? (
        <EmptyState
          title="정상 인증을 위해 위치 권한이 필요해요."
          description="설정에서 위치 권한을 허용해주세요."
          actionLabel="설정 열기"
          onAction={() => Linking.openSettings().catch(() => {})}
          mascot={false}
        />
      ) : proximity.permission === 'undetermined' ? (
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="map-marker-radius" size={32} color={colors.blue} />
          <AppText variant="heading3">여기가 정상인지 먼저 확인할게요.</AppText>
          <AppText variant="bodySmall" color="inkMuted">위치 권한은 인증할 때만 사용해요.</AppText>
          <SecondaryButton label="위치 권한 허용하기" onPress={proximity.requestPermission} />
        </View>
      ) : proximity.error && !proximity.position ? (
        <EmptyState title={proximity.error} actionLabel="다시 시도" onAction={proximity.refresh} mascot={false} />
      ) : !proximity.position || mountains.isLoading ? (
        <LoadingSkeleton lines={3} height={82} radius={18} />
      ) : (
        nearest.map(({ mountain, distance }, index) => (
          <Pressable
            key={mountain.id}
            onPress={() => openCapture(mountain.id)}
            accessibilityRole="button"
            accessibilityLabel={`${mountain.name_ko}, ${formatDistance(distance)} 거리, 인증 시작`}
            style={({ pressed }) => [styles.row, index === 0 ? styles.nearestRow : null, pressed ? styles.rowPressed : null]}
          >
            <MountainPhoto
              uri={mountain.image_url}
              source={getMountainImage(mountain.slug)?.source}
              seed={mountain.display_order ?? 1}
              radius={radii.card}
              style={styles.thumb}
              accessibilityLabel={`${mountain.name_ko} 사진`}
            />
            <View style={styles.rowText}>
              {index === 0 ? <AppText variant="caption" weight="700" color="red">제일 가까움</AppText> : null}
              <AppText variant="heading3">{mountain.name_ko}</AppText>
              <AppText variant="caption" color="inkMuted">
                {formatDistance(distance)} · {mountain.altitude_m?.toLocaleString('ko-KR')}m
                {completed.data?.has(mountain.id) ? ' · 인증 완료' : ''}
              </AppText>
            </View>
            <View style={styles.arrow}>
              <MaterialCommunityIcons name="camera" size={22} color={colors.ink} />
            </View>
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
  hero: {
    minHeight: 240,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: colors.yellow,
    borderRadius: radii.cardLarge,
    overflow: 'hidden',
    padding: spacing.xl,
    justifyContent: 'center',
  },
  heroCopy: { width: '63%', zIndex: 2 },
  heroSub: { marginTop: spacing.sm },
  heroCharacter: { position: 'absolute', width: 180, height: 220, right: -24, bottom: -12 },
  heroSticker: { position: 'absolute', width: 98, height: 58, right: spacing.sm, top: spacing.sm, transform: [{ rotate: '7deg' }] },
  sectionTitle: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  invitations: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionSticker: { width: 72, height: 48, transform: [{ rotate: '-5deg' }] },
  permissionCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.cardLarge,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  nearestRow: { borderTopWidth: 2, borderTopColor: colors.ink },
  rowPressed: { opacity: 0.7 },
  thumb: { width: 76, height: 76 },
  rowText: { flex: 1, gap: spacing.xxs },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: spacing.xl },
});
