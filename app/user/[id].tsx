import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProfileBody } from '@/components/social/ProfileBody';
import { AppText, EmptyState, FollowButton, LoadingSkeleton, Screen, TopBar } from '@/components/ui';
import { spacing } from '@/constants';
import { useProfile, useRelationship, useToggleFollow, useViewerId } from '@/features/social';

/** Friend profile — spec §7.3. */
export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewerId = useViewerId();
  const profile = useProfile(id);
  const { relationship, isLoading: relLoading } = useRelationship(id);
  const toggleFollow = useToggleFollow();

  const isMe = useMemo(() => id === viewerId, [id, viewerId]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/friends'));

  if (profile.isLoading) {
    return (
      <Screen>
        <TopBar onBack={goBack} />
        <View style={styles.center}>
          <LoadingSkeleton width={88} height={88} radius={44} />
          <View style={styles.gap} />
          <LoadingSkeleton width="40%" height={28} />
        </View>
      </Screen>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <Screen>
        <TopBar onBack={goBack} />
        <EmptyState
          title={profile.isError ? '잠깐 연결이 끊겼어요.' : '없는 사용자예요'}
          description={profile.isError ? '다시 시도해주세요.' : '탈퇴했거나 주소가 잘못됐을 수 있어요.'}
          actionLabel={profile.isError ? '다시 시도' : '친구로 돌아가기'}
          onAction={() => (profile.isError ? profile.refetch() : goBack())}
        />
      </Screen>
    );
  }

  const user = profile.data;
  const following = relationship === 'following' || relationship === 'mutual';

  return (
    <Screen>
      <TopBar
        title={`@${user.username}`}
        onBack={goBack}
        right={
          isMe ? (
            <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="내 페이지로" hitSlop={8}>
              <MaterialCommunityIcons name="account-circle-outline" size={26} />
            </Pressable>
          ) : null
        }
      />
      <ProfileBody
        user={user}
        action={
          isMe ? null : (
            <View style={styles.action}>
              <FollowButton
                relationship={relationship ?? 'none'}
                loading={relLoading || (toggleFollow.isPending && toggleFollow.variables?.targetId === user.id)}
                onPress={() => toggleFollow.mutate({ targetId: user.id, follow: !following })}
              />
              {relationship === 'follower' ? (
                <AppText variant="caption" color="inkMuted" align="center" style={styles.hint}>
                  {user.display_name ?? user.username}님이 나를 팔로우하고 있어요. 맞팔하면 공동 인증에 초대할 수 있어요.
                </AppText>
              ) : relationship === 'mutual' ? (
                <AppText variant="caption" color="inkMuted" align="center" style={styles.hint}>
                  맞팔 친구예요. 공동 인증에 초대할 수 있어요.
                </AppText>
              ) : null}
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: spacing.xl },
  gap: { height: spacing.md },
  action: { alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm },
  hint: { paddingHorizontal: spacing.xl },
});
