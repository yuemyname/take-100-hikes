import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, ProgressCounter, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import { authErrorMessage } from '@/features/auth/messages';

/** MY shell — history, region progress and badges land in later phases (spec §8). */
export default function ProfileScreen() {
  const { user, status, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metadata = user?.user_metadata as { display_name?: string; username?: string } | undefined;
  const displayName = metadata?.display_name ?? metadata?.username ?? (status === 'guest' ? '게스트' : '나');
  const username = metadata?.username ?? (status === 'guest' ? 'guest' : null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen>
      <TopBar title="MY" />
      <View style={styles.header}>
        <Avatar name={displayName} size="xl" />
        <AppText variant="heading2" style={styles.name}>
          {displayName}
        </AppText>
        {username ? (
          <AppText variant="bodySmall" color="inkMuted">
            @{username}
          </AppText>
        ) : null}
      </View>

      <View style={styles.progress}>
        <ProgressCounter completed={0} size="md" caption="첫 번째 산은 어디로 갈 건데?" />
      </View>

      {error ? (
        <AppText variant="bodySmall" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <SecondaryButton label={status === 'guest' ? '둘러보기 종료' : '로그아웃'} onPress={handleSignOut} disabled={signingOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.lg },
  name: { marginTop: spacing.md },
  progress: { marginVertical: spacing.xxxl },
  error: { marginBottom: spacing.md },
});
