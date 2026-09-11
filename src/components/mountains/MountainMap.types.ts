import type { Mountain } from '@/types';

export interface MountainMapProps {
  mountains: Mountain[];
  completedIds: ReadonlySet<string>;
  onPressMountain: (mountainId: string) => void;
}
