import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { invalidateAfterCertification, useViewerId } from '@/features/social';
import { track } from '@/lib/analytics';

import { createCertification } from './api';
import type { CaptureDraft } from './types';

export function useCreateCertification() {
  const { user } = useAuth();
  const viewerId = useViewerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: CaptureDraft) => createCertification(draft, user?.id ?? null),
    onSuccess: (result) => {
      track('certification_completed', { mountainId: result.mountainId, sessionId: result.sessionId });
      if (result.newlyCollected) track('mountain_collected', { mountainId: result.mountainId });
      invalidateAfterCertification(queryClient, viewerId);
    },
  });
}
