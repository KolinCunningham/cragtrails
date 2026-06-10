#!/usr/bin/env node
/**
 * Mountain Project Routes Bulk Import Script
 *
 * Reads the converted JSON files produced by convert_to_cragtrails.py and imports
 * routes + areas into the CragTrails Supabase database.
 *
 * Supports three import modes:
 *   --mode=top50       Import top 50 routes by page_views (uses lib/data/mp-seed-data.ts)
 *   --mode=top500      Import top 500 routes from top_routes.json
 *   --mode=full        Import all 130k routes from routes_cragtrails.json (batched)
 *
 * Usage:
 *   npx tsx scripts/import-mp-routes.ts --mode=top50 --dry-run
 *   npx tsx scripts/import-mp-routes.ts --mode=top500 --json-path=<path>
 *   npx tsx scripts/import-mp-routes.ts --mode=full   --json-path=<path> --batch=500
 *
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (or .env.local)
 *
 * The import is idempotent: uses upsert on (id) so re-running is safe.
 * Progress is logged every batch. Stats printed on completion.
 *
 * Note: The Supabase schema (lib/db/schema.sql) covers ticks/photos/condition_reports.
 * Routes and Areas require the extended schema below — run it first in Supabase SQL Editor.
 *
 * EXTENDED SCHEMA (add to Supabase SQL Editor):
 * -----------------------------------------------
 * create table if not exists routes (
 *   id            text primary key,
 *   name          text not null,
 *   "areaId"      text,
 *   styles        text[]  not null default '{}',
 *   grades        jsonb   not null default '{}',
 *   "lengthMeters" float,
 *   pitches       int,
 *   protection    text,
 *   fa            text,
 *   description   text,
 *   quality       float   not null default 3.5,
 *   hazards       text[]  default '{}',
 *   "bestSeason"  text[]  default '{}',
 *   history       text,
 *   metadata      jsonb   not null default '{}',
 *   "createdAt"   timestamptz not null default now(),
 *   "updatedAt"   timestamptz not null default now()
 * );
 *
 * create table if not exists areas (
 *   id               text primary key,
 *   name             text not null,
 *   "parentId"       text,
 *   "ancestorIds"    text[] not null default '{}',
 *   country          text,
 *   "stateOrRegion"  text,
 *   lat              float not null default 0,
 *   lng              float not null default 0,
 *   description      text,
 *   "accessInfo"     text,
 *   "bestSeason"     text[] default '{}',
 *   "rockType"       text,
 *   metadata         jsonb not null default '{}',
 *   "createdAt"      timestamptz not null default now(),
 *   "updatedAt"      timestamptz not null default now()
 * );
 *
 * create index if not exists idx_routes_area on routes ("areaId");
 * create index if not exists idx_areas_parent on areas ("parentId");
 * -----------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE_DEFAULT = 200;
const PROGRESS_INTERVAL  = 500; // log every N records

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(flag: string, defaultVal = ''): string {
  return args.find(a => a.startsWith(`${flag}=`))?.split('=').slice(1).join('=') ?? defaultVal;
}

const MODE       = getArg('--mode', 'top50');   // 'top50' | 'top500' | 'full'
const DRY_RUN    = args.includes('--dry-run') || args.includes('--dry');
const JSON_PATH  = getArg('--json-path', '');   // override path to converted JSON
const BATCH_SIZE = parseInt(getArg('--batch', String(BATCH_SIZE_DEFAULT)), 10);
const AREAS_ONLY = args.includes('--areas-only');
const ROUTES_ONLY= args.includes('--routes-only');

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

function getClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[import-mp] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.');
    console.warn('[import-mp] Running in DRY_RUN mode (no DB writes).');
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

async function upsertBatch(
  client: SupabaseClient | null,
  table: string,
  records: object[],
  dryRun: boolean
): Promise<{ inserted: number; errors: number }> {
  if (dryRun || !client) {
    return { inserted: records.length, errors: 0 };
  }
  const now = new Date().toISOString();
  const withTimestamps = records.map((r: any) => ({
    ...r,
    updatedAt: now,
    createdAt: (r as any).createdAt ?? now,
  }));
  const { error, count } = await client.from(table).upsert(withTimestamps, {
    onConflict: 'id',
    count: 'exact',
  });
  if (error) {
    console.error(`  [ERROR] ${table} batch upsert: ${error.message}`);
    return { inserted: 0, errors: records.length };
  }
  return { inserted: count ?? records.length, errors: 0 };
}

// ---------------------------------------------------------------------------
// Area import
// ---------------------------------------------------------------------------

async function importAreas(client: SupabaseClient | null, areas: object[], dryRun: boolean) {
  if (ROUTES_ONLY) {
    console.log('[import-mp] --routes-only: skipping areas.');
    return { inserted: 0, errors: 0 };
  }
  console.log(`\n[import-mp] Importing ${formatNum(areas.length)} areas (batch=${BATCH_SIZE})...`);
  const batches = chunkArray(areas, BATCH_SIZE);
  let totalInserted = 0;
  let totalErrors   = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const { inserted, errors } = await upsertBatch(client, 'areas', batch, dryRun);
    totalInserted += inserted;
    totalErrors   += errors;

    const processed = Math.min((i + 1) * BATCH_SIZE, areas.length);
    if (processed % PROGRESS_INTERVAL < BATCH_SIZE || i === batches.length - 1) {
      const pct = ((processed / areas.length) * 100).toFixed(1);
      console.log(`  areas: ${formatNum(processed)} / ${formatNum(areas.length)} (${pct}%) — ${errors > 0 ? `${errors} errors` : 'ok'}`);
    }
  }

  return { inserted: totalInserted, errors: totalErrors };
}

// ---------------------------------------------------------------------------
// Route import
// ---------------------------------------------------------------------------

async function importRoutes(client: SupabaseClient | null, routes: object[], dryRun: boolean) {
  if (AREAS_ONLY) {
    console.log('[import-mp] --areas-only: skipping routes.');
    return { inserted: 0, errors: 0 };
  }
  console.log(`\n[import-mp] Importing ${formatNum(routes.length)} routes (batch=${BATCH_SIZE})...`);
  const batches = chunkArray(routes, BATCH_SIZE);
  let totalInserted = 0;
  let totalErrors   = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    // Strip internal underscore fields not in schema
    const cleanBatch = batch.map((r: any) => {
      const { _pageViews, _lat, _lng, ...rest } = r;
      return rest;
    });
    const { inserted, errors } = await upsertBatch(client, 'routes', cleanBatch, dryRun);
    totalInserted += inserted;
    totalErrors   += errors;

    const processed = Math.min((i + 1) * BATCH_SIZE, routes.length);
    if (processed % PROGRESS_INTERVAL < BATCH_SIZE || i === batches.length - 1) {
      const pct = ((processed / routes.length) * 100).toFixed(1);
      console.log(`  routes: ${formatNum(processed)} / ${formatNum(routes.length)} (${pct}%) — ${errors > 0 ? `${errors} errors` : 'ok'}`);
    }
  }

  return { inserted: totalInserted, errors: totalErrors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== CragTrails Mountain Project Import ===');
  console.log(`Mode:     ${MODE}`);
  console.log(`Dry run:  ${DRY_RUN}`);
  console.log(`Batch:    ${BATCH_SIZE}`);
  console.log('');

  // Help text
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  npx tsx scripts/import-mp-routes.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --mode=top50|top500|full    Import scope (default: top50)');
    console.log('  --json-path=<path>          Explicit path to converted JSON directory');
    console.log('  --batch=<n>                 Upsert batch size (default: 200)');
    console.log('  --dry-run                   Parse + log only, no DB writes');
    console.log('  --areas-only                Skip route import, areas only');
    console.log('  --routes-only               Skip area import, routes only');
    process.exit(0);
  }

  const client = getClient();
  if (DRY_RUN) {
    console.log('[import-mp] DRY RUN — no data will be written to the database.\n');
  }

  // Resolve paths for JSON input files
  // Default: look for files in the directory passed via --json-path,
  // or sibling to this script (for local dev), or Desktop Share folder.
  const candidates = [
    JSON_PATH,
    path.join(__dirname, '..', '..', 'mountain-project-scrape'),
    '/Users/caesar/Desktop/Share/mountain-project-scrape',
    path.join(process.env.HOME || '', 'Desktop', 'Share', 'mountain-project-scrape'),
  ].filter(Boolean);

  let dataDir: string | null = null;
  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, 'top_routes.json'))) {
      dataDir = dir;
      break;
    }
  }

  if (!dataDir) {
    console.error('[import-mp] Could not find converted JSON files.');
    console.error('  Expected: top_routes.json, routes_cragtrails.json, areas_cragtrails.json');
    console.error('  Run: python3 convert_to_cragtrails.py  (in mountain-project-scrape dir)');
    console.error('  Then pass: --json-path=<directory>');
    process.exit(1);
  }

  console.log(`[import-mp] Data directory: ${dataDir}\n`);

  const startTime = Date.now();
  let areasLoaded: object[] = [];
  let routesLoaded: object[] = [];

  // Load based on mode
  if (MODE === 'top50') {
    // top50 is embedded in lib/data/mp-seed-data.ts — for DB import, read top_routes.json slice
    console.log('[import-mp] Mode: top50 — loading first 50 from top_routes.json');
    const topPath = path.join(dataDir, 'top_routes.json');
    const topData = JSON.parse(fs.readFileSync(topPath, 'utf-8')) as object[];
    routesLoaded = topData.slice(0, 50);

    // Load only the areas needed for these 50 routes
    const areasPath = path.join(dataDir, 'areas_cragtrails.json');
    const allAreas  = JSON.parse(fs.readFileSync(areasPath, 'utf-8')) as any[];
    const neededIds = new Set<string>();
    const areaMap   = new Map(allAreas.map((a: any) => [a.id, a]));
    for (const r of routesLoaded as any[]) {
      const a = areaMap.get(r.areaId);
      if (a) {
        neededIds.add(a.id);
        for (const ancId of (a.ancestorIds || [])) neededIds.add(ancId);
      }
    }
    areasLoaded = allAreas.filter((a: any) => neededIds.has(a.id));
    console.log(`  Loaded ${routesLoaded.length} routes, ${areasLoaded.length} areas`);

  } else if (MODE === 'top500') {
    console.log('[import-mp] Mode: top500 — loading top_routes.json');
    const topPath   = path.join(dataDir, 'top_routes.json');
    const areasPath = path.join(dataDir, 'areas_cragtrails.json');
    routesLoaded = JSON.parse(fs.readFileSync(topPath, 'utf-8'));
    const allAreas  = JSON.parse(fs.readFileSync(areasPath, 'utf-8')) as any[];
    const neededIds = new Set<string>();
    const areaMap   = new Map(allAreas.map((a: any) => [a.id, a]));
    for (const r of routesLoaded as any[]) {
      const a = areaMap.get((r as any).areaId);
      if (a) {
        neededIds.add(a.id);
        for (const ancId of (a.ancestorIds || [])) neededIds.add(ancId);
      }
    }
    areasLoaded = allAreas.filter((a: any) => neededIds.has(a.id));
    console.log(`  Loaded ${routesLoaded.length} routes, ${areasLoaded.length} areas`);

  } else if (MODE === 'full') {
    console.log('[import-mp] Mode: full — loading all routes_cragtrails.json + areas_cragtrails.json');
    console.log('  WARNING: ~130k routes. This will take several minutes.');
    const routesPath = path.join(dataDir, 'routes_cragtrails.json');
    const areasPath  = path.join(dataDir, 'areas_cragtrails.json');
    routesLoaded = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
    areasLoaded  = JSON.parse(fs.readFileSync(areasPath, 'utf-8'));
    console.log(`  Loaded ${formatNum(routesLoaded.length)} routes, ${formatNum(areasLoaded.length)} areas`);

  } else {
    console.error(`[import-mp] Unknown mode: ${MODE}. Use --mode=top50|top500|full`);
    process.exit(1);
  }

  // Import
  const areaResult  = await importAreas(client, areasLoaded, DRY_RUN);
  const routeResult = await importRoutes(client, routesLoaded, DRY_RUN);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=== Import Complete ===');
  console.log(`Mode:          ${MODE}`);
  console.log(`Dry run:       ${DRY_RUN}`);
  console.log(`Areas:         ${formatNum(areaResult.inserted)} inserted, ${areaResult.errors} errors`);
  console.log(`Routes:        ${formatNum(routeResult.inserted)} inserted, ${routeResult.errors} errors`);
  console.log(`Elapsed:       ${elapsed}s`);

  if (DRY_RUN) {
    console.log('\n[import-mp] Dry run complete — no data was written.');
    console.log('  Remove --dry-run and set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to write.');
  } else {
    console.log('\n[import-mp] Import complete. Verify in Supabase Dashboard.');
  }
}

main().catch(err => {
  console.error('[import-mp] Fatal error:', err);
  process.exit(1);
});
