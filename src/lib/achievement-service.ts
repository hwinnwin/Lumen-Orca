/**
 * Achievement Service
 * Tracks and celebrates milestones on the journey from 99.9999% to 100%
 *
 * "Let's have the biggest party the world has ever seen on lunar new year
 *  every year we achieve the impossible" - HwinNwin
 */

import { supabase } from '@/integrations/supabase/client';

// P69 Protocol thresholds
const P69_FLOOR = 0.999999;  // 99.9999%
const P69_CEILING = 1.0;     // 100%

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  requirement: AchievementRequirement;
  celebrationLevel: CelebrationLevel;
  unlockedAt?: string;
  progress?: number;
}

export type AchievementCategory =
  | 'reliability'    // Reaching reliability milestones
  | 'streak'         // Consecutive successes
  | 'volume'         // Total executions
  | 'recovery'       // Bouncing back from failures
  | 'perfection'     // The ultimate goal
  | 'special';       // Time-based or event-based

export type AchievementTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'legendary';

export type CelebrationLevel =
  | 'subtle'      // Small notification
  | 'standard'    // Toast with confetti
  | 'epic'        // Full-screen celebration
  | 'legendary';  // "Biggest party the world has ever seen"

export interface AchievementRequirement {
  type: 'reliability' | 'streak' | 'executions' | 'zero_failures' | 'date' | 'custom';
  threshold?: number;
  condition?: string;
}

// Achievement definitions - The journey from 99.9999% to 100%
export const ACHIEVEMENTS: Achievement[] = [
  // Reliability Milestones (The P69 Journey)
  {
    id: 'reliability-floor',
    name: 'Six Nines Guardian',
    description: 'Achieved 99.9999% reliability - the P69 floor',
    category: 'reliability',
    tier: 'gold',
    icon: '🛡️',
    requirement: { type: 'reliability', threshold: 0.999999 },
    celebrationLevel: 'standard',
  },
  {
    id: 'reliability-99.99995',
    name: 'Pushing Limits',
    description: 'Reached 99.99995% reliability',
    category: 'reliability',
    tier: 'platinum',
    icon: '🚀',
    requirement: { type: 'reliability', threshold: 0.9999995 },
    celebrationLevel: 'standard',
  },
  {
    id: 'reliability-seven-nines',
    name: 'Seven Nines Sentinel',
    description: 'Achieved 99.99999% reliability - Seven nines!',
    category: 'reliability',
    tier: 'diamond',
    icon: '💎',
    requirement: { type: 'reliability', threshold: 0.9999999 },
    celebrationLevel: 'epic',
  },
  {
    id: 'reliability-99.999999',
    name: 'Edge of Perfection',
    description: 'Reached 99.999999% - One step from the impossible',
    category: 'reliability',
    tier: 'diamond',
    icon: '✨',
    requirement: { type: 'reliability', threshold: 0.99999999 },
    celebrationLevel: 'epic',
  },
  {
    id: 'reliability-perfect',
    name: 'THE IMPOSSIBLE',
    description: '100% RELIABILITY ACHIEVED - The ceiling is now the floor',
    category: 'perfection',
    tier: 'legendary',
    icon: '👑',
    requirement: { type: 'reliability', threshold: 1.0 },
    celebrationLevel: 'legendary',
  },

  // Streak Achievements
  {
    id: 'streak-100',
    name: 'Century Run',
    description: '100 consecutive successful executions',
    category: 'streak',
    tier: 'bronze',
    icon: '🔥',
    requirement: { type: 'streak', threshold: 100 },
    celebrationLevel: 'subtle',
  },
  {
    id: 'streak-1000',
    name: 'Thousand Strong',
    description: '1,000 consecutive successes',
    category: 'streak',
    tier: 'silver',
    icon: '⚡',
    requirement: { type: 'streak', threshold: 1000 },
    celebrationLevel: 'standard',
  },
  {
    id: 'streak-10000',
    name: 'Unstoppable Force',
    description: '10,000 consecutive successes',
    category: 'streak',
    tier: 'gold',
    icon: '🌟',
    requirement: { type: 'streak', threshold: 10000 },
    celebrationLevel: 'standard',
  },
  {
    id: 'streak-100000',
    name: 'Hundred Thousand Hero',
    description: '100,000 consecutive successes',
    category: 'streak',
    tier: 'platinum',
    icon: '💫',
    requirement: { type: 'streak', threshold: 100000 },
    celebrationLevel: 'epic',
  },
  {
    id: 'streak-million',
    name: 'Million Mile March',
    description: '1,000,000 consecutive successes',
    category: 'streak',
    tier: 'legendary',
    icon: '🏆',
    requirement: { type: 'streak', threshold: 1000000 },
    celebrationLevel: 'legendary',
  },

  // Volume Achievements
  {
    id: 'volume-10k',
    name: 'Getting Started',
    description: '10,000 total executions',
    category: 'volume',
    tier: 'bronze',
    icon: '📊',
    requirement: { type: 'executions', threshold: 10000 },
    celebrationLevel: 'subtle',
  },
  {
    id: 'volume-100k',
    name: 'Serious Business',
    description: '100,000 total executions',
    category: 'volume',
    tier: 'silver',
    icon: '📈',
    requirement: { type: 'executions', threshold: 100000 },
    celebrationLevel: 'standard',
  },
  {
    id: 'volume-1m',
    name: 'Million Operations',
    description: '1,000,000 total executions',
    category: 'volume',
    tier: 'gold',
    icon: '🎯',
    requirement: { type: 'executions', threshold: 1000000 },
    celebrationLevel: 'standard',
  },

  // Recovery Achievements
  {
    id: 'recovery-phoenix',
    name: 'Phoenix Rising',
    description: 'Recovered from a failure and achieved 1000 consecutive successes',
    category: 'recovery',
    tier: 'gold',
    icon: '🔄',
    requirement: { type: 'custom', condition: 'recovery_streak_1000' },
    celebrationLevel: 'standard',
  },

  // Special Achievements
  {
    id: 'special-lunar-new-year',
    name: 'Lunar New Year Legend',
    description: 'Achieved 100% during Lunar New Year celebrations',
    category: 'special',
    tier: 'legendary',
    icon: '🐉',
    requirement: { type: 'date', condition: 'lunar_new_year_100' },
    celebrationLevel: 'legendary',
  },
  {
    id: 'special-first-perfect-day',
    name: 'Perfect Day',
    description: 'Zero failures for an entire 24-hour period',
    category: 'special',
    tier: 'gold',
    icon: '☀️',
    requirement: { type: 'zero_failures', threshold: 86400 }, // seconds in a day
    celebrationLevel: 'epic',
  },
  {
    id: 'special-perfect-week',
    name: 'Perfect Week',
    description: 'Zero failures for 7 consecutive days',
    category: 'special',
    tier: 'platinum',
    icon: '📅',
    requirement: { type: 'zero_failures', threshold: 604800 }, // seconds in a week
    celebrationLevel: 'epic',
  },
  {
    id: 'special-perfect-month',
    name: 'Perfect Month',
    description: 'Zero failures for 30 consecutive days',
    category: 'special',
    tier: 'diamond',
    icon: '🌙',
    requirement: { type: 'zero_failures', threshold: 2592000 }, // seconds in 30 days
    celebrationLevel: 'legendary',
  },
];

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  progressPercentage: number;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedCount: number;
  recentUnlocks: Achievement[];
  nextMilestone?: Achievement;
  currentReliability: number;
  currentStreak: number;
  totalExecutions: number;
}

class AchievementService {
  private listeners: Set<(achievement: Achievement) => void> = new Set();

  /**
   * Check all achievements and unlock any newly earned ones
   */
  async checkAchievements(stats: {
    reliability: number;
    streak: number;
    totalExecutions: number;
    lastFailureTime?: Date;
  }): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];
    const existingUnlocks = await this.getUnlockedAchievements();
    const unlockedIds = new Set(existingUnlocks.map(a => a.id));

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      const earned = this.checkRequirement(achievement, stats);
      if (earned) {
        await this.unlockAchievement(achievement);
        newlyUnlocked.push(achievement);
        this.notifyListeners(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check if a specific achievement requirement is met
   */
  private checkRequirement(
    achievement: Achievement,
    stats: { reliability: number; streak: number; totalExecutions: number; lastFailureTime?: Date }
  ): boolean {
    const { requirement } = achievement;

    switch (requirement.type) {
      case 'reliability':
        return stats.reliability >= (requirement.threshold ?? 0);

      case 'streak':
        return stats.streak >= (requirement.threshold ?? 0);

      case 'executions':
        return stats.totalExecutions >= (requirement.threshold ?? 0);

      case 'zero_failures':
        if (!stats.lastFailureTime) return true; // No failures ever
        const secondsSinceFailure = (Date.now() - stats.lastFailureTime.getTime()) / 1000;
        return secondsSinceFailure >= (requirement.threshold ?? 0);

      case 'date':
        return this.checkDateCondition(requirement.condition ?? '', stats.reliability);

      case 'custom':
        return this.checkCustomCondition(requirement.condition ?? '', stats);

      default:
        return false;
    }
  }

  /**
   * Check date-based achievement conditions
   */
  private checkDateCondition(condition: string, reliability: number): boolean {
    const now = new Date();

    if (condition === 'lunar_new_year_100') {
      // Check if it's around Lunar New Year (late Jan - mid Feb) and we have 100%
      const month = now.getMonth();
      const day = now.getDate();
      const isLunarNewYearSeason =
        (month === 0 && day >= 20) || // Late January
        (month === 1 && day <= 20);   // Early February

      return isLunarNewYearSeason && reliability >= 1.0;
    }

    return false;
  }

  /**
   * Check custom achievement conditions
   */
  private checkCustomCondition(
    condition: string,
    stats: { reliability: number; streak: number; totalExecutions: number }
  ): boolean {
    if (condition === 'recovery_streak_1000') {
      // This would need historical data - simplified check
      return stats.streak >= 1000;
    }
    return false;
  }

  /**
   * Unlock an achievement and store it
   */
  private async unlockAchievement(achievement: Achievement): Promise<void> {
    const unlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };

    try {
      await supabase.from('audit_logs').insert({
        event_type: 'achievement_unlocked',
        event_status: 'success',
        event_details: unlockedAchievement,
      });
    } catch (error) {
      console.warn('[AchievementService] Failed to store achievement:', error);
    }

    // Store locally as well
    const stored = this.getStoredAchievements();
    stored.push(unlockedAchievement);
    localStorage.setItem('lumen-orca-achievements', JSON.stringify(stored));
  }

  /**
   * Get all unlocked achievements
   */
  async getUnlockedAchievements(): Promise<Achievement[]> {
    // Try database first
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('event_details')
        .eq('event_type', 'achievement_unlocked')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        return data.map(d => d.event_details as Achievement);
      }
    } catch (error) {
      console.warn('[AchievementService] DB fetch failed, using local storage');
    }

    // Fall back to local storage
    return this.getStoredAchievements();
  }

  /**
   * Get locally stored achievements
   */
  private getStoredAchievements(): Achievement[] {
    try {
      const stored = localStorage.getItem('lumen-orca-achievements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get progress for all achievements
   */
  async getAchievementProgress(stats: {
    reliability: number;
    streak: number;
    totalExecutions: number;
  }): Promise<AchievementProgress[]> {
    const unlocked = await this.getUnlockedAchievements();
    const unlockedMap = new Map(unlocked.map(a => [a.id, a]));

    return ACHIEVEMENTS.map(achievement => {
      const isUnlocked = unlockedMap.has(achievement.id);
      const unlockedData = unlockedMap.get(achievement.id);

      let currentProgress = 0;
      let progressPercentage = 0;

      if (!isUnlocked) {
        const threshold = achievement.requirement.threshold ?? 1;

        switch (achievement.requirement.type) {
          case 'reliability':
            // Calculate progress in the P69 range
            const reliabilityProgress = (stats.reliability - P69_FLOOR) / (threshold - P69_FLOOR);
            currentProgress = stats.reliability;
            progressPercentage = Math.min(100, Math.max(0, reliabilityProgress * 100));
            break;
          case 'streak':
            currentProgress = stats.streak;
            progressPercentage = Math.min(100, (stats.streak / threshold) * 100);
            break;
          case 'executions':
            currentProgress = stats.totalExecutions;
            progressPercentage = Math.min(100, (stats.totalExecutions / threshold) * 100);
            break;
          default:
            currentProgress = 0;
            progressPercentage = 0;
        }
      } else {
        currentProgress = achievement.requirement.threshold ?? 1;
        progressPercentage = 100;
      }

      return {
        achievement,
        unlocked: isUnlocked,
        unlockedAt: unlockedData?.unlockedAt,
        currentProgress,
        progressPercentage,
      };
    });
  }

  /**
   * Get achievement statistics
   */
  async getStats(currentStats: {
    reliability: number;
    streak: number;
    totalExecutions: number;
  }): Promise<AchievementStats> {
    const unlocked = await this.getUnlockedAchievements();
    const progress = await this.getAchievementProgress(currentStats);

    // Find next milestone (closest unfinished achievement)
    const nextMilestone = progress
      .filter(p => !p.unlocked)
      .sort((a, b) => b.progressPercentage - a.progressPercentage)[0]?.achievement;

    // Get recent unlocks (last 5)
    const recentUnlocks = unlocked
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 5);

    return {
      totalAchievements: ACHIEVEMENTS.length,
      unlockedCount: unlocked.length,
      recentUnlocks,
      nextMilestone,
      currentReliability: currentStats.reliability,
      currentStreak: currentStats.streak,
      totalExecutions: currentStats.totalExecutions,
    };
  }

  /**
   * Subscribe to achievement unlocks
   */
  onAchievementUnlocked(callback: (achievement: Achievement) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of a new achievement
   */
  private notifyListeners(achievement: Achievement): void {
    this.listeners.forEach(callback => callback(achievement));
  }

  /**
   * Get celebration config for an achievement
   */
  getCelebrationConfig(achievement: Achievement): {
    duration: number;
    confettiCount: number;
    soundEffect?: string;
    fullScreen: boolean;
  } {
    switch (achievement.celebrationLevel) {
      case 'legendary':
        return {
          duration: 10000,
          confettiCount: 500,
          soundEffect: 'legendary-fanfare',
          fullScreen: true,
        };
      case 'epic':
        return {
          duration: 5000,
          confettiCount: 200,
          soundEffect: 'epic-achievement',
          fullScreen: true,
        };
      case 'standard':
        return {
          duration: 3000,
          confettiCount: 50,
          soundEffect: 'achievement',
          fullScreen: false,
        };
      case 'subtle':
      default:
        return {
          duration: 2000,
          confettiCount: 0,
          fullScreen: false,
        };
    }
  }
}

// Singleton instance
export const achievementService = new AchievementService();
