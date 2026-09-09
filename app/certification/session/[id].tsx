import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, LoadingSkeleton, MountainPhoto, ParticipantRow, PrimaryButton, Screen, SecondaryButton, SpeechBubble, TopBar, formatCertifiedDate } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { CERTIFICATION_SUCCESS_CHARACTER } from '@/data/officialArt';
import { isSessionSettled, useSession } from '@/features/certification';
import { useViewerId } from '@/features/social';

/** One shared certification session — spec §6.5 display and §6.3 step 9 completion. */
export default function SessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewerId = useViewerId();
  const session = useSession(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (session.isLoading) {
    return (
      <Screen>
        <TopBar title="함께 인증" onBack={goBack} />
        <LoadingSkeleton height={200} radius={24} />
        <View style={styles.gap} />
        <LoadingSkeleton lines={3} height={48} radius={12} />
      </Screen>
    );
  }
  if (session.isError || !session.data) {
    return (
      <Screen>
        <TopBar title="함께 인증" onBack={goBack} />
        <EmptyState
          title={session.isError ? '잠깐 연결이 끊겼어요.' : '인증을 찾을 수 없어요'}
          description={session.isError ? '다시 시도해주세요.' : '삭제됐거나 주소가 잘못됐을 수 있어요.'}
          actionLabel={session.isError ? '다시 시도' : '홈으로'}
          onAction={() => (session.isError ? session.refetch() : router.replace('/'))}
        />
      </Screen>
    );
  }

  const s = session.data;
  const confirmed = s.members.filter((m) => m.status === 'confirmed');
  const settled = isSessionSettled(s.members);
  const pending = s.members.filter((m) => m.status === 'invited').length;
  const together = confirmed.length > 1;
  const me = s.members.find((m) => m.user.id === viewerId);
  const iCanJoin = me?.status === 'invited';

  const headline = settled
    ? together
      ? '함께 인증 완료!'
      : '인증 완료'
    : `친구 ${pending}명의 수락을 기다리는 중`;

  return (
    <Screen>
      <TopBar title="함께 인증" onBack={goBack} />
      <View style={styles.photoWrap}>
        <MountainPhoto uri={s.photoUrl ?? s.mountain.image_url} seed={s.mountain.display_order ?? 1} style={styles.photo} accessibilityLabel={`${s.mountain.name_ko} 인증 사진`} />
        <Image
          source={CERTIFICATION_SUCCESS_CHARACTER}
          contentFit="contain"
          style={styles.character}
          accessibilityLabel="100PEAKS 공식 빨간 캐릭터"
          pointerEvents="none"
        />
      </View>

      <AppText variant="heading1" style={styles.title}>
        {s.mountain.name_ko} · {formatCertifiedDate(s.capturedAt)}
      </AppText>
      <AppText variant="bodySmall" color="inkMuted">
        하나의 인증 세션 · 참여 {confirmed.length}명
      </AppText>

      <View style={styles.members}>
        {s.members.map((m) => (
          <ParticipantRow key={m.user.id} user={m.user} status={m.status} isCreator={m.isCreator} isMe={m.user.id === viewerId} />
        ))}
      </View>

      <View style={styles.bubbleRow}>
        <SpeechBubble text={headline} tone={settled && together ? 'yellow' : 'surface'} tailPosition="left" />
      </View>

      {iCanJoin ? (
        <PrimaryButton label="인증 참여" tone="yellow" onPress={() => router.push({ pathname: '/certification/join', params: { sessionId: s.id } })} />
      ) : (
        <PrimaryButton label={`${s.mountain.name_ko} 상세 보기`} onPress={() => router.push({ pathname: '/mountain/[id]', params: { id: s.mountain.id } })} />
      )}
      <View style={styles.gap} />
      <SecondaryButton label="홈으로" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.md },
  photoWrap: { borderRadius: radii.cardLarge, overflow: 'hidden', marginTop: spacing.sm, position: 'relative' },
  photo: { width: '100%', height: 220 },
  character: { position: 'absolute', width: 104, height: 146, right: spacing.sm, bottom: -12 },
  title: { marginTop: spacing.lg },
  members: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  bubbleRow: { marginVertical: spacing.xl },
});
