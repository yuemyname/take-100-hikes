import { useRouter } from 'expo-router';

import { EmptyState, Screen, TopBar } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <TopBar title="길을 잃었어요" />
      <EmptyState
        title="여기는 산이 아닌데?"
        description="찾는 페이지가 없어요. 홈으로 돌아가볼까요?"
        actionLabel="홈으로"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
