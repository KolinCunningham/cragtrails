'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement } from '@/lib/types/achievements';

const TIER_CONFIG = {
  bronze: {
    color: '#cd7f32',
    bg: '#2a1a0a',
    border: '#cd7f32',
    label: 'Bronze',
    glow: '0 0 20px rgba(205,127,50,0.5)',
  },
  silver: {
    color: '#c0c0c0',
    bg: '#1a1a1a',
    border: '#c0c0c0',
    label: 'Silver',
    glow: '0 0 20px rgba(192,192,192,0.5)',
  },
  gold: {
    color: '#ffd700',
    bg: '#1a1500',
    border: '#ffd700',
    label: 'Gold',
    glow: '0 0 24px rgba(255,215,0,0.6)',
  },
  platinum: {
    color: '#e5e4e2',
    bg: '#1a1a1e',
    border: '#e5e4e2',
    label: 'Platinum',
    glow: '0 0 28px rgba(229,228,226,0.6)',
  },
  legendary: {
    color: '#ffd700',
    bg: '#0d0010',
    border: 'transparent',
    label: 'Legendary',
    glow: '0 0 40px rgba(168,85,247,0.7)',
    gradient: 'linear-gradient(135deg, #7c3aed, #ffd700)',
  },
} as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
}

function ParticleEffect({ tier }: { tier: Achievement['tier'] }) {
  const colors =
    tier === 'legendary'
      ? ['#7c3aed', '#ffd700', '#ec4899', '#f97316']
      : tier === 'platinum'
      ? ['#e5e4e2', '#c0c0c0', '#ffffff']
      : tier === 'gold'
      ? ['#ffd700', '#f59e0b', '#fbbf24']
      : tier === 'silver'
      ? ['#c0c0c0', '#d1d5db', '#e5e7eb']
      : ['#cd7f32', '#d97706', '#f59e0b'];

  const particles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: (i / 12) * 360,
    speed: 0.8 + Math.random() * 0.6,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${p.x}%`,
            top: '50%',
            backgroundColor: p.color,
          }}
          initial={{ scale: 0, opacity: 0, y: 0, x: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            y: [-10, -40 * p.speed],
            x: [(Math.random() - 0.5) * 60],
          }}
          transition={{
            duration: 1.4,
            delay: Math.random() * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(true);
  const cfg = TIER_CONFIG[achievement.tier];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const borderStyle =
    achievement.tier === 'legendary' && 'gradient' in cfg
      ? { borderImage: cfg.gradient + ' 1', borderWidth: '2px', borderStyle: 'solid' }
      : { border: `2px solid ${cfg.border}` };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 28,
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] w-[340px] max-w-[90vw]"
        >
          <div
            className="relative rounded-2xl px-5 py-4 overflow-hidden cursor-pointer select-none"
            style={{
              background: cfg.bg,
              boxShadow: cfg.glow,
              ...borderStyle,
            }}
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 400);
            }}
          >
            {/* Particle burst */}
            <ParticleEffect tier={achievement.tier} />

            {/* Shimmer overlay for legendary */}
            {achievement.tier === 'legendary' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 20%, rgba(255,215,0,0.08) 50%, transparent 80%)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 0.5 }}
              />
            )}

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              {/* Emoji */}
              <motion.div
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: [0, -10, 8, 0], scale: 1 }}
                transition={{ duration: 0.6, ease: 'backOut' }}
                className="text-4xl flex-shrink-0"
              >
                {achievement.emoji}
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                {/* Unlock label */}
                <div
                  className="text-[10px] font-bold tracking-[2px] uppercase mb-0.5"
                  style={{ color: cfg.color }}
                >
                  Achievement Unlocked!
                </div>

                {/* Achievement name */}
                <div className="text-white font-extrabold text-[16px] leading-tight truncate">
                  {achievement.name}
                </div>

                {/* Description */}
                <div className="text-gray-400 text-[12px] leading-snug mt-0.5 line-clamp-2">
                  {achievement.description}
                </div>

                {/* Tier badge + XP */}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        achievement.tier === 'legendary' && 'gradient' in cfg
                          ? cfg.gradient
                          : `${cfg.color}22`,
                      color: cfg.color,
                      border: `1px solid ${cfg.color}44`,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: cfg.color }}
                  >
                    +{achievement.xpReward} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar auto-dismiss indicator */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
              style={{ background: cfg.color }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Achievement Toast Manager — renders all pending unlocks
// ============================================================

interface AchievementQueueItem {
  id: string;
  achievement: Achievement;
}

let globalQueue: AchievementQueueItem[] = [];
let globalSetter: React.Dispatch<React.SetStateAction<AchievementQueueItem[]>> | null = null;

export function triggerAchievementToast(achievement: Achievement) {
  const item: AchievementQueueItem = {
    id: `${achievement.id}_${Date.now()}`,
    achievement,
  };
  if (globalSetter) {
    globalSetter((prev) => [...prev, item]);
  } else {
    globalQueue.push(item);
  }
}

export function AchievementToastManager() {
  const [queue, setQueue] = useState<AchievementQueueItem[]>(globalQueue);

  useEffect(() => {
    globalSetter = setQueue;
    if (globalQueue.length > 0) {
      setQueue(globalQueue);
      globalQueue = [];
    }
    return () => {
      globalSetter = null;
    };
  }, []);

  const dismissFirst = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Only show one at a time (queue drains sequentially)
  const current = queue[0];

  return current ? (
    <AchievementToast
      key={current.id}
      achievement={current.achievement}
      onDismiss={() => dismissFirst(current.id)}
    />
  ) : null;
}
