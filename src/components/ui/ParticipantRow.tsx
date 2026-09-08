import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants';
import type { CertificationMemberStatus, Profile } from '@/types';

import { AppText } from './AppText';
import { Avatar } from './Avatar';

export interface ParticipantRowProps {
  user: Profile;
  status: CertificationMemberStatus;
  isCreator?: boolean;
  isMe?: boolean;
}

const STATUS: Record<CertificationMemberStatus, { label: string; bg: string; fg: 'ink' | 'surface'; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  confirmed: { label: '인증 완료', bg: colors.success, fg: 'surface', icon: 'check-bold' },
  invited: { label: '대기 중', bg: colors.yellow, fg: 'ink', icon: 'clock-outline' },
  declined: { label: '거절', bg: colors.surfaceMuted, fg: 'ink', icon: 'close' },
  expired: { label: '만료', bg: colors.surfaceMuted, fg: 'ink', icon: 'timer-off-outline' },
};

/** Shared-session participant with a visible status — spec §6.4, §6.5, §20. */
export function ParticipantRow({ user, status, isCreator = false, isMe = false }: ParticipantRowProps) {
  const name = user.display_name ?? user.username;
  const s = STATUS[status];
  return (
    <View style={styles.row} accessible accessibilityLabel={`${name}${isCreator ? ', 생성자' : ''}, ${s.label}`}>
      <Avatar uri={user.avatar_url} name={name} size="md" />
      <View style={styles.text}>
        <AppText variant="body" weight="700" numberOfLines={1}>
          {name}
          {isMe ? ' (나)' : ''}
        </AppText>
        <AppText variant="caption" color="inkMuted">
          {isCreator ? '요청 보냄' : status === 'invited' ? '요청 전송 완료' : `@${user.username}`}
        </AppText>
      </View>
      <View style={[styles.chip, { backgroundColor: s.bg }]}>
        <MaterialCommunityIcons name={s.icon} size={14} color={colors[s.fg]} />
        <AppText variant="caption" weight="700" color={s.fg}>
          {s.label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  text: { flex: 1, gap: spacing.xxs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
