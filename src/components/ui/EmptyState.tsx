import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants';

import { AppText } from './AppText';
import { MascotBadge } from './MascotBadge';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Show the placeholder mascot above the text. Default true. */
  mascot?: boolean;
}

/** Shared empty / error state block — spec §16. */
export function EmptyState({ title, description, actionLabel, onAction, mascot = true }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {mascot ? <MascotBadge size={72} /> : null}
      <AppText variant="heading3" align="center" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="bodySmall" color="inkMuted" align="center" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} tone="black" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xl },
  title: { marginTop: spacing.lg },
  description: { marginTop: spacing.sm },
  action: { marginTop: spacing.xxl },
});
