import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  EmptyState,
  FavoriteButton,
  LoadingSkeleton,
  MountainPhoto,
  PrimaryButton,
  SegmentedControl,
  SpeechBubble,
} from '@/components/ui';
import { CertifiedUsersSection } from '@/components/social/CertifiedUsersSection';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { MOUNTAIN_DETAIL_CHARACTER, OFFICIAL_STICKERS } from '@/data/officialArt';
import { getSeedArea, useCompletedMountainIds, useFavorites, useMountain } from '@/features/mountains';
import { useCertifiedUsers } from '@/features/social';

type DetailTab = 'intro' | 'people';

/** 산 상세 — mountain photography first; official cast is recurring decoration, never mountain identity. */
export default function MountainDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<DetailTab>('intro');

  const mountain = useMountain(id);
  const completedQuery = useCompletedMountainIds();
  const { favorites, toggle, isToggling } = useFavorites();
  const certifiers = useCertifiedUsers(mountain.data?.id);
  const certifierCount = certifiers.data?.total;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/mountains'));

  if (mountain.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.padded}>
          <LoadingSkeleton height={280} radius={radii.cardLarge} />
          <View style={styles.gap} />
          <LoadingSkeleton height={32} width="55%" />
          <LoadingSkeleton height={18} width="35%" />
        </View>
      </SafeAreaView>
    );
  }

  if (mountain.isError || !mountain.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          title={mountain.isError ? '잠깐 연결이 끊겼어요.' : '이 산은 도감에 없어요'}
          description={mountain.isError ? '다시 시도해주세요.' : '주소가 잘못됐을 수 있어요.'}
          actionLabel={mountain.isError ? '다시 시도' : '도감으로'}
          onAction={() => (mountain.isError ? mountain.refetch() : goBack())}
        />
      </SafeAreaView>
    );
  }

  const m = mountain.data;
  const completed = completedQuery.data?.has(m.id) ?? false;
  const favorite = favorites.has(m.id);
  const area = getSeedArea(m.slug) ?? m.region ?? '';
  const altitude = m.altitude_m === null ? '' : `${m.altitude_m.toLocaleString('ko-KR')}m`;
  const description =
    m.description ?? `${area}에 있는 ${altitude}의 산이에요. 정상 반경 ${m.verification_radius_m}m 안에서 인증할 수 있어요.`;
  const bubble = completed ? `${m.name_ko} 접수 완료!` : '여긴 좀 가보고 싶은데?';

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <MountainPhoto uri={m.image_url} seed={m.display_order ?? 1} style={StyleSheet.absoluteFill} accessibilityLabel={`${m.name_ko} 사진`} />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="뒤로 가기" style={styles.roundButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
            </Pressable>
            <FavoriteButton active={favorite} onPress={() => toggle(m.id)} disabled={isToggling} />
          </SafeAreaView>

          <Image
            source={completed ? OFFICIAL_STICKERS.summitCheck : OFFICIAL_STICKERS.thisIsWhyIHike}
            contentFit="contain"
            style={styles.heroSticker}
            accessibilityLabel={completed ? '정상 접수 완료 그래픽' : '이 맛에 등산함 그래픽'}
          />

          <View style={styles.heroBubble} pointerEvents="none">
            <SpeechBubble text={bubble} tone="surface" tailPosition="right" />
          </View>

          <Image
            source={MOUNTAIN_DETAIL_CHARACTER}
            contentFit="contain"
            style={styles.heroCharacter}
            accessibilityLabel="100PEAKS 공식 캐릭터"
          />
        </View>

        <View style={styles.padded}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <AppText variant="displayL">{m.name_ko}</AppText>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="image-filter-hdr" size={16} color={colors.inkMuted} />
                <AppText variant="bodySmall" color="inkMuted">
                  {altitude} · {area}
                </AppText>
              </View>
            </View>
            {completed ? (
              <View style={styles.doneChip}>
                <MaterialCommunityIcons name="check-bold" size={14} color={colors.surface} />
                <AppText variant="caption" weight="700" color="surface">
                  인증 완료
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.tabs}>
            <SegmentedControl<DetailTab>
              options={[
                { key: 'intro', label: '소개' },
                { key: 'people', label: certifierCount === undefined ? '인증자' : `인증자 (${certifierCount.toLocaleString('ko-KR')})` },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>

          {tab === 'intro' ? (
            <View>
              <AppText variant="body">{description}</AppText>
              <View style={styles.factRow}>
                <Fact label="고도" value={altitude || '-'} />
                <Fact label="지역" value={m.region ?? '-'} />
                <Fact label="인증 반경" value={`${m.verification_radius_m}m`} />
              </View>
            </View>
          ) : (
            <CertifiedUsersSection mountainId={m.id} />
          )}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <PrimaryButton
          label="이 산 인증하기"
          onPress={() => router.push({ pathname: '/certification/capture', params: { mountainId: m.id } })}
        />
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="caption" color="inkMuted">
        {label}
      </AppText>
      <AppText variant="heading3">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  gap: { height: spacing.lg },
  hero: { height: 380, position: 'relative' },
  heroBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  roundButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSticker: {
    position: 'absolute',
    left: spacing.md,
    top: 88,
    width: 112,
    height: 74,
    transform: [{ rotate: '-7deg' }],
  },
  heroBubble: { position: 'absolute', right: spacing.lg, top: 92, maxWidth: 188 },
  heroCharacter: {
    position: 'absolute',
    right: -22,
    bottom: -54,
    width: 220,
    height: 270,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, paddingRight: 72 },
  titleText: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  tabs: { marginVertical: spacing.xl },
  factRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  fact: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  cta: {
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
