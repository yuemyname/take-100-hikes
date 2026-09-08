import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants';

export type MascotState = 'revealed' | 'silhouette';

export interface MascotBadgeProps {
  /** Mountain mascot key, e.g. "seorak". Illustrations are added progressively (spec §2.6). */
  mascotKey?: string | null;
  state?: MascotState;
  size?: number;
  /** Body color for the placeholder creature. */
  color?: string;
}

/**
 * Collectible character slot. Until per-mountain artwork exists it renders an
 * original placeholder creature: a solid blob with a naive face. Locked
 * mountains show a silhouette.
 */
export function MascotBadge({ state = 'revealed', size = 64, color = colors.pink }: MascotBadgeProps) {
  const silhouette = state === 'silhouette';
  const body = silhouette ? colors.border : color;

  return (
    <View
      accessibilityLabel={silhouette ? '아직 만나지 못한 캐릭터' : '수집한 캐릭터'}
      style={[styles.body, { width: size, height: size * 0.92, borderRadius: size / 2, backgroundColor: body }]}
    >
      {silhouette ? (
        <MaterialCommunityIcons name="help" size={size * 0.4} color={colors.inkMuted} />
      ) : (
        <View style={styles.face}>
          <View style={[styles.eye, { width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08 }]} />
          <View style={[styles.eye, { width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08 }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 20,
  },
  face: { flexDirection: 'row', gap: spacing.sm },
  eye: { backgroundColor: colors.ink },
});
