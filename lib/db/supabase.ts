/**
 * CragTrails Supabase Adapter
 *
 * SECURITY: Import only from Server Actions or Route Handlers. Never in Client Components.
 *
 * Environment:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only, full access)
 *   NEXT_PUBLIC_SUPABASE_URL    (public, for client-side reads if needed later)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Tick as CanonicalTick,
  Photo as CanonicalPhoto,
  ConditionReport as CanonicalConditionReport,
} from '@/lib/types/climbing';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Running in demo mode.');
    return null;
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const isSupabaseEnabled = () =>
  !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export interface UserProfileData {
  wishlist?: string[];
  goals?: Array<{ id: string; label: string; target: number; current: number }>;
  updatedAt?: string;
}

// ============================================================================
// TICKS
// ============================================================================

export async function getTicksForUser(userId: string): Promise<CanonicalTick[]> {
  const c = getClient();
  if (!c || !userId) return [];
  const { data, error } = await c
    .from('ticks')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });
  if (error) { console.error('[Supabase:getTicksForUser]', error); return []; }
  return (data ?? []) as CanonicalTick[];
}

export async function saveTick(
  tick: Partial<CanonicalTick> & { userId: string; id: string }
): Promise<void> {
  const c = getClient();
  if (!c) return;
  const now = new Date().toISOString();
  const { error } = await c.from('ticks').upsert({
    ...tick,
    createdAt: (tick as any).createdAt ?? now,
    updatedAt: now,
  });
  if (error) throw new Error(`[Supabase:saveTick] ${error.message}`);
}

export async function deleteTick(userId: string, id: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  const { error } = await c.from('ticks').delete().eq('userId', userId).eq('id', id);
  if (error) throw new Error(`[Supabase:deleteTick] ${error.message}`);
}

// ============================================================================
// USER PROFILES
// ============================================================================

export async function getUserData(userId: string): Promise<UserProfileData> {
  const c = getClient();
  if (!c || !userId) return { wishlist: [], goals: [] };
  const { data, error } = await c
    .from('user_profiles')
    .select('wishlist, goals')
    .eq('userId', userId)
    .maybeSingle();
  if (error) { console.error('[Supabase:getUserData]', error); return { wishlist: [], goals: [] }; }
  return data ?? { wishlist: [], goals: [] };
}

export async function saveUserData(userId: string, data: UserProfileData): Promise<void> {
  const c = getClient();
  if (!c || !userId) return;
  const { error } = await c.from('user_profiles').upsert({
    userId,
    wishlist: data.wishlist ?? [],
    goals: data.goals ?? [],
    updatedAt: new Date().toISOString(),
  });
  if (error) throw new Error(`[Supabase:saveUserData] ${error.message}`);
}

// ============================================================================
// CONDITION REPORTS
// ============================================================================

export async function getConditionReportsForRoute(routeId: string): Promise<CanonicalConditionReport[]> {
  const c = getClient();
  if (!c || !routeId) return [];
  const { data, error } = await c
    .from('condition_reports')
    .select('*')
    .eq('routeId', routeId)
    .order('createdAt', { ascending: false });
  if (error) { console.error('[Supabase:getConditionReportsForRoute]', error); return []; }
  return (data ?? []) as CanonicalConditionReport[];
}

export async function saveConditionReport(
  report: Partial<CanonicalConditionReport> & { routeId: string; id: string; userId: string }
): Promise<void> {
  const c = getClient();
  if (!c) return;
  const now = new Date().toISOString();
  const { error } = await c.from('condition_reports').upsert({
    ...report,
    reportedAt: report.reportedAt ?? now,
    createdAt: (report as any).createdAt ?? now,
    updatedAt: now,
  });
  if (error) throw new Error(`[Supabase:saveConditionReport] ${error.message}`);
}

export async function getRecentConditionReports(limit = 20): Promise<CanonicalConditionReport[]> {
  const c = getClient();
  if (!c) return [];
  const { data, error } = await c
    .from('condition_reports')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(limit);
  if (error) { console.error('[Supabase:getRecentConditionReports]', error); return []; }
  return (data ?? []) as CanonicalConditionReport[];
}

// ============================================================================
// PHOTOS (metadata only — binaries go to R2)
// ============================================================================

export async function getPhotosForUser(userId: string): Promise<CanonicalPhoto[]> {
  const c = getClient();
  if (!c || !userId) return [];
  const { data, error } = await c
    .from('photos')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });
  if (error) { console.error('[Supabase:getPhotosForUser]', error); return []; }
  return (data ?? []) as CanonicalPhoto[];
}

export async function savePhotoMetadata(
  photo: Partial<CanonicalPhoto> & { userId: string; id: string }
): Promise<void> {
  const c = getClient();
  if (!c) return;
  const now = new Date().toISOString();
  const { error } = await c.from('photos').upsert({
    ...photo,
    createdAt: (photo as any).createdAt ?? now,
    updatedAt: now,
  });
  if (error) throw new Error(`[Supabase:savePhotoMetadata] ${error.message}`);
}

export async function deletePhoto(userId: string, id: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  const { error } = await c.from('photos').delete().eq('userId', userId).eq('id', id);
  if (error) throw new Error(`[Supabase:deletePhoto] ${error.message}`);
}

// ============================================================================
// COMPAT SHIM — same shape as lib/db/dynamodb.ts default export
// ============================================================================

export const db = {
  isEnabled: isSupabaseEnabled,
  getTicksForUser,
  saveTick,
  getUserData,
  saveUserData,
};

export default db;
