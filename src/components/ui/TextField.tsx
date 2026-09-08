import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontFamily, radii, spacing, typography } from '@/constants';

import { AppText } from './AppText';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

/** Labeled text input used by the auth shell. */
export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="bodySmall" weight="700" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted}
        {...rest}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  input: {
    fontSize: typography.body.fontSize,
    fontFamily: fontFamily.medium,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  inputError: { borderColor: colors.danger },
  error: { marginTop: spacing.xs },
});
