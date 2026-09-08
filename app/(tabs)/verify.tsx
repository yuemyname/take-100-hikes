import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState, Screen, TopBar } from '@/components/ui';
import { useMountain } from '@/features/mountains';

/** Certification entry shell — GPS and camera flow land in Phase 4 (spec §5). */
export default function VerifyScreen() {
  const router = useRouter();
  const { mountainId } = useLocalSearchParams<{ mountainId?: string }>();
  const mountain = useMountain(mountainId);
  const name = mountain.data?.name_ko;

  return (
    <Screen>
      <TopBar title="인증" />
      <EmptyState
        title={name ? `${name} 정상이에요?` : '어느 산 정상이에요?'}
        description={
          name
            ? '정상 반경 안에서 사진을 찍으면 인증돼요. 카메라와 GPS 인증은 곧 열려요.'
            : '도감에서 산을 고르면 정상 반경 안에서 사진으로 인증할 수 있어요.'
        }
        actionLabel={name ? '다른 산 고르기' : '산 고르러 가기'}
        onAction={() => router.push('/mountains')}
      />
    </Screen>
  );
}
