import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, EmptyState, FollowButton, LoadingSkeleton, Pill, Screen, SearchField, TopBar, UserRow } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { relationshipOf, useFollowSets, useProfileSearch, useProfilesByIds, useToggleFollow } from '@/features/social';
import type { Profile } from '@/types';

type FriendTab = 'mutual' | 'following' | 'followers';

const TABS: { key: FriendTab; label: string }[] = [
  { key: 'mutual', label: '맞팔 친구' },
  { key: 'following', label: '팔로잉' },
  { key: 'followers', label: '팔로워' },
];

/** 친구 — spec §7. Mutual friends are the people who can be invited to shared certification. */
export default function FriendsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<FriendTab>('mutual');
  const [search, setSearch] = useState('');

  const sets = useFollowSets();
  const toggleFollow = useToggleFollow();
  const results = useProfileSearch(search);

  const ids = useMemo(() => {
    if (!sets.data) return [];
    const source = tab === 'mutual' ? sets.data.mutual : tab === 'following' ? sets.data.following : sets.data.followers;
    return [...source];
  }, [sets.data, tab]);
  const people = useProfilesByIds(ids);

  const openUser = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });

  const renderPerson = (user: Profile, subtitle?: string) => {
    const relationship = sets.data ? relationshipOf(sets.data, user.id) : 'none';
    const isPending = toggleFollow.isPending && toggleFollow.variables?.targetId === user.id;
    return (
      <UserRow
        key={user.id}
        user={user}
        subtitle={subtitle}
        onPress={() => openUser(user.id)}
        right={
          <FollowButton
            compact
            relationship={relationship}
            loading={isPending}
            onPress={() =>
              toggleFollow.mutate({
                targetId: user.id,
                follow: !(relationship === 'following' || relationship === 'mutual'),
              })
            }
          />
        }
      />
    );
  };

  const searching = search.trim().length > 0;

  return (
    <Screen>
      <TopBar title="친구" />
      <View style={styles.search}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="아이디나 이름으로 친구 찾기"
          autoCapitalize="none"
        />
      </View>

      {searching ? (
        <View>
          <AppText variant="heading3" style={styles.sectionTitle}>
            검색 결과
          </AppText>
          {results.isLoading ? (
            <LoadingSkeleton lines={3} height={56} radius={12} />
          ) : results.isError ? (
            <EmptyState title="잠깐 연결이 끊겼어요." description="다시 시도해주세요." actionLabel="다시 시도" onAction={() => results.refetch()} mascot={false} />
          ) : (results.data ?? []).length === 0 ? (
            <EmptyState title={`'${search.trim()}'을 찾지 못했어요`} description="아이디 철자를 다시 확인해볼까요?" />
          ) : (
            (results.data ?? []).map((user) => renderPerson(user))
          )}
        </View>
      ) : (
        <View>
          <View style={styles.summary}>
            <Stat label="맞팔" value={sets.data?.mutual.size} onPress={() => setTab('mutual')} active={tab === 'mutual'} />
            <Stat label="팔로잉" value={sets.data?.following.size} onPress={() => setTab('following')} active={tab === 'following'} />
            <Stat label="팔로워" value={sets.data?.followers.size} onPress={() => setTab('followers')} active={tab === 'followers'} />
          </View>
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pill key={t.key} label={t.label} selected={t.key === tab} onPress={() => setTab(t.key)} tone="blue" />
            ))}
          </View>

          {sets.isLoading || (ids.length > 0 && people.isLoading) ? (
            <LoadingSkeleton lines={4} height={56} radius={12} />
          ) : sets.isError || people.isError ? (
            <EmptyState
              title="잠깐 연결이 끊겼어요."
              description="다시 시도해주세요."
              actionLabel="다시 시도"
              onAction={() => {
                sets.refetch();
                people.refetch();
              }}
              mascot={false}
            />
          ) : ids.length === 0 ? (
            <EmptyState
              title={tab === 'mutual' ? '같이 인증할 맞팔 친구가 아직 없어요.' : tab === 'following' ? '아직 팔로우한 사람이 없어요' : '아직 팔로워가 없어요'}
              description={tab === 'mutual' ? '친구를 먼저 찾아보세요. 서로 팔로우하면 맞팔 친구가 돼요.' : '위에서 아이디로 친구를 찾아보세요.'}
            />
          ) : (
            (people.data ?? []).map((user) => renderPerson(user))
          )}
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value, active, onPress }: { label: string; value?: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} ${value ?? 0}명`}
      style={[styles.stat, active ? styles.statActive : null]}
    >
      <AppText variant="heading2">{value ?? '-'}</AppText>
      <AppText variant="caption" color="inkMuted">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { marginTop: spacing.xs },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.sm },
  summary: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
  },
  statActive: { borderColor: colors.ink },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
});
