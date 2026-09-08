/**
 * Row types mirroring supabase/migrations — 100PEAKS_MASTER_SPEC.md §9.
 * Keep these in sync with the SQL; they are the app-side contract.
 */
export type CertificationSessionStatus = 'active' | 'completed' | 'cancelled';
export type CertificationMemberStatus = 'invited' | 'confirmed' | 'declined' | 'expired';
export type CollectionId = 'forest_service_100' | 'bac_100';
export type CoordinateStatus = 'pending' | 'verified' | 'retired';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  primary_collection_id?: CollectionId | null;
  created_at: string;
}

export interface Mountain {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  altitude_m: number | null;
  region: string | null;
  latitude: number;
  longitude: number;
  verification_radius_m: number;
  image_url: string | null;
  mascot_key: string | null;
  description: string | null;
  display_order: number | null;
  created_at: string;
}

export interface Collection {
  id: CollectionId;
  name_ko: string;
  short_name_ko: string;
  description: string | null;
  source_url: string | null;
  target_count: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VerificationPoint {
  id: string;
  mountain_id: string;
  name_ko: string;
  latitude: number | null;
  longitude: number | null;
  verification_radius_m: number;
  coordinate_status: CoordinateStatus;
  source_note: string | null;
  created_at: string;
}

export interface CollectionMountain {
  collection_id: CollectionId;
  mountain_id: string;
  verification_point_id: string | null;
  display_order: number;
  source_label: string | null;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface CertificationSession {
  id: string;
  mountain_id: string;
  creator_user_id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  gps_accuracy_m: number | null;
  verification_radius_m: number;
  captured_at: string;
  status: CertificationSessionStatus;
  created_at: string;
}

export interface CertificationMember {
  certification_id: string;
  user_id: string;
  invited_by: string | null;
  status: CertificationMemberStatus;
  acceptance_latitude: number | null;
  acceptance_longitude: number | null;
  acceptance_accuracy_m: number | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  mountain_id: string;
  created_at: string;
}

/** Follow relation from the current user's point of view — spec §7.1. */
export type RelationshipState = 'none' | 'following' | 'follower' | 'mutual';

/** Every supported collection currently targets 100 entries. */
export const TOTAL_MOUNTAINS = 100;
