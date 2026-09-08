import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, Mascot, OFFICIAL_ART, PrimaryButton, ProgressCounter, Screen, SecondaryButton, SpeechBubble } from '@/components/ui';
import { colors, spacing } from '@/constants';
import { getMascotLook, hasOfficialMascot, PLACEHOLDER_MASCOT } from '@/data/mascots';
import { useCompletedMountainIds, useMountain } from '@/features/mountains';
import { TOTAL_MOUNTAINS } from '@/types';

/** Certification complete: reveal the mountain's character and the new count (spec §5, §20). */
export default function SuccessScreen() {
  const router = useRouter();
  const { mountainId, newlyCollected } = useLocalSearchParams<{ sessionId: string; mountainId: string; newlyCollected?: string }>();
  const mountain = useMountain(mountainId);
  const completed = useCompletedMountainIds();
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

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <SpeechBubble text={first ? `${name} 정복!` : '또 왔네? 반가워!'} tone="yellow" tailPosition="left" />
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Mascot
            look={look}
            size={OFFICIAL_ART.boxFor(220)}
            silhouette={!official}
            accessibilityLabel={official ? `${name} 캐릭터` : '캐릭터 준비 중'}
          />
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
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  sub: { marginTop: spacing.sm },
  progress: {
    marginVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
  },
  gap: { height: spacing.md },
});
