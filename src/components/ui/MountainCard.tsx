import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { OFFICIAL_STICKERS } from '@/data/officialArt';
import type { Mountain } from '@/types';

import { AppText } from './AppText';
import { CheckBadge } from './CheckBadge';
import { MountainPhoto } from './MountainPhoto';

export interface MountainCardProps {
  mountain: Mountain;
  index: number;
  completed: boolean;
  onPress: () => void;
}

const formatAltitude = (m: number | null) => (m === null ? '' : `${m.toLocaleString('ko-KR')}m`);

/**
 * Image-first mountain collection card.
 * The collectible is the mountain completion itself — there is no one-character-per-mountain mapping.
 */
export function MountainCard({ mountain, index, completed, onPress }: MountainCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${index}. ${mountain.name_ko}, ${formatAltitude(mountain.altitude_m)}, ${mountain.region ?? ''}, ${completed ? '인증 완료' : '미인증'}`}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.photoWrap}>
        <MountainPhoto uri={mountain.image_url} seed={index} style={styles.photo} accessibilityLabel={`${mountain.name_ko} 사진`} />
        <View style={styles.numberTag}>
          <AppText variant="caption" weight="800" color="surface">#{index}</AppText>
        </View>
        {completed ? (
          <>
            <View style={styles.check}>
              <CheckBadge />
            </View>
            <Image
              source={OFFICIAL_STICKERS.summitCheck}
              contentFit="contain"
              style={styles.completedSticker}
              accessibilityLabel="정상 접수 완료 스티커"
            />
          </>
        ) : (
          <View style={styles.lockedLabel}>
            <AppText variant="caption" weight="700" color="surface">아직 안 감</AppText>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <AppText variant="heading3" numberOfLines={1}>
          {mountain.name_ko}
        </AppText>
        <AppText variant="bodySmall" color="inkMuted">
          {formatAltitude(mountain.altitude_m)}
        </AppText>
        <AppText variant="caption" color="inkMuted">
          {mountain.region}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  photoWrap: { aspectRatio: 1, position: 'relative', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  numberTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  completedSticker: {
    position: 'absolute',
    width: 82,
    height: 56,
    left: spacing.sm,
    bottom: spacing.sm,
    transform: [{ rotate: '-5deg' }],
  },
  lockedLabel: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  meta: { padding: spacing.md, gap: spacing.xxs },
});
