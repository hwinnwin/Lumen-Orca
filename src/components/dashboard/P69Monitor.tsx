/**
 * P69 Protocol Monitor
 * Real-time visualization of progress toward 100% reliability
 *
 * Floor: 99.9999% (six-nines)
 * Ceiling: 100% (perfection)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Trophy,
} from 'lucide-react';

interface P69Status {
  currentReliability: number;
  fTotal: number;
  successRate: number;
  totalExecutions: number;
  failedExecutions: number;
  streak: number; // Consecutive successes
  bestStreak: number;
  lastFailure: string | null;
  trend: 'improving' | 'stable' | 'declining';
}

const P69_FLOOR = 0.999999;  // 99.9999%
const P69_CEILING = 1.0;     // 100%

// Calculate progress percentage between floor and ceiling
function calculateProgress(reliability: number): number {
  if (reliability >= P69_CEILING) return 100;
  if (reliability <= P69_FLOOR) return 0;
  return ((reliability - P69_FLOOR) / (P69_CEILING - P69_FLOOR)) * 100;
}

// Format reliability as percentage with appropriate precision
function formatReliability(reliability: number): string {
  if (reliability >= 0.9999999) return '99.99999%';
  if (reliability >= 0.999999) return `${(reliability * 100).toFixed(5)}%`;
  if (reliability >= 0.99999) return `${(reliability * 100).toFixed(4)}%`;
  return `${(reliability * 100).toFixed(3)}%`;
}

// Format F_total in scientific notation
function formatFTotal(fTotal: number): string {
  if (fTotal === 0) return '0';
  if (fTotal < 1e-9) return '< 10⁻⁹';
  const exponent = Math.floor(Math.log10(fTotal));
  const mantissa = fTotal / Math.pow(10, exponent);
  return `${mantissa.toFixed(1)} × 10${exponent < 0 ? '⁻' : ''}${Math.abs(exponent).toString().split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)]).join('')}`;
}

export function P69Monitor() {
  const [status, setStatus] = useState<P69Status>({
    currentReliability: 0.9999921,
    fTotal: 7.9e-7,
    successRate: 0.9999921,
    totalExecutions: 12847,
    failedExecutions: 1,
    streak: 8432,
    bestStreak: 8432,
    lastFailure: '2026-01-08T14:23:00Z',
    trend: 'improving',
  });

  const progress = calculateProgress(status.currentReliability);
  const gapToHundred = (P69_CEILING - status.currentReliability) * 100;
  const isCompliant = status.currentReliability >= P69_FLOOR;
  const isPerfect = status.currentReliability >= P69_CEILING;

  return (
    <div className="space-y-4">
      {/* Main P69 Card */}
      <Card className={`border-2 ${isPerfect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isCompliant ? 'border-blue-500' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className={`h-6 w-6 ${isPerfect ? 'text-green-500' : 'text-blue-500'}`} />
              <CardTitle>P69 Protocol Status</CardTitle>
            </div>
            <Badge variant={isPerfect ? 'default' : isCompliant ? 'secondary' : 'destructive'}>
              {isPerfect ? 'PERFECT' : isCompliant ? 'COMPLIANT' : 'VIOLATION'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Big reliability number */}
          <div className="text-center py-4">
            <div className={`text-5xl font-bold ${isPerfect ? 'text-green-500' : isCompliant ? 'text-blue-600' : 'text-red-500'}`}>
              {formatReliability(status.currentReliability)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Current Reliability
            </div>
          </div>

          {/* Progress to 100% */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Floor: 99.9999%</span>
              <span>Ceiling: 100%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-center text-sm text-muted-foreground">
              {isPerfect ? (
                <span className="text-green-500 font-medium flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4" /> 100% ACHIEVED
                </span>
              ) : (
                <span>{gapToHundred.toFixed(6)}% gap to perfection</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* F_total */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">F_total</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatFTotal(status.fTotal)}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: ≤ 10⁻⁶
            </div>
          </CardContent>
        </Card>

        {/* Total Executions */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Executions</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {status.totalExecutions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {status.failedExecutions} failed
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Streak</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {status.streak.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              consecutive successes
            </div>
          </CardContent>
        </Card>

        {/* Best Streak */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Best</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-600">
              {status.bestStreak.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              all-time record
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Compliance Status */}
            <div className="flex items-center gap-3">
              {isCompliant ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <div className="font-medium">
                  {isCompliant ? 'P69 Compliant' : 'P69 Violation'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isCompliant
                    ? 'System meets six-nines reliability standard'
                    : 'Reliability below 99.9999% threshold'}
                </div>
              </div>
            </div>

            {/* Last Failure */}
            {status.lastFailure && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5" />
                <div className="text-muted-foreground">
                  Last failure: {new Date(status.lastFailure).toLocaleString()}
                </div>
              </div>
            )}

            {/* Journey to 100% */}
            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-2">Journey to 100%</div>
              <div className="grid grid-cols-5 gap-1">
                {[99.9999, 99.99995, 99.99999, 99.999999, 100].map((milestone, i) => {
                  const achieved = status.currentReliability * 100 >= milestone;
                  return (
                    <div
                      key={milestone}
                      className={`text-center p-2 rounded text-xs ${
                        achieved
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}
                    >
                      <div className="font-mono">
                        {milestone === 100 ? '100%' : `${milestone}%`}
                      </div>
                      {achieved && <CheckCircle2 className="h-3 w-3 mx-auto mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Celebration Banner (when perfect) */}
      {isPerfect && (
        <Card className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white">
          <CardContent className="py-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2" />
            <div className="text-2xl font-bold">100% ACHIEVED</div>
            <div className="text-sm opacity-90">
              The impossible is now reality. Time to celebrate.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default P69Monitor;
