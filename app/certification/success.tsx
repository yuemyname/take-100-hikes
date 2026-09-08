import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Share, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, LoadingSkeleton, Mascot, OFFICIAL_ART, ParticipantRow, PrimaryButton, ProgressCounter, Screen, SecondaryButton, SpeechBubble } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { getMascotLook, hasOfficialMascot, PARTY_MASCOT, PLACEHOLDER_MASCOT } from '@/data/mascots';
import { useSession } from '@/features/certification';
import { useCompletedMountainIds, useMountain } from '@/features/mountains';
import { useViewerId } from '@/features/social';
import { TOTAL_MOUNTAINS } from '@/types';

const CONFETTI = [colors.blue, colors.red, colors.yellow, colors.green, colors.pink, colors.orange];

/**
 * Certification complete. Solo: reveal the mountain's character. Shared:
 * "친구들에게 인증 요청을 보냈어요!" with each participant's status (spec §6.3 step 9, §6.5).
 */
export default function SuccessScreen() {
  const router = useRouter();
  const { sessionId, mountainId, newlyCollected, invited } = useLocalSearchParams<{
    sessionId: string;
    mountainId: string;
    newlyCollected?: string;
    invited?: string;
  }>();
  const viewerId = useViewerId();
  const mountain = useMountain(mountainId);
  const completed = useCompletedMountainIds();
  const shared = Number(invited ?? '0') > 0;
  const session = useSession(shared ? sessionId : undefined);
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const count = completed.data?.size ?? 0;
  const official = hasOfficialMascot(mountain.data?.mascot_key);
  const look = useMemo(
    () => (official ? getMascotLook(mountain.data?.mascot_key) : PLACEHOLDER_MASCOT),
    [official, mountain.data?.mascot_key],
  );

  if (mountain.isError || (!mountain.isLoading && !mountain.data)) {
    return (
      <Screen>
        <EmptyState title="인증은 완료됐어요" description="산 정보를 불러오지 못했지만 기록은 저장됐어요." actionLabel="홈으로" onAction={() => router.replace('/')} />
      </Screen>
    );
  }

  const name = mountain.data?.name_ko ?? '';
  const first = newlyCollected === '1';

  const share = () => {
    Share.share({ message: `${name} 정상에서 100PEAKS 공동 인증을 요청했어요. 같이 모으자!` }).catch(() => {});
  };

  if (shared) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.confetti} pointerEvents="none">
            {CONFETTI.map((c, i) => (
              <View key={c} style={[styles.dot, { backgroundColor: c, left: `${8 + i * 15}%`, top: i % 2 === 0 ? 8 : 40, transform: [{ rotate: `${i * 37}deg` }] }]} />
            ))}
          </View>
          <Animated.View style={{ transform: [{ scale }], opacity }}>
            <Mascot look={PARTY_MASCOT} size={OFFICIAL_ART.boxFor(200)} accessibilityLabel="백픽스 가이드 캐릭터" />
          </Animated.View>
        </View>
        <AppText variant="displayL" align="center">
          친구들에게{'\n'}인증 요청을 보냈어요!
        </AppText>
        <AppText variant="body" color="inkMuted" align="center" style={styles.sub}>
          친구가 정상에서 수락하면 함께 인증이 완료돼요.{'\n'}(최대 24시간)
        </AppText>

        <View style={styles.card}>
          {session.isLoading ? (
            <LoadingSkeleton lines={2} height={48} radius={12} />
          ) : (
            (session.data?.members ?? [])
              .filter((m) => !m.isCreator)
              .map((m) => <ParticipantRow key={m.user.id} user={m.user} status={m.status} isMe={m.user.id === viewerId} />)
          )}
        </View>

        <PrimaryButton label="공유하기" onPress={share} />
        <View style={styles.gap} />
        <SecondaryButton label="나중에 확인하기" onPress={() => router.replace('/')} />
        <View style={styles.gap} />
        <SecondaryButton label="인증 현황 보기" onPress={() => router.replace({ pathname: '/certification/session/[id]', params: { id: sessionId } })} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <SpeechBubble text={first ? `${name} 정복!` : '또 왔네? 반가워!'} tone="yellow" tailPosition="left" />
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Mascot look={look} size={OFFICIAL_ART.boxFor(220)} silhouette={!official} accessibilityLabel={official ? `${name} 캐릭터` : '캐릭터 준비 중'} />
        </Animated.View>
      </View>

      <AppText variant="displayL" align="center">
        {first ? '새 캐릭터를 모았어요!' : '인증 완료!'}
      </AppText>
      <AppText variant="body" color="inkMuted" align="center" style={styles.sub}>
        {official ? `${name}의 캐릭터가 도감에 들어왔어요.` : `${name} 캐릭터는 준비 중이에요. 인증 기록은 저장됐어요.`}
      </AppText>

      <View style={styles.progress}>
        <ProgressCounter completed={count} size="md" caption={count >= TOTAL_MOUNTAINS ? '100개 다 모았다!' : `아직 ${TOTAL_MOUNTAINS - count}개나 남았는데?`} />
      </View>

      <PrimaryButton label="도감에서 보기" onPress={() => router.replace({ pathname: '/mountain/[id]', params: { id: mountainId } })} />
      <View style={styles.gap} />
      <SecondaryButton label="홈으로" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl, position: 'relative' },
  confetti: { position: 'absolute', left: 0, right: 0, top: 0, height: 80 },
  dot: { position: 'absolute', width: 10, height: 16, borderRadius: 3 },
  sub: { marginTop: spacing.sm },
  card: {
    marginVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progress: {
    marginVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  gap: { height: spacing.md },
});
