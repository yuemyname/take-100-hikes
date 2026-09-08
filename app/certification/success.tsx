import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Share, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, LoadingSkeleton, ParticipantRow, PrimaryButton, ProgressCounter, Screen, SecondaryButton } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { OFFICIAL_CHARACTERS, OFFICIAL_STICKERS } from '@/data/officialArt';
import { useSession } from '@/features/certification';
import { useCompletedMountainIds, useMountain } from '@/features/mountains';
import { useViewerId } from '@/features/social';
import { TOTAL_MOUNTAINS } from '@/types';

const CONFETTI = [colors.blue, colors.red, colors.yellow, colors.green, colors.pink, colors.orange];

/** Certification complete. Mountains are collected; the four official characters are recurring brand actors. */
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
  const [scale] = useState(() => new Animated.Value(0.7));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const count = completed.data?.size ?? 0;

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
        <View style={[styles.hero, styles.sharedHero]}>
          <View style={styles.confetti} pointerEvents="none">
            {CONFETTI.map((c, i) => (
              <View key={c} style={[styles.dot, { backgroundColor: c, left: `${8 + i * 15}%`, top: i % 2 === 0 ? 8 : 40, transform: [{ rotate: `${i * 37}deg` }] }]} />
            ))}
          </View>
          <Animated.View style={[styles.castRow, { transform: [{ scale }], opacity }]}>
            <Image source={OFFICIAL_CHARACTERS.red[0]} contentFit="contain" style={styles.characterSmall} accessibilityLabel="100PEAKS 공식 빨간 캐릭터" />
            <Image source={OFFICIAL_CHARACTERS.blue[1]} contentFit="contain" style={styles.characterLarge} accessibilityLabel="100PEAKS 공식 파란 캐릭터" />
            <Image source={OFFICIAL_CHARACTERS.pink[2]} contentFit="contain" style={styles.characterSmall} accessibilityLabel="100PEAKS 공식 분홍 캐릭터" />
          </Animated.View>
          <Image source={OFFICIAL_STICKERS.summitSuccess} contentFit="contain" style={styles.successSticker} accessibilityLabel="완등 성공 스티커" />
        </View>
        <AppText variant="displayL" align="center">친구들에게{'\n'}인증 요청을 보냈어요!</AppText>
        <AppText variant="body" color="inkMuted" align="center" style={styles.sub}>
          친구가 정상에서 수락하면 하나의 공동 인증으로 남아요.{'\n'}요청은 최대 24시간 동안 유효해요.
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
        <SecondaryButton label="인증 현황 보기" onPress={() => router.replace({ pathname: '/certification/session/[id]', params: { id: sessionId } })} />
        <View style={styles.gap} />
        <SecondaryButton label="홈으로" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={[styles.hero, styles.soloHero]}>
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Image source={OFFICIAL_CHARACTERS.yellow[first ? 2 : 1]} contentFit="contain" style={styles.soloCharacter} accessibilityLabel="100PEAKS 공식 노란 캐릭터" />
        </Animated.View>
        <Image source={first ? OFFICIAL_STICKERS.didIt : OFFICIAL_STICKERS.summitToday} contentFit="contain" style={styles.didItSticker} accessibilityLabel={first ? '내가 해냄 스티커' : '오늘도 완등 스티커'} />
      </View>

      <AppText variant="displayL" align="center">{first ? `${name} 추가 완료!` : '인증 완료!'}</AppText>
      <AppText variant="body" color="inkMuted" align="center" style={styles.sub}>
        {first ? `100개의 산 중 ${name} 기록이 새로 들어왔어요.` : `${name}에 또 하나의 정상 기록을 남겼어요.`}
      </AppText>

      <View style={styles.progress}>
        <ProgressCounter completed={count} size="md" caption={count >= TOTAL_MOUNTAINS ? '100 / 100. 진짜 다 갔다!' : `아직 ${TOTAL_MOUNTAINS - count}개나 남았는데?`} />
      </View>

      <PrimaryButton label="산 기록 보기" onPress={() => router.replace({ pathname: '/mountain/[id]', params: { id: mountainId } })} />
      <View style={styles.gap} />
      <SecondaryButton label="홈으로" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl, position: 'relative', borderRadius: radii.cardLarge, overflow: 'hidden' },
  sharedHero: { height: 260, backgroundColor: colors.blue },
  soloHero: { height: 300, backgroundColor: colors.yellow },
  confetti: { position: 'absolute', left: 0, right: 0, top: 0, height: 80 },
  dot: { position: 'absolute', width: 10, height: 16, borderRadius: 3 },
  castRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 20 },
  characterSmall: { width: 112, height: 176, marginHorizontal: -20 },
  characterLarge: { width: 145, height: 216, zIndex: 2 },
  successSticker: { position: 'absolute', width: 118, height: 68, right: spacing.md, top: spacing.md, transform: [{ rotate: '7deg' }] },
  soloCharacter: { width: 220, height: 270 },
  didItSticker: { position: 'absolute', width: 124, height: 76, right: spacing.md, top: spacing.md, transform: [{ rotate: '8deg' }] },
  sub: { marginTop: spacing.sm },
  card: { marginVertical: spacing.xxl, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  progress: { marginVertical: spacing.xxl, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink, borderRadius: radii.cardLarge, padding: spacing.lg },
  gap: { height: spacing.md },
});
