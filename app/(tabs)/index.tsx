import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, MascotBadge, ProgressCounter, Screen, SpeechBubble, TopBar } from '@/components/ui';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import { TOTAL_MOUNTAINS } from '@/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Four one-tap quick actions — spec §4.1. */
const QUICK_ACTIONS: { label: string; icon: IconName; href: Href; tone: string }[] = [
  { label: '명산 도감', icon: 'image-filter-hdr', href: '/mountains', tone: colors.blue },
  { label: '인증하기', icon: 'camera', href: '/verify', tone: colors.yellow },
  { label: '친구', icon: 'account-group', href: '/friends', tone: colors.pink },
  { label: '내 기록', icon: 'notebook', href: '/profile', tone: colors.green },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, status } = useAuth();

  // Real progress arrives with the certification queries in later phases.
  const completed = 0;
  const remaining = TOTAL_MOUNTAINS - completed;
  const displayName =
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ??
    (status === 'guest' ? '게스트' : null);

  return (
    <Screen>
      <TopBar
        wordmark
        right={
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="내 프로필"
            hitSlop={8}
          >
            <Avatar name={displayName} size="md" />
          </Pressable>
        }
      />

      <View style={styles.progress}>
        <ProgressCounter completed={completed} caption={`아직 ${remaining}개나 남았는데?`} />
      </View>

      <View style={styles.hero} accessibilityLabel="산 사진 영역">
        <View style={styles.heroPhoto}>
          <MaterialCommunityIcons name="image-filter-hdr" size={72} color={colors.surface} />
          <AppText variant="caption" color="surface" style={styles.heroHint}>
            첫 산을 인증하면 여기에 사진이 걸려요
          </AppText>
        </View>
        <View style={styles.mascotOverlay}>
          <SpeechBubble text="이번엔 어디 갈 건데?" tone="yellow" />
          <View style={styles.mascot}>
            <MascotBadge size={64} color={colors.pink} />
          </View>
        </View>
      </View>

      <View style={styles.quote}>
        <AppText variant="heading2">산은 왜 하는 건데?</AppText>
        <AppText variant="heading3" color="inkMuted">
          — 그냥 좋으니까.
        </AppText>
      </View>

      <View style={styles.actions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.href)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.tone }]}>
              <MaterialCommunityIcons
                name={action.icon}
                size={22}
                color={action.tone === colors.yellow ? colors.ink : colors.surface}
              />
            </View>
            <AppText variant="bodySmall" style={styles.actionLabel}>
              {action.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { marginTop: spacing.sm },
  hero: { marginTop: spacing.xxl },
  heroPhoto: {
    height: 260,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
    // Leave the lower-left corner free for the mascot + speech bubble overlay.
    paddingBottom: 96,
    overflow: 'hidden',
  },
  heroHint: { marginTop: spacing.sm },
  mascotOverlay: {
    position: 'absolute',
    left: spacing.lg,
    bottom: -spacing.lg,
    alignItems: 'flex-start',
  },
  mascot: { marginTop: spacing.xs, marginLeft: spacing.sm },
  quote: { marginTop: spacing.xxxl + spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xxl },
  action: {
    width: '47%',
    flexGrow: 1,
    minHeight: MIN_TOUCH_TARGET + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  actionPressed: { backgroundColor: colors.surfaceMuted },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontWeight: '700' },
});
