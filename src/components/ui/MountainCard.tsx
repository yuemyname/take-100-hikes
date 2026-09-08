import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import { getMascotLook } from '@/data/mascots';
import type { Mountain } from '@/types';

import { AppText } from './AppText';
import { CheckBadge } from './CheckBadge';
import { Mascot } from './Mascot';
import { MountainPhoto } from './MountainPhoto';

export interface MountainCardProps {
  mountain: Mountain;
  index: number;
  completed: boolean;
  onPress: () => void;
}

const formatAltitude = (m: number | null) => (m === null ? '' : `${m.toLocaleString('ko-KR')}m`);

/** Image-first collection card — spec §4.2. */
export function MountainCard({ mountain, index, completed, onPress }: MountainCardProps) {
  const look = getMascotLook(mountain.mascot_key);

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
        <View style={styles.mascot}>
          <Mascot look={look} size={56} silhouette={!completed} tilt={completed ? -6 : 0} />
        </View>
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
  photoWrap: { aspectRatio: 1, position: 'relative' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  mascot: { position: 'absolute', left: spacing.xs, bottom: 0 },
  meta: { padding: spacing.md, gap: spacing.xxs },
});
