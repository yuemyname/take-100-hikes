import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants';

import { AppText } from './AppText';
import { Avatar, type AvatarSize } from './Avatar';

export interface AvatarRowItem {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface AvatarRowProps {
  people: AvatarRowItem[];
  max?: number;
  size?: AvatarSize;
}

/** Overlapping avatar stack with a "+N" overflow badge. */
export function AvatarRow({ people, max = 4, size = 'sm' }: AvatarRowProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <View style={styles.row} accessibilityLabel={`${people.length}명`}>
      {visible.map((person, index) => (
        <View key={person.id} style={index > 0 ? styles.overlap : null}>
          <Avatar uri={person.avatarUrl} name={person.name} size={size} ringColor={colors.background} />
        </View>
      ))}
      {overflow > 0 ? (
        <AppText variant="caption" color="inkMuted" style={styles.overflow}>
          +{overflow}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  overlap: { marginLeft: -spacing.sm },
  overflow: { marginLeft: spacing.xs },
});
