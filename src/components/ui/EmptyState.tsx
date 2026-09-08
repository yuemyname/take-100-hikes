import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants';
import { GUIDE_MASCOT } from '@/data/mascots';

import { AppText } from './AppText';
import { Mascot, OFFICIAL_ART } from './Mascot';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Show the guide mascot above the text. Default true. */
  mascot?: boolean;
}

/** Shared empty / error state block — spec §16. */
export function EmptyState({ title, description, actionLabel, onAction, mascot = true }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {mascot ? <Mascot look={GUIDE_MASCOT} size={OFFICIAL_ART.boxFor(130)} accessibilityLabel="백픽스 가이드 캐릭터" /> : null}
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
