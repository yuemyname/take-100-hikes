import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants';

export interface ScreenProps extends PropsWithChildren {
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
  /** Horizontal padding. Default true. */
  padded?: boolean;
  edges?: Edge[];
  contentContainerStyle?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
  testID?: string;
}

/**
 * Base screen container: cream background, safe-area aware, optional scroll.
 * The bottom edge is handled by the tab bar, so it defaults to top only.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  contentContainerStyle,
  refreshControl,
  testID,
}: ScreenProps) {
  const paddingStyle = padded ? styles.padded : null;

  return (
    <SafeAreaView style={styles.safe} edges={edges} testID={testID}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, paddingStyle, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, paddingStyle, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.huge },
  padded: { paddingHorizontal: spacing.xl },
});
