import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, CertificationStatusBanner, EmptyState, LoadingSkeleton, MountainPhoto, ParticipantRow, PrimaryButton, Screen, SecondaryButton, TopBar, type CertificationStatus } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { authErrorMessage } from '@/features/auth/messages';
import { useRespondToInvitation, useSession, useSummitProximity } from '@/features/certification';
import { hasVerificationCoordinates } from '@/features/mountains';
import { useViewerId } from '@/features/social';
import { env } from '@/lib/env';
import { getDistanceMeters } from '@/lib/geo';

/**
 * Invited friend accepts or declines — spec §6.3 steps 6–8, §6.6:
 * mutual friend + invitation + inside the summit radius. No remote acceptance.
 */
export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const viewerId = useViewerId();
  const session = useSession(sessionId);
  const respond = useRespondToInvitation();
  const proximity = useSummitProximity(session.data?.mountain);

  // Enabled only in local development and the isolated TestFlight build profile.
  const locationTestMode = __DEV__ || env.locationTestModeEnabled;
  const [demoAtSummit, setDemoAtSummit] = useState(false);

  const mountain = session.data?.mountain;
  const verificationMountain = hasVerificationCoordinates(mountain) ? mountain : null;
  const position = useMemo(() => {
    if (demoAtSummit && verificationMountain) {
      return { latitude: verificationMountain.latitude, longitude: verificationMountain.longitude, accuracyM: 12 };
    }
    return proximity.position;
  }, [demoAtSummit, verificationMountain, proximity.position]);
  const distance = position && verificationMountain ? getDistanceMeters(position, verificationMountain) : null;
  const eligible = distance !== null && verificationMountain ? distance <= verificationMountain.verification_radius_m : false;

  const bannerStatus: CertificationStatus = (() => {
    if (proximity.permission === 'denied' && !demoAtSummit) return 'permission';
    if (proximity.error && !position) return 'error';
    if (!position) return 'locating';
    return eligible ? 'eligible' : 'too_far';
  })();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goToSession = () => router.replace({ pathname: '/certification/session/[id]', params: { id: sessionId } });

  if (session.isLoading) {
    return (
      <Screen>
        <TopBar title="공동 인증 요청" onBack={goBack} />
        <LoadingSkeleton height={220} radius={24} />
        <View style={styles.gap} />
        <LoadingSkeleton lines={2} height={48} radius={12} />
      </Screen>
    );
  }
  if (session.isError || !session.data) {
    return (
      <Screen>
        <TopBar title="공동 인증 요청" onBack={goBack} />
        <EmptyState
          title={session.isError ? '잠깐 연결이 끊겼어요.' : '요청을 찾을 수 없어요'}
          description={session.isError ? '다시 시도해주세요.' : '이미 만료됐거나 취소된 요청이에요.'}
          actionLabel={session.isError ? '다시 시도' : '홈으로'}
          onAction={() => (session.isError ? session.refetch() : router.replace('/'))}
        />
      </Screen>
    );
  }

  const s = session.data;
  const me = s.members.find((m) => m.user.id === viewerId);
  const creatorName = s.creator.display_name ?? s.creator.username;

  if (!me || me.status !== 'invited') {
    return (
      <Screen>
        <TopBar title="공동 인증 요청" onBack={goBack} />
        <EmptyState
          title={me?.status === 'confirmed' ? '이미 참여한 인증이에요' : me?.status === 'expired' ? '요청이 만료됐어요' : '응답할 수 없는 요청이에요'}
          description={me?.status === 'confirmed' ? '인증 현황에서 함께한 친구를 볼 수 있어요.' : '24시간이 지난 요청은 참여할 수 없어요.'}
          actionLabel="인증 현황 보기"
          onAction={goToSession}
        />
      </Screen>
    );
  }

  if (!hasVerificationCoordinates(s.mountain)) {
    return (
      <Screen>
        <TopBar title="공동 인증 요청" onBack={goBack} />
        <EmptyState
          title="이 산의 인증을 잠시 열 수 없어요"
          description="인증지 좌표 검증이 끝날 때까지 공동 인증 참여도 안전하게 차단돼요."
          actionLabel="인증 현황 보기"
          onAction={goToSession}
        />
      </Screen>
    );
  }

  const accept = () => {
    if (!position) return;
    respond.mutate({ sessionId: s.id, accept: true, position }, { onSuccess: goToSession });
  };
  const decline = () => respond.mutate({ sessionId: s.id, accept: false }, { onSuccess: () => router.replace('/') });

  return (
    <View style={styles.root}>
      <Screen contentContainerStyle={{ paddingBottom: 170 + insets.bottom }}>
        <TopBar title="공동 인증 요청" onBack={goBack} />
        <View style={styles.photoWrap}>
          <MountainPhoto uri={s.photoUrl ?? s.mountain.image_url} seed={s.mountain.display_order ?? 1} style={styles.photo} accessibilityLabel={`${creatorName}의 ${s.mountain.name_ko} 인증 사진`} />
        </View>
        <AppText variant="heading1" style={styles.title}>
          @{s.creator.username}이 {s.mountain.name_ko} 공동 인증을 요청했어요.
        </AppText>
        <AppText variant="bodySmall" color="inkMuted">
          하나의 인증을 함께 나눠요. 참여하려면 지금 {s.mountain.name_ko} 정상 반경 {s.mountain.verification_radius_m}m 안에 있어야 해요.
        </AppText>

        <View style={styles.members}>
          {s.members.map((m) => (
            <ParticipantRow key={m.user.id} user={m.user} status={m.status} isCreator={m.isCreator} isMe={m.user.id === viewerId} />
          ))}
        </View>

        <View style={styles.banner}>
          <CertificationStatusBanner status={bannerStatus} distanceMeters={distance} accuracyM={position?.accuracyM ?? null} message={proximity.error} />
          {proximity.permission === 'undetermined' && !demoAtSummit ? (
            <SecondaryButton label="위치 권한 허용하기" onPress={proximity.requestPermission} />
          ) : proximity.permission === 'denied' && !demoAtSummit ? (
            <SecondaryButton label="설정 열기" onPress={() => Linking.openSettings().catch(() => {})} />
          ) : null}
          {locationTestMode ? (
            <View style={styles.testLocation}>
              <AppText variant="caption" color="inkMuted" align="center">
                TestFlight 위치 테스트 · 검증된 정상 좌표만 사용해요
              </AppText>
              <SecondaryButton
                label={demoAtSummit ? '실제 위치 사용' : '테스트: 정상 위치로 보정'}
                onPress={() => setDemoAtSummit((value) => !value)}
              />
            </View>
          ) : null}
        </View>
        {respond.isError ? (
          <AppText variant="bodySmall" color="danger" style={styles.error}>
            {authErrorMessage(respond.error)}
          </AppText>
        ) : null}
      </Screen>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <PrimaryButton label="인증 참여" tone="yellow" onPress={accept} disabled={!eligible} loading={respond.isPending && respond.variables?.accept} />
        <View style={styles.gap} />
        <SecondaryButton label="거절" onPress={decline} disabled={respond.isPending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  gap: { height: spacing.md },
  photoWrap: { borderRadius: radii.cardLarge, overflow: 'hidden', marginTop: spacing.sm },
  photo: { width: '100%', height: 200 },
  title: { marginTop: spacing.lg, marginBottom: spacing.xs },
  members: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  banner: { marginTop: spacing.lg, gap: spacing.sm },
  testLocation: { gap: spacing.xs },
  error: { marginTop: spacing.md },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
