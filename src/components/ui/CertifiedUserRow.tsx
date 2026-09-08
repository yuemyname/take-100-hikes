import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import type { Profile } from '@/types';

import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { MountainPhoto } from './MountainPhoto';

export interface CertifiedUserRowProps {
  user: Profile;
  certifiedAt: string;
  photoUrl?: string | null;
  /** Confirmed members on the same session; > 1 shows a "함께" badge. */
  partySize?: number;
  /** Mutual friends get the crown treatment from the UI concept. */
  mutual?: boolean;
  isMe?: boolean;
  onPress?: () => void;
}

export function formatCertifiedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** Certifier row — spec §4.3: avatar, display name, certification date, photo thumbnail. */
export function CertifiedUserRow({ user, certifiedAt, photoUrl, partySize = 1, mutual = false, isMe = false, onPress }: CertifiedUserRowProps) {
  const name = user.display_name ?? user.username;
  const label = `${name}, ${formatCertifiedDate(certifiedAt)} 인증${partySize > 1 ? `, ${partySize}명 함께` : ''}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View>
        <Avatar uri={user.avatar_url} name={name} size="md" ringColor={mutual ? colors.yellow : undefined} />
        {mutual ? (
          <View style={styles.crown}>
            <MaterialCommunityIcons name="crown" size={12} color={colors.ink} />
          </View>
        ) : null}
      </View>
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <AppText variant="body" weight="700" numberOfLines={1}>
            {isMe ? `${name} (나)` : name}
          </AppText>
          {partySize > 1 ? (
            <View style={styles.party}>
              <MaterialCommunityIcons name="account-multiple" size={12} color={colors.blue} />
              <AppText variant="caption" weight="700" color="blue">
                {partySize}명 함께
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="caption" color="inkMuted">
          {formatCertifiedDate(certifiedAt)}
        </AppText>
      </View>
      <MountainPhoto uri={photoUrl} radius={radii.chip} seed={certifiedAt.length} style={styles.thumb} accessibilityLabel="인증 사진" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 12,
    paddingVertical: spacing.sm,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  crown: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xxs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  party: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  thumb: { width: 48, height: 48 },
});
