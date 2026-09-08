import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, spacing } from '@/constants';
import type { Profile } from '@/types';

import { AppText } from './AppText';
import { Avatar } from './Avatar';

export interface UserRowProps {
  user: Profile;
  /** Secondary line, e.g. "@username" or "산 12개". */
  subtitle?: string;
  onPress?: () => void;
  /** Trailing control (e.g. FollowButton). Rendered outside the pressable so buttons never nest. */
  right?: ReactNode;
}

/** Generic person row used by friend lists and search results. */
export function UserRow({ user, subtitle, onPress, right }: UserRowProps) {
  const name = user.display_name ?? user.username;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${name} 프로필`}
        style={({ pressed }) => [styles.main, pressed && onPress ? styles.pressed : null]}
      >
        <Avatar uri={user.avatar_url} name={name} size="md" />
        <View style={styles.text}>
          <AppText variant="body" weight="700" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="caption" color="inkMuted" numberOfLines={1}>
            {subtitle ?? `@${user.username}`}
          </AppText>
        </View>
      </Pressable>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET + 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  pressed: { backgroundColor: colors.surfaceMuted },
  text: { flex: 1, gap: spacing.xxs },
});
