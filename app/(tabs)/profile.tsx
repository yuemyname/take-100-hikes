import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ProfileBody } from '@/components/social/ProfileBody';
import { AppText, EmptyState, LoadingSkeleton, Screen, SecondaryButton, TopBar } from '@/components/ui';
import { spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import { authErrorMessage } from '@/features/auth/messages';
import { useProfile, useViewerId } from '@/features/social';

/** MY — spec §8. Shared hikes appear in history as "N명 함께"; badges land with Phase 6 polish. */
export default function ProfileScreen() {
  const router = useRouter();
  const { status, signOut } = useAuth();
  const viewerId = useViewerId();
  const profile = useProfile(viewerId);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      {profile.isLoading ? (
        <View style={styles.center}>
          <LoadingSkeleton width={88} height={88} radius={44} />
          <View style={styles.gap} />
          <LoadingSkeleton width="40%" height={28} />
        </View>
      ) : profile.isError ? (
        <EmptyState title="잠깐 연결이 끊겼어요." description="다시 시도해주세요." actionLabel="다시 시도" onAction={() => profile.refetch()} />
      ) : !profile.data ? (
        <EmptyState
          title="프로필을 아직 못 만들었어요"
          description="가입 직후라면 잠시 후 다시 열어보세요. 계속 안 보이면 다시 로그인해주세요."
          actionLabel="다시 불러오기"
          onAction={() => profile.refetch()}
        />
      ) : (
        <ProfileBody
          user={profile.data}
          showCaption
          action={
            <View style={styles.editProfile}>
              <SecondaryButton label="프로필 · 홈 배경 수정" onPress={() => router.push('/profile/edit')} />
            </View>
          }
        />
      )}

      {error ? (
        <AppText variant="bodySmall" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.signOut}>
        <SecondaryButton label={status === 'guest' ? '둘러보기 종료' : '로그아웃'} onPress={handleSignOut} disabled={signingOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: spacing.xl },
  gap: { height: spacing.md },
  error: { marginTop: spacing.lg },
  editProfile: { alignSelf: 'stretch', marginTop: spacing.lg },
  signOut: { marginTop: spacing.xxxl },
});
