import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { illustration, radii, spacing } from '@/constants';

import { AppText } from './AppText';

export interface SignPostProps {
  lines: string[];
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}

/** Hand-painted wooden trail sign for the home quote (UI concept). */
export function SignPost({ lines, tilt = -2, style }: SignPostProps) {
  return (
    <View style={[styles.wrap, { transform: [{ rotate: `${tilt}deg` }] }, style]}>
      <View style={styles.board}>
        {lines.map((line, index) => (
          <AppText key={`${index}-${line}`} display variant="heading2" align="center" style={styles.line}>
            {line}
          </AppText>
        ))}
      </View>
      <View style={styles.posts}>
        <View style={styles.post} />
        <View style={styles.post} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  board: {
    backgroundColor: illustration.wood,
    borderWidth: 3,
    borderColor: illustration.woodDark,
    borderRadius: radii.chip,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 220,
  },
  line: { lineHeight: 32, color: illustration.woodInk },
  posts: { flexDirection: 'row', gap: 90, marginTop: -2 },
  post: { width: 12, height: 34, backgroundColor: illustration.woodDark, borderRadius: 3 },
});
