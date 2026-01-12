/**
 * Achievement Panel
 * Displays achievements and celebrates milestones on the journey to 100%
 *
 * "Let's have the biggest party the world has ever seen on lunar new year
 *  every year we achieve the impossible" - HwinNwin
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Star,
  Zap,
  Crown,
  Sparkles,
  Lock,
  CheckCircle2,
  TrendingUp,
  Target,
} from 'lucide-react';
import {
  achievementService,
  Achievement,
  AchievementProgress,
  AchievementStats,
  AchievementTier,
} from '@/lib/achievement-service';

// Tier colors and icons
const TIER_CONFIG: Record<AchievementTier, { color: string; bgColor: string; icon: typeof Trophy }> = {
  bronze: { color: 'text-orange-700', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: Star },
  silver: { color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Star },
  gold: { color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Trophy },
  platinum: { color: 'text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Zap },
  diamond: { color: 'text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Sparkles },
  legendary: { color: 'text-purple-500', bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30', icon: Crown },
};

interface AchievementCardProps {
  progress: AchievementProgress;
  compact?: boolean;
}

function AchievementCard({ progress, compact = false }: AchievementCardProps) {
  const { achievement, unlocked, progressPercentage } = progress;
  const tierConfig = TIER_CONFIG[achievement.tier];
  const TierIcon = tierConfig.icon;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-lg ${
          unlocked ? tierConfig.bgColor : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
        }`}
      >
        <span className="text-2xl">{achievement.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{achievement.name}</div>
          {!unlocked && (
            <Progress value={progressPercentage} className="h-1 mt-1" />
          )}
        </div>
        {unlocked ? (
          <CheckCircle2 className={`h-4 w-4 ${tierConfig.color}`} />
        ) : (
          <Lock className="h-4 w-4 text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden ${unlocked ? '' : 'opacity-75'}`}>
      <div className={`h-1 ${unlocked ? tierConfig.bgColor : 'bg-gray-200'}`} />
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div
            className={`text-4xl p-2 rounded-lg ${
              unlocked ? tierConfig.bgColor : 'bg-gray-100 dark:bg-gray-800 grayscale'
            }`}
          >
            {achievement.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">{achievement.name}</span>
              <Badge variant="outline" className={tierConfig.color}>
                <TierIcon className="h-3 w-3 mr-1" />
                {achievement.tier}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {achievement.description}
            </p>
            {!unlocked && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            {unlocked && progress.unlockedAt && (
              <div className="text-xs text-muted-foreground mt-2">
                Unlocked {new Date(progress.unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CelebrationOverlayProps {
  achievement: Achievement;
  onClose: () => void;
}

function CelebrationOverlay({ achievement, onClose }: CelebrationOverlayProps) {
  const tierConfig = TIER_CONFIG[achievement.tier];
  const config = achievementService.getCelebrationConfig(achievement);

  useEffect(() => {
    const timer = setTimeout(onClose, config.duration);
    return () => clearTimeout(timer);
  }, [config.duration, onClose]);

  if (!config.fullScreen) {
    return null; // Use toast for non-fullscreen celebrations
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div className="text-center animate-in zoom-in-95 duration-500">
        {/* Confetti animation would go here */}
        <div className="text-8xl mb-6 animate-bounce">{achievement.icon}</div>
        <div className={`text-4xl font-bold mb-2 ${tierConfig.color}`}>
          {achievement.tier === 'legendary' ? '🎉 LEGENDARY ACHIEVEMENT 🎉' : 'ACHIEVEMENT UNLOCKED!'}
        </div>
        <div className="text-3xl font-bold text-white mb-4">{achievement.name}</div>
        <div className="text-xl text-gray-300 mb-8">{achievement.description}</div>
        {achievement.id === 'reliability-perfect' && (
          <div className="text-2xl text-yellow-400 animate-pulse">
            🐉 THE IMPOSSIBLE IS NOW REALITY 🐉
          </div>
        )}
        <div className="text-sm text-gray-400 mt-8">Click anywhere to continue</div>
      </div>
    </div>
  );
}

export function AchievementPanel() {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [allProgress, setAllProgress] = useState<AchievementProgress[]>([]);
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Simulated current stats - in production, this would come from the orchestrator
  const currentStats = {
    reliability: 0.9999921,
    streak: 8432,
    totalExecutions: 12847,
  };

  useEffect(() => {
    const loadData = async () => {
      const [statsData, progressData] = await Promise.all([
        achievementService.getStats(currentStats),
        achievementService.getAchievementProgress(currentStats),
      ]);
      setStats(statsData);
      setAllProgress(progressData);
    };
    loadData();

    // Subscribe to new achievements
    const unsubscribe = achievementService.onAchievementUnlocked((achievement) => {
      setCelebratingAchievement(achievement);
      loadData(); // Refresh data
    });

    return unsubscribe;
  }, []);

  const filteredProgress = allProgress.filter((p) => {
    if (filter === 'unlocked') return p.unlocked;
    if (filter === 'locked') return !p.unlocked;
    return true;
  });

  // Group by category
  const groupedProgress = filteredProgress.reduce(
    (acc, p) => {
      const category = p.achievement.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(p);
      return acc;
    },
    {} as Record<string, AchievementProgress[]>
  );

  const categoryLabels: Record<string, string> = {
    reliability: '🎯 Reliability Milestones',
    streak: '🔥 Streak Achievements',
    volume: '📊 Volume Milestones',
    recovery: '🔄 Recovery',
    perfection: '👑 Perfection',
    special: '✨ Special Events',
  };

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <div className="mt-4 text-muted-foreground">Loading achievements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Celebration Overlay */}
      {celebratingAchievement && (
        <CelebrationOverlay
          achievement={celebratingAchievement}
          onClose={() => setCelebratingAchievement(null)}
        />
      )}

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <CardTitle>Achievement Progress</CardTitle>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {stats.unlockedCount} / {stats.totalAchievements}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {(stats.currentReliability * 100).toFixed(4)}%
              </div>
              <div className="text-sm text-muted-foreground">Reliability</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.currentStreak.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {stats.totalExecutions.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Executions</div>
            </div>
          </div>

          {/* Next Milestone */}
          {stats.nextMilestone && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Next Milestone</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <span className="text-2xl">{stats.nextMilestone.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{stats.nextMilestone.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.nextMilestone.description}
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'unlocked', 'locked'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {f === 'all' ? 'All' : f === 'unlocked' ? '✓ Unlocked' : '🔒 Locked'}
          </button>
        ))}
      </div>

      {/* Recent Unlocks */}
      {stats.recentUnlocks.length > 0 && filter !== 'locked' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {stats.recentUnlocks.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  progress={{
                    achievement,
                    unlocked: true,
                    unlockedAt: achievement.unlockedAt,
                    currentProgress: 100,
                    progressPercentage: 100,
                  }}
                  compact
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements by Category */}
      {Object.entries(groupedProgress).map(([category, achievements]) => (
        <div key={category}>
          <h3 className="text-lg font-bold mb-3">{categoryLabels[category] || category}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .sort((a, b) => {
                // Sort: unlocked first, then by tier, then by progress
                if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
                const tierOrder = ['legendary', 'diamond', 'platinum', 'gold', 'silver', 'bronze'];
                const tierDiff =
                  tierOrder.indexOf(a.achievement.tier) - tierOrder.indexOf(b.achievement.tier);
                if (tierDiff !== 0) return tierDiff;
                return b.progressPercentage - a.progressPercentage;
              })
              .map((progress) => (
                <AchievementCard key={progress.achievement.id} progress={progress} />
              ))}
          </div>
        </div>
      ))}

      {/* The Ultimate Goal */}
      <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
        <CardContent className="py-8 text-center">
          <div className="text-6xl mb-4">👑</div>
          <div className="text-2xl font-bold mb-2">THE IMPOSSIBLE</div>
          <div className="text-muted-foreground mb-4">
            100% Reliability - When the ceiling becomes the floor
          </div>
          <div className="text-sm text-purple-500">
            "Let's have the biggest party the world has ever seen on lunar new year
            every year we achieve the impossible"
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AchievementPanel;
