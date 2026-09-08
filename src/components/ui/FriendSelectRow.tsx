import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import type { Profile } from '@/types';

import { AppText } from './AppText';
import { Avatar } from './Avatar';

export interface FriendSelectRowProps {
  user: Profile;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** Mutual-friend picker row for shared certification — spec §6.3 step 4, §13. */
export function FriendSelectRow({ user, selected, onToggle, disabled }: FriendSelectRowProps) {
  const name = user.display_name ?? user.username;
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={`${name} @${user.username}`}
      style={({ pressed }) => [styles.row, selected ? styles.rowSelected : null, pressed ? styles.pressed : null]}
    >
      <View style={[styles.box, selected ? styles.boxSelected : null]}>
        {selected ? <MaterialCommunityIcons name="check-bold" size={16} color={colors.surface} /> : null}
      </View>
      <Avatar uri={user.avatar_url} name={name} size="md" />
      <View style={styles.text}>
        <AppText variant="body" weight="700" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" color="inkMuted" numberOfLines={1}>
          @{user.username}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.blue },
  pressed: { backgroundColor: colors.surfaceMuted },
  box: {
    width: 26,
    height: 26,
    borderRadius: radii.chip / 1.5,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  text: { flex: 1, gap: spacing.xxs },
});
