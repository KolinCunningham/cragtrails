'use server';

import { currentUser } from '@clerk/nextjs/server';
import { db as supabaseDb } from '@/lib/db/supabase';
import type { Tick } from '@/lib/types/climbing';

export async function loadPersonalData() {
  const user = await currentUser();
  const enabled = supabaseDb.isEnabled();

  if (!user || !enabled) {
    return { source: 'local' as const };
  }

  try {
    const [rawTicks, userData] = await Promise.all([
      supabaseDb.getTicksForUser(user.id),
      supabaseDb.getUserData(user.id),
    ]);

    return {
      source: 'supabase' as const,
      ticks: rawTicks as Tick[],
      wishlist: userData?.wishlist ?? [],
      goals: userData?.goals ?? [],
    };
  } catch (err) {
    console.error('[Persistence] loadPersonalData failed (falling back to local):', err);
    return { source: 'local' as const };
  }
}

export async function persistTick(tick: any) {
  const user = await currentUser();
  if (!user || !supabaseDb.isEnabled()) return;

  try {
    await supabaseDb.saveTick({ ...tick, userId: user.id });
  } catch (err) {
    console.error('[Persistence] persistTick failed (non-fatal):', err);
  }
}

export async function persistUserProfile(data: { wishlist?: string[]; goals?: any[] }) {
  const user = await currentUser();
  if (!user || !supabaseDb.isEnabled()) return;

  try {
    await supabaseDb.saveUserData(user.id, {
      wishlist: data.wishlist ?? [],
      goals: data.goals ?? [],
    });
  } catch (err) {
    console.error('[Persistence] persistUserProfile failed (non-fatal):', err);
  }
}
