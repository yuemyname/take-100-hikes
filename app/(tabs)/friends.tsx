import { EmptyState, Screen, TopBar } from '@/components/ui';

/** Friends shell — follows and mutual friends land in Phase 3 (spec §7). */
export default function FriendsScreen() {
  return (
    <Screen>
      <TopBar title="친구" />
      <EmptyState
        title="같이 오를 친구를 찾아보세요"
        description="맞팔 친구는 산 상세에서 가장 먼저 보이고, 공동 인증에도 초대할 수 있어요."
      />
    </Screen>
  );
}
