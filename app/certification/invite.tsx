import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, EmptyState, FriendSelectRow, LoadingSkeleton, PrimaryButton, Screen, SearchField, SecondaryButton, TopBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { OFFICIAL_CHARACTERS } from '@/data/officialArt';
import { authErrorMessage } from '@/features/auth/messages';
import { useCreateCertification, useInvitableFriends, type CaptureDraft } from '@/features/certification';
import { useMountain } from '@/features/mountains';
import { track } from '@/lib/analytics';

type Params = {
  mountainId: string;
  photoUri: string;
  latitude: string;
  longitude: string;
  accuracy?: string;
  capturedAt: string;
  distance: string;
};

/** Only mutual-follow friends can join one shared certification session. */
export default function InviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();
  const mountain = useMountain(params.mountainId);
  const friends = useInvitableFriends();
  const create = useCreateCertification();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    track('shared_invite_opened', { mountainId: params.mountainId });
  }, [params.mountainId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (friends.data ?? []).filter((f) => !q || f.username.includes(q) || (f.display_name ?? '').toLowerCase().includes(q));
  }, [friends.data, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        track('shared_friend_selected', { friendId: id });
      }
      return next;
    });
  };

  const draft: CaptureDraft | null = mountain.data
    ? {
        mountainId: mountain.data.id,
        photoUri: params.photoUri,
        latitude: Number(params.latitude),
        longitude: Number(params.longitude),
        gpsAccuracyM: params.accuracy ? Number(params.accuracy) : null,
        capturedAt: params.capturedAt,
        verificationRadiusM: mountain.data.verification_radius_m,
        distanceMeters: Number(params.distance),
      }
    : null;

  const submit = (inviteeIds: string[]) => {
    if (!draft) return;
    create.mutate(
      { draft, inviteeIds },
      {
        onSuccess: (result) =>
          router.replace({
            pathname: '/certification/success',
            params: {
              sessionId: result.sessionId,
              mountainId: result.mountainId,
              newlyCollected: result.newlyCollected ? '1' : '0',
              invited: String(result.invitedCount),
            },
          }),
      },
    );
  };

  const count = selected.size;

  return (
    <View style={styles.root}>
      <Screen contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}>
        <TopBar title="함께 인증" onBack={() => router.back()} />
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <AppText variant="displayL">같이 왔으면{`\n`}같이 남겨야지.</AppText>
            <AppText variant="bodySmall" color="inkMuted">맞팔 친구만 초대할 수 있어요. 각자 정상 위치 확인은 따로 해요.</AppText>
          </View>
          <Image source={OFFICIAL_CHARACTERS.pink[0]} contentFit="contain" style={styles.pink} accessibilityLabel="100PEAKS 공식 분홍 캐릭터" />
          <Image source={OFFICIAL_CHARACTERS.blue[2]} contentFit="contain" style={styles.blue} accessibilityLabel="100PEAKS 공식 파란 캐릭터" />
        </View>

        {friends.isLoading ? (
          <LoadingSkeleton lines={3} height={64} radius={18} />
        ) : friends.isError ? (
          <EmptyState title="잠깐 연결이 끊겼어요." description="다시 시도해주세요." actionLabel="다시 시도" onAction={() => friends.refetch()} mascot={false} />
        ) : (friends.data ?? []).length === 0 ? (
          <EmptyState title="같이 인증할 맞팔 친구가 아직 없어요." description="이번 인증은 혼자 남기고, 다음 산은 친구랑 가볼까요?" mascot={false} />
        ) : (
          <View>
            <View style={styles.search}>
              <SearchField value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder="친구 검색하기" autoCapitalize="none" />
            </View>
            {visible.length === 0 ? (
              <AppText variant="bodySmall" color="inkMuted" align="center" style={styles.noResult}>{`'${search.trim()}' 친구를 찾지 못했어요.`}</AppText>
            ) : (
              visible.map((f) => <FriendSelectRow key={f.id} user={f} selected={selected.has(f.id)} onToggle={() => toggle(f.id)} disabled={create.isPending} />)
            )}
          </View>
        )}
        <View style={styles.ruleCard}>
          <AppText variant="caption" weight="700">공동 인증 규칙</AppText>
          <AppText variant="caption" color="inkMuted">초대받은 친구도 정상 반경 안에서 직접 수락해야 해요. 요청은 24시간 뒤 만료돼요.</AppText>
        </View>
        {create.isError ? <AppText variant="bodySmall" color="danger" style={styles.error}>{authErrorMessage(create.error)}</AppText> : null}
      </Screen>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {count > 0 ? (
          <PrimaryButton label={`이 친구들과 같이 인증하기 (${count}명)`} tone="yellow" onPress={() => submit([...selected])} loading={create.isPending} />
        ) : (
          <PrimaryButton label="혼자 인증하기" onPress={() => submit([])} loading={create.isPending} />
        )}
        {count > 0 ? <View style={styles.footerGap}><SecondaryButton label="이번엔 혼자 인증하기" onPress={() => submit([])} disabled={create.isPending} /></View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { minHeight: 220, marginVertical: spacing.md, padding: spacing.xl, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink, borderRadius: radii.cardLarge, overflow: 'hidden' },
  heroText: { width: '64%', gap: spacing.sm, zIndex: 3 },
  pink: { position: 'absolute', width: 138, height: 180, right: -8, bottom: -22, transform: [{ rotate: '5deg' }] },
  blue: { position: 'absolute', width: 102, height: 140, right: 88, bottom: -42, transform: [{ rotate: '-7deg' }] },
  search: { marginBottom: spacing.md },
  noResult: { paddingVertical: spacing.xl },
  ruleCard: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.yellow, borderRadius: radii.card, gap: spacing.xs },
  error: { marginTop: spacing.md },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  footerGap: { marginTop: spacing.sm },
});
