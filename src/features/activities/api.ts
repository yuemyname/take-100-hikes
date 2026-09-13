import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_SESSIONS } from '@/data/demo';
import { LOCAL_MOUNTAINS } from '@/features/mountains/api';
import type {
  ActivityCertificationOption,
  HikingActivity,
  HikingActivityVisibility,
  PaceLeaderboardRow,
  PaceLeaderboardScope,
} from '@/types';

import type { CreateManualActivityInput, ImportHealthKitActivityInput } from './types';

const demoActivities: HikingActivity[] = [];

const SAFE_ACTIVITY_COLUMNS = [
  'id',
  'user_id',
  'mountain_id',
  'certification_id',
  'source',
  'started_at',
  'ended_at',
  'moving_seconds',
  'distance_m',
  'elevation_gain_m',
  'note',
  'visibility',
  'ranking_opt_in',
  'ranking_eligible',
  'pace_seconds_per_km',
  'created_at',
  'updated_at',
].join(',');

function isDemo(userId: string): boolean {
  return !isSupabaseConfigured || userId.startsWith('demo:');
}

export async function fetchMyActivities(userId: string): Promise<HikingActivity[]> {
  if (isDemo(userId)) {
    return demoActivities
      .filter((activity) => activity.user_id === userId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at));
  }

  const { data, error } = await getSupabase()
    .from('hiking_activities')
    .select(SAFE_ACTIVITY_COLUMNS)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Omit<HikingActivity, 'source_workout_id_hash'>[]).map((activity) => ({
    ...activity,
    source_workout_id_hash: null,
  }));
}

export async function fetchMyHealthKitWorkoutHashes(userId: string): Promise<Set<string>> {
  if (isDemo(userId)) {
    return new Set(
      demoActivities
        .filter((activity) => activity.user_id === userId && activity.source_workout_id_hash)
        .map((activity) => activity.source_workout_id_hash as string),
    );
  }
  const { data, error } = await getSupabase().rpc('get_my_healthkit_workout_hashes');
  if (error) throw error;
  return new Set(
    ((data ?? []) as { source_workout_id_hash: string }[]).map((row) => row.source_workout_id_hash),
  );
}

export async function createManualActivity(
  userId: string,
  input: CreateManualActivityInput,
): Promise<HikingActivity> {
  const row = {
    user_id: userId,
    mountain_id: input.mountainId?.startsWith('local:') ? null : input.mountainId,
    certification_id: null,
    source: 'manual' as const,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    moving_seconds: input.movingSeconds,
    distance_m: input.distanceM,
    elevation_gain_m: input.elevationGainM,
    note: input.note,
    visibility: input.visibility,
    ranking_opt_in: false,
  };

  if (isDemo(userId)) {
    const activity: HikingActivity = {
      id: `demo:activity:${Date.now()}`,
      ...row,
      mountain_id: input.mountainId,
      source_workout_id_hash: null,
      ranking_eligible: false,
      pace_seconds_per_km: Math.round((input.movingSeconds * 100000) / input.distanceM) / 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoActivities.unshift(activity);
    return activity;
  }

  const { data, error } = await getSupabase().from('hiking_activities').insert(row).select('*').single();
  if (error) throw error;
  return data as HikingActivity;
}

export async function updateActivityVisibility(
  userId: string,
  activityId: string,
  visibility: HikingActivityVisibility,
): Promise<void> {
  if (isDemo(userId) || activityId.startsWith('demo:')) {
    const activity = demoActivities.find((candidate) => candidate.id === activityId && candidate.user_id === userId);
    if (activity) {
      activity.visibility = visibility;
      activity.updated_at = new Date().toISOString();
    }
    return;
  }

  const { error } = await getSupabase()
    .from('hiking_activities')
    .update({ visibility })
    .eq('id', activityId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function importHealthKitActivity(
  userId: string,
  input: ImportHealthKitActivityInput,
): Promise<HikingActivity> {
  if (isDemo(userId)) throw new Error('HealthKit은 TestFlight 앱에서 로그인한 뒤 사용할 수 있어요.');

  const { data, error } = await getSupabase().rpc('import_healthkit_activity', {
    p_source_workout_id_hash: input.sourceIdHash,
    p_started_at: input.startedAt,
    p_ended_at: input.endedAt,
    p_moving_seconds: input.movingSeconds,
    p_distance_m: input.distanceM,
    p_elevation_gain_m: input.elevationGainM,
    p_visibility: input.visibility,
  });
  if (error) throw error;
  return data as HikingActivity;
}

export async function fetchActivityCertificationOptions(
  userId: string,
): Promise<ActivityCertificationOption[]> {
  if (isDemo(userId)) {
    return DEMO_SESSIONS.flatMap((session) => {
      if (!session.members.some((member) => member.userId === userId && member.status === 'confirmed')) return [];
      const mountain = LOCAL_MOUNTAINS.find((candidate) => candidate.slug === session.mountainSlug);
      if (!mountain) return [];
      return [{
        certificationId: session.id,
        mountainId: mountain.id,
        mountainName: mountain.name_ko,
        capturedAt: session.capturedAt,
      }];
    }).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }

  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_id, certification_sessions!inner(mountain_id, captured_at, mountains!inner(id, name_ko))')
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  if (error) throw error;

  return ((data ?? []) as unknown as {
    certification_id: string;
    certification_sessions: {
      mountain_id: string;
      captured_at: string;
      mountains: { id: string; name_ko: string };
    };
  }[]).map((row) => ({
    certificationId: row.certification_id,
    mountainId: row.certification_sessions.mountain_id,
    mountainName: row.certification_sessions.mountains.name_ko,
    capturedAt: row.certification_sessions.captured_at,
  })).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function attachActivityToCertification(
  userId: string,
  activityId: string,
  certificationId: string,
): Promise<HikingActivity> {
  if (isDemo(userId)) throw new Error('HealthKit 인증 연결은 TestFlight 앱에서 사용할 수 있어요.');
  const { data, error } = await getSupabase().rpc('attach_healthkit_activity_to_certification', {
    p_activity_id: activityId,
    p_certification_id: certificationId,
  });
  if (error) throw error;
  return data as HikingActivity;
}

export async function setActivityRankingOptIn(
  userId: string,
  activityId: string,
  optIn: boolean,
): Promise<HikingActivity> {
  if (isDemo(userId)) throw new Error('페이스 랭킹은 로그인한 TestFlight 앱에서 사용할 수 있어요.');
  const { data, error } = await getSupabase().rpc('set_hiking_activity_ranking_opt_in', {
    p_activity_id: activityId,
    p_opt_in: optIn,
  });
  if (error) throw error;
  return data as HikingActivity;
}

export async function fetchPaceLeaderboard(
  userId: string,
  mountainId: string,
  scope: PaceLeaderboardScope,
): Promise<PaceLeaderboardRow[]> {
  if (isDemo(userId) || mountainId.startsWith('local:')) return [];
  const { data, error } = await getSupabase().rpc('get_mountain_pace_leaderboard', {
    p_mountain_id: mountainId,
    p_scope: scope,
  });
  if (error) throw error;
  return (data ?? []) as PaceLeaderboardRow[];
}
