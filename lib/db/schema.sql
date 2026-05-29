-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists ticks (
  id            text        not null,
  "userId"      text        not null,
  "routeId"     text,
  "routeName"   text,
  "areaName"    text,
  grade         text,
  date          text,
  stars         numeric,
  notes         text,
  conditions    text,
  "photoDataUrl" text,
  "sendStyle"   text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now(),
  primary key ("userId", id)
);

create table if not exists user_profiles (
  "userId"     text        primary key,
  wishlist     text[]      not null default '{}',
  goals        jsonb       not null default '[]',
  "updatedAt"  timestamptz not null default now()
);

create table if not exists condition_reports (
  id            text        not null,
  "routeId"     text        not null,
  "userId"      text,
  user_name     text,
  date          text,
  text          text,
  emoji         text,
  "photoUrl"    text,
  "reportedAt"  timestamptz,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now(),
  primary key ("routeId", id)
);

create table if not exists photos (
  id           text        not null,
  "userId"     text        not null,
  url          text,
  "routeId"    text,
  caption      text,
  license      text,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now(),
  primary key ("userId", id)
);

-- Row Level Security (enable after confirming app works)
-- alter table ticks enable row level security;
-- alter table user_profiles enable row level security;
-- alter table condition_reports enable row level security;
-- alter table photos enable row level security;
