/**
 * Product analytics events — 100PEAKS_MASTER_SPEC.md §22. Stable names only.
 * The sink is a console logger for now; swap `send` for a real provider later.
 */
export type AnalyticsEvent =
  | 'home_viewed'
  | 'mountain_list_viewed'
  | 'mountain_detail_viewed'
  | 'verification_started'
  | 'verification_location_passed'
  | 'verification_photo_captured'
  | 'shared_invite_opened'
  | 'shared_friend_selected'
  | 'shared_invite_sent'
  | 'shared_invite_accepted'
  | 'shared_invite_declined'
  | 'certification_completed'
  | 'mountain_collected'
  | 'friend_followed'
  | 'friend_unfollowed';

type Props = Record<string, string | number | boolean | null | undefined>;

function send(event: AnalyticsEvent, props?: Props) {
  if (__DEV__) console.log(`[analytics] ${event}`, props ?? {});
}

export function track(event: AnalyticsEvent, props?: Props): void {
  try {
    send(event, props);
  } catch {
    /* analytics must never break the app */
  }
}
