import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { invalidateAfterCertification, useViewerId } from '@/features/social';
import { track } from '@/lib/analytics';

import { createCertification, fetchInvitableFriends, fetchMyInvitations, fetchSession, respondToInvitation } from './api';
import type { CaptureDraft, InvitationResponse } from './types';

export const certificationKeys = {
  session: (id: string) => ['certificationSession', id] as const,
  invitations: (viewerId: string) => ['invitations', viewerId] as const,
  invitable: (viewerId: string) => ['invitableFriends', viewerId] as const,
};

export function useCreateCertification() {
  const { user } = useAuth();
  const viewerId = useViewerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draft, inviteeIds }: { draft: CaptureDraft; inviteeIds: string[] }) =>
      createCertification(draft, user?.id ?? null, inviteeIds),
    onSuccess: (result) => {
      track('certification_completed', { mountainId: result.mountainId, sessionId: result.sessionId, invited: result.invitedCount });
      if (result.newlyCollected) track('mountain_collected', { mountainId: result.mountainId });
      if (result.invitedCount > 0) track('shared_invite_sent', { sessionId: result.sessionId, count: result.invitedCount });
      invalidateAfterCertification(queryClient, viewerId);
    },
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: certificationKeys.session(sessionId ?? ''),
    queryFn: () => fetchSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
  });
}

/** Pending shared-certification requests addressed to the viewer. */
export function useMyInvitations() {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: certificationKeys.invitations(viewerId),
    queryFn: () => fetchMyInvitations(viewerId),
    staleTime: 15 * 1000,
  });
}

export function useInvitableFriends() {
  const viewerId = useViewerId();
  return useQuery({ queryKey: certificationKeys.invitable(viewerId), queryFn: () => fetchInvitableFriends(viewerId) });
}

export function useRespondToInvitation() {
  const viewerId = useViewerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (response: InvitationResponse) => respondToInvitation(response, viewerId),
    onSuccess: (detail, response) => {
      track(response.accept ? 'shared_invite_accepted' : 'shared_invite_declined', { sessionId: response.sessionId });
      if (response.accept) track('mountain_collected', { mountainId: detail.mountain.id });
      queryClient.setQueryData(certificationKeys.session(response.sessionId), detail);
      queryClient.invalidateQueries({ queryKey: certificationKeys.invitations(viewerId) });
      invalidateAfterCertification(queryClient, viewerId);
    },
  });
}
