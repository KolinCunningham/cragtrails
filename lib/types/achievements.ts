export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
export type AchievementCategory = 'volume' | 'grade' | 'location' | 'style' | 'streak' | 'social' | 'fun' | 'elite';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tier: AchievementTier;
  category: AchievementCategory;
  xpReward: number;
  triggerCondition: string; // human-readable
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress?: number; // 0-100 for progress-based achievements
  target?: number;
}

export interface XPLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  color: string; // tailwind color
  emoji: string;
}

export interface UserStats {
  totalXP: number;
  currentLevel: number;
  routesClimbed: number;
  uniqueCrags: number;
  streak: number;
  maxStreak: number;
  achievements: UserAchievement[];
}
