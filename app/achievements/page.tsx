'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flame, MapPin, Mountain, Trophy, Zap, Star, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ACHIEVEMENTS, XP_LEVELS, getXPProgress } from '@/lib/data/achievements';
import type { AchievementCategory, UserAchievement } from '@/lib/types/achievements';

// ─────────────────────────────────────────────────────────────
// Demo data — in production this would come from user session / DB
// ─────────────────────────────────────────────────────────────
const DEMO_XP = 1350;
const DEMO_ROUTES = 28;
const DEMO_CRAGS = 6;
const DEMO_STREAK = 4;

const DEMO_UNLOCKED: UserAchievement[] = [
  { achievementId: 'first_route',    unlockedAt: new Date('2026-05-01') },
  { achievementId: 'first_sport',    unlockedAt: new Date('2026-05-01') },
  { achievementId: 'first_boulder',  unlockedAt: new Date('2026-05-03') },
  { achievementId: 'volume_10',      unlockedAt: new Date('2026-05-10') },
  { achievementId: 'grade_v0',       unlockedAt: new Date('2026-05-01') },
  { achievementId: 'grade_v1',       unlockedAt: new Date('2026-05-04') },
  { achievementId: 'grade_v2',       unlockedAt: new Date('2026-05-11') },
  { achievementId: 'grade_59',       unlockedAt: new Date('2026-05-02') },
  { achievementId: 'grade_510',      unlockedAt: new Date('2026-05-08') },
  { achievementId: 'location_outdoor', unlockedAt: new Date('2026-05-15') },
  { achievementId: 'location_5_crags', unlockedAt: new Date('2026-05-20') },
  { achievementId: 'social_first_photo', unlockedAt: new Date('2026-05-03') },
  { achievementId: 'social_wishlist_10', unlockedAt: new Date('2026-05-18') },
  { achievementId: 'volume_25',      unlockedAt: new Date('2026-05-28') },
];

// ─────────────────────────────────────────────────────────────
// Category config
// ─────────────────────────────────────────────────────────────
const CATEGORY_META: Record<AchievementCategory | 'all', { label: string; Icon: React.ElementType; color: string }> = {
  all:      { label: 'All',      Icon: Sparkles,  color: 'text-white' },
  volume:   { label: 'Volume',   Icon: Trophy,    color: 'text-yellow-400' },
  grade:    { label: 'Grade',    Icon: Zap,       color: 'text-orange-400' },
  location: { label: 'Location', Icon: MapPin,    color: 'text-blue-400' },
  streak:   { label: 'Streak',   Icon: Flame,     color: 'text-red-400' },
  style:    { label: 'Style',    Icon: Mountain,  color: 'text-green-400' },
  social:   { label: 'Social',   Icon: Users,     color: 'text-purple-400' },
  fun:      { label: 'Fun',      Icon: Star,      color: 'text-pink-400' },
  elite:    { label: 'Elite',    Icon: Sparkles,  color: 'text-amber-300' },
};

const TIER_COLORS = {
  bronze:    { bg: 'bg-amber-900/40',   border: 'border-amber-700/60',   text: 'text-amber-400',   badge: 'Bronze' },
  silver:    { bg: 'bg-gray-800/40',    border: 'border-gray-500/60',    text: 'text-gray-300',    badge: 'Silver' },
  gold:      { bg: 'bg-yellow-900/40',  border: 'border-yellow-600/60',  text: 'text-yellow-400',  badge: 'Gold' },
  platinum:  { bg: 'bg-slate-800/40',   border: 'border-slate-400/60',   text: 'text-slate-200',   badge: 'Platinum' },
  legendary: { bg: 'bg-purple-950/40',  border: 'border-purple-500/60',  text: 'text-purple-300',  badge: 'Legendary' },
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────
// XP Level Badge
// ─────────────────────────────────────────────────────────────
function LevelBadge({ xp }: { xp: number }) {
  const { level, progressPercent, xpIntoLevel, xpNeeded } = getXPProgress(xp);
  const isMaxLevel = level.level === 30;

  return (
    <div className="bg-[#111] border border-[#333] rounded-3xl p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl">{level.emoji}</div>
        <div>
          <div className="text-xs text-gray-500 tracking-[2px] uppercase">Level {level.level}</div>
          <div className="text-2xl font-extrabold text-white">{level.name}</div>
          <div className="text-sm text-gray-400">{xp.toLocaleString()} total XP</div>
        </div>
      </div>

      {!isMaxLevel && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{xpIntoLevel.toLocaleString()} XP into level</span>
            <span>{xpNeeded.toLocaleString()} XP to next</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-3 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
      )}

      {isMaxLevel && (
        <div className="text-center text-amber-400 font-bold text-sm">
          Max Level Reached — Stone Wizard
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────────────────────────
function StatsBar({ routes, crags, streak, unlocked }: {
  routes: number; crags: number; streak: number; unlocked: number;
}) {
  const stats = [
    { label: 'Routes', value: routes, emoji: '🧗' },
    { label: 'Crags', value: crags, emoji: '📍' },
    { label: 'Streak', value: `${streak}d`, emoji: '🔥' },
    { label: 'Unlocked', value: unlocked, emoji: '🏅' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#111] border border-[#333] rounded-2xl p-3 text-center">
          <div className="text-xl">{s.emoji}</div>
          <div className="text-lg font-extrabold text-white">{s.value}</div>
          <div className="text-[11px] text-gray-500">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Achievement Card
// ─────────────────────────────────────────────────────────────
function AchievementCard({
  achievement,
  userAchievement,
  index,
}: {
  achievement: (typeof ACHIEVEMENTS)[0];
  userAchievement?: UserAchievement;
  index: number;
}) {
  const unlocked = !!userAchievement;
  const tier = TIER_COLORS[achievement.tier];
  const isLegendary = achievement.tier === 'legendary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`relative rounded-2xl border p-4 transition-all ${
        unlocked
          ? `${tier.bg} ${tier.border}`
          : 'bg-gray-900/30 border-gray-800/40 opacity-60'
      } ${isLegendary && unlocked ? 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''}`}
    >
      {/* Legendary shimmer */}
      {isLegendary && unlocked && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(168,85,247,0.06) 50%, transparent 70%)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="relative z-10">
        {/* Emoji */}
        <div className={`text-3xl mb-2 ${unlocked ? '' : 'grayscale blur-[1px]'}`}>
          {achievement.rarity === 'legendary' && !unlocked ? '❓' : achievement.emoji}
        </div>

        {/* Name */}
        <div className={`font-bold text-[14px] leading-snug mb-1 ${unlocked ? 'text-white' : 'text-gray-600'}`}>
          {achievement.rarity === 'legendary' && !unlocked ? '???' : achievement.name}
        </div>

        {/* Description */}
        {unlocked && (
          <div className="text-gray-400 text-[11px] leading-snug mb-2 line-clamp-2">
            {achievement.description}
          </div>
        )}

        {/* Tier badge + XP */}
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.text} ${tier.border} ${tier.bg}`}
          >
            {tier.badge}
          </span>
          <span className={`text-[11px] font-bold ${unlocked ? tier.text : 'text-gray-700'}`}>
            +{achievement.xpReward} XP
          </span>
        </div>

        {/* Unlocked date */}
        {unlocked && userAchievement && (
          <div className="text-[10px] text-gray-600 mt-1.5">
            Unlocked {daysSince(userAchievement.unlockedAt) === 0
              ? 'today'
              : `${daysSince(userAchievement.unlockedAt)}d ago`}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent Unlocks Row
// ─────────────────────────────────────────────────────────────
function RecentUnlocks({ unlocked }: { unlocked: UserAchievement[] }) {
  const recent = [...unlocked]
    .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
    .slice(0, 3)
    .map((ua) => ({
      ua,
      achievement: ACHIEVEMENTS.find((a) => a.id === ua.achievementId),
    }))
    .filter((x) => x.achievement != null) as Array<{ ua: UserAchievement; achievement: (typeof ACHIEVEMENTS)[0] }>;

  if (recent.length === 0) return null;

  return (
    <div>
      <div className="text-xs text-gray-500 tracking-[2px] uppercase mb-3">Recent Unlocks</div>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {recent.map(({ ua, achievement }) => {
          const tier = TIER_COLORS[achievement.tier];
          return (
            <motion.div
              key={ua.achievementId}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex-shrink-0 flex items-center gap-3 rounded-2xl border px-4 py-3 min-w-[220px] ${tier.bg} ${tier.border}`}
            >
              <div className="text-2xl">{achievement.emoji}</div>
              <div>
                <div className="text-white font-bold text-[13px]">{achievement.name}</div>
                <div className={`text-[11px] font-semibold ${tier.text}`}>
                  +{achievement.xpReward} XP
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  const unlockedMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();
    DEMO_UNLOCKED.forEach((ua) => map.set(ua.achievementId, ua));
    return map;
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const totalUnlocked = DEMO_UNLOCKED.length;
  const totalAchievements = ACHIEVEMENTS.length;

  const categories: Array<AchievementCategory | 'all'> = [
    'all', 'volume', 'grade', 'location', 'streak', 'style', 'social', 'fun', 'elite',
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl bg-[#1a1a1a] border border-[#333] active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Achievements</h1>
            <div className="text-xs text-gray-500">
              {totalUnlocked} / {totalAchievements} unlocked
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Level Badge */}
        <LevelBadge xp={DEMO_XP} />

        {/* Stats Bar */}
        <StatsBar
          routes={DEMO_ROUTES}
          crags={DEMO_CRAGS}
          streak={DEMO_STREAK}
          unlocked={totalUnlocked}
        />

        {/* Recent Unlocks */}
        <RecentUnlocks unlocked={DEMO_UNLOCKED} />

        {/* Overall progress */}
        <div className="bg-[#111] border border-[#333] rounded-2xl p-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span className="text-white font-bold">
              {Math.round((totalUnlocked / totalAchievements) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.Icon;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-[#1a1a1a] border border-[#333] text-gray-400 active:scale-95'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-black' : meta.color} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievement Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {filtered.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                userAchievement={unlockedMap.get(achievement.id)}
                index={index}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            No achievements in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
