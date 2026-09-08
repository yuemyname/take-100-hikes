import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, CertifiedUserRow, EmptyState, LoadingSkeleton } from '@/components/ui';
import { colors, spacing } from '@/constants';
import { useCertifiedUsers, useViewerId } from '@/features/social';

export interface CertifiedUsersSectionProps {
  mountainId: string;
}

/**
 * 인증자 tab body — spec §4.3. Mutual friends are a separate block that is
 * always rendered above every other certified user.
 */
export function CertifiedUsersSection({ mountainId }: CertifiedUsersSectionProps) {
  const router = useRouter();
  const viewerId = useViewerId();
  const certifiers = useCertifiedUsers(mountainId);

  if (certifiers.isLoading) {
    return (
      <View style={styles.block}>
        <LoadingSkeleton lines={4} height={56} radius={12} />
      </View>
    );
  }
  if (certifiers.isError || !certifiers.data) {
    return (
      <EmptyState
        title="잠깐 연결이 끊겼어요."
        description="다시 시도해주세요."
        actionLabel="다시 시도"
        onAction={() => certifiers.refetch()}
        mascot={false}
      />
    );
  }

  const { mutual, others, total } = certifiers.data;
  const openUser = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });

  return (
    <View>
      <View style={styles.block}>
        <AppText variant="heading3">
          내 친구 인증자{' '}
          <AppText variant="heading3" color="blue">
            {mutual.length}
          </AppText>
        </AppText>
        {mutual.length === 0 ? (
          <View style={styles.friendEmpty}>
            <AppText variant="bodySmall" color="inkMuted">
              아직 이 산을 인증한 친구가 없어요.{'\n'}먼저 다녀와서 자랑해볼까요?
            </AppText>
          </View>
        ) : (
          mutual.map((c) => (
            <CertifiedUserRow
              key={c.user.id}
              user={c.user}
              certifiedAt={c.certifiedAt}
              photoUrl={c.photoUrl}
              partySize={c.partySize}
              mutual
              onPress={() => openUser(c.user.id)}
            />
          ))
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.block}>
        <AppText variant="heading3">
          전체 인증자{' '}
          <AppText variant="heading3" color="inkMuted">
            {total.toLocaleString('ko-KR')}
          </AppText>
        </AppText>
        {others.length === 0 && mutual.length === 0 ? (
          <View style={styles.friendEmpty}>
            <AppText variant="bodySmall" color="inkMuted">
              아직 아무도 인증하지 않은 산이에요. 첫 번째가 되어볼까요?
            </AppText>
          </View>
        ) : (
          others.map((c) => (
            <CertifiedUserRow
              key={c.user.id}
              user={c.user}
              certifiedAt={c.certifiedAt}
              photoUrl={c.photoUrl}
              partySize={c.partySize}
              isMe={c.user.id === viewerId}
              onPress={() => openUser(c.user.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  friendEmpty: { paddingVertical: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
});
