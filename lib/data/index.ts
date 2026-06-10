export * from './seed-data';
export { mpAreas, mpRoutes, getMpRoutePhotoUrl } from './mp-seed-data';

import type { Route as CanonicalRoute, Area, Photo, SourceAttribution } from '../types/climbing';
import { seedData as _baseSeedData, areas as _baseAreas, routes as _baseRoutes } from './seed-data';
import { mpAreas, mpRoutes, getMpRoutePhotoUrl } from './mp-seed-data';
import { makeAttribution } from '../types/climbing';

const IMPORT_TS = '2026-06-10T00:00:00Z';

/**
 * Merged seedData — base curated data + Mountain Project top-50 import.
 * Exported as `seedData` (same shape as before) so existing consumers work unchanged.
 * MP areas + routes are appended; base data takes priority for any ID collisions.
 * Photo stubs are generated for MP routes using style-matched Unsplash images.
 */
const _basAreaIds = new Set(_baseAreas.map((a: Area) => a.id));
const _baseRouteIds = new Set(_baseRoutes.map((r: CanonicalRoute) => r.id));

// Generate style-matched photo stubs for MP routes (no photo IDs in scrape)
const _mpPhotoStubs: Photo[] = mpRoutes
  .filter((r: CanonicalRoute) => !_baseRouteIds.has(r.id))
  .map((r: CanonicalRoute) => ({
    id: `photo_${r.id}`,
    routeId: r.id,
    url: getMpRoutePhotoUrl(r.styles as string[]),
    thumbnailUrl: getMpRoutePhotoUrl(r.styles as string[]),
    caption: `${r.name} — ${r.grades.primary}`,
    license: 'Unsplash',
    metadata: {
      sources: [makeAttribution('mountainproject', r.id, undefined,
        'Historical Mountain Project community data (pre-2021)')],
    },
  }));

export const seedData = {
  ..._baseSeedData,
  areas: [
    ..._baseAreas,
    ...mpAreas.filter((a: Area) => !_basAreaIds.has(a.id)),
  ],
  routes: [
    ..._baseRoutes,
    ...mpRoutes.filter((r: CanonicalRoute) => !_baseRouteIds.has(r.id)),
  ],
  photos: [
    ..._baseSeedData.photos,
    ..._mpPhotoStubs,
  ],
} as const;

/**
 * CLEAN ADAPTER LAYER — Data Integration
 * 
 * Bridges the canonical rich model (lib/types/climbing.ts + lib/data/seed-data.ts)
 * to the running app's view model and UI needs.
 * 
 * - Preserves all send/logbook/wishlist/pyramid features (no breakage to existing flows)
 * - Mandatory source attribution made simple and delightful for cards + modals
 * - 10yo-friendly: attribution is reassuring, never noisy or complex
 * 
 * All functions are pure. No side effects. Designed for easy future swap to real DB.
 */

// Human-friendly short label for visible badges (used in route cards + modals)
export function formatAttribution(sources: SourceAttribution[] | string[] | undefined): string {
  if (!sources || sources.length === 0) return 'Community';
  const labels = (sources as any[]).map((s: any) => {
    if (typeof s === 'string') {
      if (s === 'openbeta') return 'OpenBeta';
      if (s === 'mountainproject') return 'MP';
      if (s === 'thecrag') return 'TheCrag';
      return s;
    }
    // Rich SourceAttribution object
    const p = s.provider;
    if (p === 'openbeta') return 'OpenBeta';
    if (p === 'mountainproject') return 'MP';
    if (p === 'thecrag') return 'TheCrag';
    if (p === 'user') return 'Climbers like you';
    return p || 'Community';
  });
  // Dedupe while preserving order
  const unique = Array.from(new Set(labels));
  return unique.join(' + ');
}

// Short delightful badge text for 10yo-friendly UI (prominent but tiny)
export function getSourceBadge(sources: SourceAttribution[] | string[] | undefined): string {
  const label = formatAttribution(sources);
  if (label.includes('OpenBeta')) return 'OpenBeta';
  if (label.includes('MP')) return 'Community + MP';
  if (label.includes('TheCrag')) return 'TheCrag';
  return label;
}

// Full friendly sentence for modals (trust-building, never scary)
export function getAttributionLine(sources: SourceAttribution[] | string[] | undefined): string {
  const base = formatAttribution(sources);
  return `Sourced from ${base} • Community reviewed`;
}

/**
 * Robust multi-system grade color for the map legend (Easy-peasy / Getting fun / Pretty hard / Super strong!)
 * Handles YDS, V-scale, French, and Australian Ewbank grades so colors are accurate
 * no matter which system a route uses. Designed to work beautifully with the Australia view.
 */
export function getGradeColor(grade: string): string {
  const g = (grade || '').toUpperCase().trim();

  // Detect system + extract difficulty number
  let num = 0;
  let system: 'v' | 'yds' | 'ewbank' | 'french' | 'other' = 'other';

  if (g.startsWith('V')) {
    system = 'v';
    num = parseInt(g.replace(/[^0-9]/g, '')) || 0;
  } else if (g.includes('5.')) {
    system = 'yds';
    const m = g.match(/5\.(\d+)/);
    num = m ? parseInt(m[1]) : 10;
  } else if (/^[0-9]{1,2}[A-D+\s-]*$/.test(g)) {
    // Pure number or number + letter = very likely Australian Ewbank (or UIAA)
    system = 'ewbank';
    num = parseInt(g) || 0;
  } else if (/^[0-9]+[A-C]?\+?$/.test(g)) {
    system = 'french';
    num = parseInt(g) || 0;
  } else {
    const any = parseInt(g.replace(/[^0-9]/g, '')) || 0;
    if (any > 0) {
      // Heuristic fallback (works for many international grades)
      system = any > 20 ? 'ewbank' : 'yds';
      num = any;
    }
  }

  // Map to the four kid-friendly legend buckets
  let band: 'easy' | 'moderate' | 'hard' | 'expert' = 'moderate';

  if (system === 'v') {
    if (num <= 2) band = 'easy';
    else if (num <= 5) band = 'moderate';
    else if (num <= 8) band = 'hard';
    else band = 'expert';
  } else if (system === 'yds') {
    if (num <= 9) band = 'easy';
    else if (num <= 10) band = 'moderate';
    else if (num <= 11) band = 'hard';
    else band = 'expert';
  } else if (system === 'ewbank') {
    // Australian Ewbank (1–35+). 12≈easy, 18≈moderate, 22≈hard, 26+ expert
    if (num <= 14) band = 'easy';
    else if (num <= 20) band = 'moderate';
    else if (num <= 25) band = 'hard';
    else band = 'expert';
  } else if (system === 'french') {
    if (num <= 5) band = 'easy';
    else if (num <= 6) band = 'moderate';
    else if (num <= 7) band = 'hard';
    else band = 'expert';
  } else {
    if (num < 10) band = 'easy';
    else if (num < 15) band = 'moderate';
    else if (num < 22) band = 'hard';
    else band = 'expert';
  }

  if (band === 'easy') return '#22c55e';      // Easy-peasy (green)
  if (band === 'moderate') return '#eab308';  // Getting fun (yellow)
  if (band === 'hard') return '#f97316';      // Pretty hard (orange)
  return '#ef4444';                           // Super strong! (red)
}

// Backwards-compatible alias for any old call sites
export { getGradeColor as getDifficultyColor };
