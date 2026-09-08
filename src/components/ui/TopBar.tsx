import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, MIN_TOUCH_TARGET, spacing } from '@/constants';

import { AppText } from './AppText';
import { Wordmark } from './Wordmark';

export interface TopBarProps {
  title?: string;
  /** Render the 100PEAKS wordmark instead of a title. */
  wordmark?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}

export function TopBar({ title, wordmark = false, onBack, right }: TopBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={8}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {wordmark ? (
          <Wordmark size={22} />
        ) : title ? (
          <AppText variant="heading3" accessibilityRole="header" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  side: { width: MIN_TOUCH_TARGET, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
