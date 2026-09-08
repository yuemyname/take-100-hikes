import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontFamily, radii, spacing, typography } from '@/constants';

export interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  onClear?: () => void;
}

export function SearchField({ value, onClear, ...rest }: SearchFieldProps) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="magnify" size={22} color={colors.inkMuted} />
      <TextInput
        value={value}
        placeholderTextColor={colors.inkMuted}
        autoCorrect={false}
        clearButtonMode="never"
        returnKeyType="search"
        accessibilityRole="search"
        {...rest}
        style={styles.input}
      />
      {value && onClear ? (
        <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="검색어 지우기" hitSlop={8}>
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  input: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontFamily: fontFamily.medium,
    color: colors.ink,
    paddingVertical: spacing.sm,
  },
});
