import { useRouter } from 'expo-router';

import { EmptyState, Screen, TopBar } from '@/components/ui';

/** Certification entry shell — GPS and camera flow land in Phase 4 (spec §5). */
export default function VerifyScreen() {
  const router = useRouter();

  return (
    <Screen>
      <TopBar title="인증" />
      <EmptyState
        title="어느 산 정상이에요?"
        description="도감에서 산을 고르면 정상 반경 안에서 사진으로 인증할 수 있어요."
        actionLabel="산 고르러 가기"
        onAction={() => router.push('/mountains')}
      />
    </Screen>
  );
}
