import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import type { Profile } from '@/types';

import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export interface InvitationCardProps {
  creator: Profile;
  mountainName: string;
  expiresAt: string;
  onAccept: () => void;
  onDecline: () => void;
  declining?: boolean;
}

function hoursLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 3_600_000));
}

/** Incoming shared-certification request — spec §6.3 step 6 copy and actions. */
export function InvitationCard({ creator, mountainName, expiresAt, onAccept, onDecline, declining }: InvitationCardProps) {
  const name = creator.display_name ?? creator.username;
  return (
    <View style={styles.card} accessible accessibilityLabel={`${name}님의 ${mountainName} 공동 인증 요청`}>
      <View style={styles.head}>
        <Avatar uri={creator.avatar_url} name={name} size="md" ringColor={colors.yellow} />
        <View style={styles.headText}>
          <AppText variant="body" weight="700">
            @{creator.username}이 {mountainName} 공동 인증을 요청했어요.
          </AppText>
          <View style={styles.meta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.inkMuted} />
            <AppText variant="caption" color="inkMuted">
              {hoursLeft(expiresAt)}시간 안에 정상에서 참여해야 해요
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.action}>
          <PrimaryButton label="인증 참여" tone="yellow" onPress={onAccept} />
        </View>
        <View style={styles.action}>
          <SecondaryButton label="거절" onPress={onDecline} disabled={declining} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.cardLarge,
    padding: spacing.lg,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headText: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
