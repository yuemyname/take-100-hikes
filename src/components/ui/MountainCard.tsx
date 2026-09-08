import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { getMascotLook, hasOfficialMascot, PLACEHOLDER_MASCOT } from '@/data/mascots';
import type { Mountain } from '@/types';

import { AppText } from './AppText';
import { CheckBadge } from './CheckBadge';
import { Mascot, OFFICIAL_ART } from './Mascot';
import { MountainPhoto } from './MountainPhoto';

export interface MountainCardProps {
  mountain: Mountain;
  index: number;
  completed: boolean;
  onPress: () => void;
}

const formatAltitude = (m: number | null) => (m === null ? '' : `${m.toLocaleString('ko-KR')}m`);

/** Grid: character visible at ~100pt, seated on the photo's bottom edge, never cropped. */
const CARD_MASCOT_SIZE = OFFICIAL_ART.boxFor(100);

/** Image-first collection card — spec §4.2. */
export function MountainCard({ mountain, index, completed, onPress }: MountainCardProps) {
  const official = hasOfficialMascot(mountain.mascot_key);
  // Mountains without approved artwork share the common locked placeholder.
  const look = official ? getMascotLook(mountain.mascot_key) : PLACEHOLDER_MASCOT;
  const silhouette = !completed || !official;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${index}. ${mountain.name_ko}, ${formatAltitude(mountain.altitude_m)}, ${mountain.region ?? ''}, ${completed ? '인증 완료' : '미인증'}`}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.photoWrap}>
        <MountainPhoto uri={mountain.image_url} seed={index} style={styles.photo} accessibilityLabel={`${mountain.name_ko} 사진`} />
        {completed ? (
          <View style={styles.check}>
            <CheckBadge />
          </View>
        ) : null}
        <View style={styles.mascot} pointerEvents="none">
          <Mascot
            look={look}
            size={CARD_MASCOT_SIZE}
            silhouette={silhouette}
            accessibilityLabel={official ? `${mountain.name_ko} 캐릭터` : '캐릭터 준비 중'}
          />
        </View>
        {completed && !official ? (
          <View style={styles.pending}>
            <AppText variant="caption" weight="700" color="surface">
              캐릭터 준비 중
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <AppText variant="heading3" numberOfLines={1}>
          {index}. {mountain.name_ko}
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
  pressed: { opacity: 0.9 },
  photoWrap: { aspectRatio: 1, position: 'relative', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  // Only the PNG's transparent bottom padding sits below the photo edge.
  mascot: { position: 'absolute', left: spacing.xs, bottom: -CARD_MASCOT_SIZE * OFFICIAL_ART.bottomPaddingRatio + 2 },
  pending: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  meta: { padding: spacing.md, gap: spacing.xxs },
});
