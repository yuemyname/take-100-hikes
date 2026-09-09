import mountainsJson from '@/data/mountains.json';
import { DEMO_FAVORITE_SLUGS, getDemoCompletedSlugs } from '@/data/demo';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Mountain } from '@/types';

/** Local seed row: the DB shape plus a UI-only `area` detail string. */
export interface SeedMountain extends Omit<Mountain, 'id' | 'created_at'> {
  area: string;
}

const seed = mountainsJson as SeedMountain[];

/** Local mountains get a stable id derived from the slug so routes work offline. */
export const LOCAL_MOUNTAINS: Mountain[] = seed.map((m) => ({
  ...m,
  id: `local:${m.slug}`,
  created_at: '1970-01-01T00:00:00.000Z',
}));

export function getSeedArea(slug: string): string | undefined {
  return seed.find((m) => m.slug === slug)?.area;
}

export type VerifiableMountain = Mountain & {
  latitude: number;
  longitude: number;
  verification_radius_m: number;
};

/** Pending BAC identities must never enter the legacy GPS certification flow. */
export function hasVerificationCoordinates(mountain: Mountain | null | undefined): mountain is VerifiableMountain {
  return Boolean(
    mountain &&
      Number.isFinite(mountain.latitude) &&
      Number.isFinite(mountain.longitude) &&
      Number.isFinite(mountain.verification_radius_m),
  );
}

function sortByDisplayOrder(list: Mountain[]): Mountain[] {
  return [...list].sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999));
}

export async function fetchMountains(useRemote = isSupabaseConfigured): Promise<Mountain[]> {
  if (!useRemote) return sortByDisplayOrder(LOCAL_MOUNTAINS);

  const { data, error } = await getSupabase()
    .from('mountains')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Mountain[];
}

export async function fetchMountain(id: string): Promise<Mountain | null> {
  if (!isSupabaseConfigured || id.startsWith('local:')) {
    return LOCAL_MOUNTAINS.find((m) => m.id === id) ?? null;
  }
  const { data, error } = await getSupabase().from('mountains').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Mountain | null) ?? null;
}

/**
 * Mountain ids the user has completed — spec §10.1: derived from
 * certification_members.status = 'confirmed', counted once per mountain.
 */
export async function fetchCompletedMountainIds(userId: string | null): Promise<Set<string>> {
  if (!isSupabaseConfigured || !userId) {
    const slugs = getDemoCompletedSlugs();
    return new Set(LOCAL_MOUNTAINS.filter((m) => slugs.includes(m.slug)).map((m) => m.id));
  }
  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_sessions!inner(mountain_id)')
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  if (error) throw error;

  const ids = new Set<string>();
  for (const row of (data ?? []) as { certification_sessions: { mountain_id: string } | { mountain_id: string }[] }[]) {
    const session = Array.isArray(row.certification_sessions) ? row.certification_sessions[0] : row.certification_sessions;
    if (session?.mountain_id) ids.add(session.mountain_id);
  }
  return ids;
}

export async function fetchFavoriteMountainIds(userId: string | null): Promise<Set<string>> {
  if (!isSupabaseConfigured || !userId) {
    return new Set(LOCAL_MOUNTAINS.filter((m) => (DEMO_FAVORITE_SLUGS as readonly string[]).includes(m.slug)).map((m) => m.id));
  }
  const { data, error } = await getSupabase().from('favorites').select('mountain_id').eq('user_id', userId);
  if (error) throw error;
  return new Set(((data ?? []) as { mountain_id: string }[]).map((r) => r.mountain_id));
}

export async function setFavorite(userId: string, mountainId: string, favorite: boolean): Promise<void> {
  const supabase = getSupabase();
  if (favorite) {
    const { error } = await supabase.from('favorites').upsert({ user_id: userId, mountain_id: mountainId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('mountain_id', mountainId);
    if (error) throw error;
  }
}
