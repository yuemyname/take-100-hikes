import type { Href } from 'expo-router';

const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const USER_ROUTE = new RegExp(`^/user/${UUID_PATTERN}$`, 'i');
const INVITATION_ROUTE = new RegExp(
  `^/certification/join\\?sessionId=${UUID_PATTERN}$`,
  'i',
);

/** Only allow notification destinations produced by trusted database triggers. */
export function notificationHref(value: unknown): Href | null {
  if (typeof value !== 'string') return null;
  if (USER_ROUTE.test(value) || INVITATION_ROUTE.test(value)) return value as Href;
  return null;
}
