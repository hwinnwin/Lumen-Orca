/**
 * Meta-Learner Dashboard Panel
 * Displays system health, insights, and optimization recommendations
 * from the A11 Meta-Learner agent
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Activity,
  Zap,
  RefreshCw,
} from 'lucide-react';
import type {
  LearningInsight,
  AgentPerformanceSnapshot,
  MetaLearnerState,
} from '../../../packages/agents/src/types';

interface MetaLearnerPanelProps {
  onRunAnalysis?: () => void;
  onApplyRecommendation?: (recommendationId: string) => void;
}

// Mock data for demonstration - in production, this comes from A11
const mockInsights: LearningInsight[] = [
  {
    id: 'insight-1',
    insightType: 'anomaly',
    sourceAgent: 'A11_meta_learner',
    targetAgents: ['A3_codegen_a', 'A4_codegen_b'],
    title: 'Code Generation Success Rate Declining',
    description: 'Both code generation agents showing 12% decline in success rate over the past 24 hours.',
    evidence: { previousRate: 0.94, currentRate: 0.82, samples: 156 },
    confidence: 0.92,
    potentialImprovement: 15,
    priority: 85,
  },
  {
    id: 'insight-2',
    insightType: 'optimization',
    sourceAgent: 'A11_meta_learner',
    targetAgents: ['A6_qa_harness'],
    title: 'QA Harness Latency Opportunity',
    description: 'A6 averaging 8.2s per execution. Switching to gemini-2.5-flash could reduce to 3.1s.',
    evidence: { currentLatency: 8200, projectedLatency: 3100, costSavings: '23%' },
    confidence: 0.78,
    potentialImprovement: 62,
    priority: 70,
  },
  {
    id: 'insight-3',
    insightType: 'pattern',
    sourceAgent: 'A11_meta_learner',
    targetAgents: ['A5_adjudicator'],
    title: 'Adjudicator Consistently Choosing Path A',
    description: 'A5 has chosen A3 output over A4 in 94% of cases. Consider rebalancing or improving A4 prompts.',
    evidence: { chosenA3: 47, chosenA4: 3, merged: 2 },
    confidence: 0.95,
    potentialImprovement: 5,
    priority: 50,
  },
];

const mockPerformance: AgentPerformanceSnapshot[] = [
  { agentRole: 'A1_spec', successRate: 0.97, avgLatencyMs: 2100, avgQuality: 0.91, avgCost: 0.002, executionCount: 234, isRegressed: false, trendDirection: 'stable' },
  { agentRole: 'A2_architect', successRate: 0.94, avgLatencyMs: 3400, avgQuality: 0.88, avgCost: 0.004, executionCount: 189, isRegressed: false, trendDirection: 'improving' },
  { agentRole: 'A3_codegen_a', successRate: 0.82, avgLatencyMs: 5200, avgQuality: 0.79, avgCost: 0.008, executionCount: 312, isRegressed: true, trendDirection: 'declining' },
  { agentRole: 'A4_codegen_b', successRate: 0.78, avgLatencyMs: 4800, avgQuality: 0.75, avgCost: 0.007, executionCount: 298, isRegressed: true, trendDirection: 'declining' },
  { agentRole: 'A5_adjudicator', successRate: 0.96, avgLatencyMs: 1800, avgQuality: 0.93, avgCost: 0.003, executionCount: 156, isRegressed: false, trendDirection: 'stable' },
  { agentRole: 'A6_qa_harness', successRate: 0.91, avgLatencyMs: 8200, avgQuality: 0.86, avgCost: 0.012, executionCount: 145, isRegressed: false, trendDirection: 'stable' },
];

const mockState: MetaLearnerState = {
  lastAnalysisAt: new Date(Date.now() - 300000).toISOString(),
  lastOptimizationAt: new Date(Date.now() - 3600000).toISOString(),
  analysisCount: 47,
  priorityAgents: ['A3_codegen_a', 'A4_codegen_b'],
  activeExperiments: ['prompt-a3-v2', 'temp-adjustment-a4'],
  overallSystemHealth: 0.87,
  totalImprovementsMade: 12,
  totalCostSaved: 234.56,
};

export function MetaLearnerPanel({ onRunAnalysis, onApplyRecommendation }: MetaLearnerPanelProps) {
  const [insights, setInsights] = useState<LearningInsight[]>(mockInsights);
  const [performance, setPerformance] = useState<AgentPerformanceSnapshot[]>(mockPerformance);
  const [state, setState] = useState<MetaLearnerState>(mockState);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    // In production, this would call the meta-learner
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
    onRunAnalysis?.();
  };

  const getHealthColor = (health: number) => {
    if (health >= 0.9) return 'text-green-500';
    if (health >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getInsightIcon = (type: LearningInsight['insightType']) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'optimization':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'pattern':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-green-500" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (direction: 'improving' | 'stable' | 'declining') => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-bold">Meta-Learner (A11)</h2>
        </div>
        <Button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* System Health Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthColor(state.overallSystemHealth)}`}>
                {(state.overallSystemHealth * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Overall Health</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{state.analysisCount}</div>
              <div className="text-xs text-muted-foreground">Analyses Run</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{state.totalImprovementsMade}</div>
              <div className="text-xs text-muted-foreground">Improvements Made</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">${state.totalCostSaved.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Cost Saved</div>
            </div>
          </div>

          {state.priorityAgents.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Priority Agents:</span>
                {state.priorityAgents.map(agent => (
                  <Badge key={agent} variant="outline" className="text-yellow-600">
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {state.activeExperiments.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Active Experiments:</span>
              {state.activeExperiments.map(exp => (
                <Badge key={exp} variant="secondary" className="text-xs">
                  {exp}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Insights and Performance */}
      <Tabs defaultValue="insights">
        <TabsList>
          <TabsTrigger value="insights">
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="performance">
            Agent Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-2">
          {insights
            .sort((a, b) => b.priority - a.priority)
            .map(insight => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.insightType)}
                      <div>
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
                            {insight.insightType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Confidence: {(insight.confidence * 100).toFixed(0)}%
                          </span>
                          {insight.potentialImprovement > 0 && (
                            <span className="text-xs text-green-600">
                              +{insight.potentialImprovement.toFixed(0)}% potential
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {insight.targetAgents.map(agent => (
                            <Badge key={agent} variant="secondary" className="text-xs">
                              {agent}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={insight.priority >= 80 ? 'destructive' : insight.priority >= 50 ? 'default' : 'secondary'}
                      >
                        P{insight.priority}
                      </Badge>
                      {insight.insightType === 'recommendation' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApplyRecommendation?.(insight.id)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {performance.map(agent => (
                  <div
                    key={agent.agentRole}
                    className={`p-3 rounded-lg border ${
                      agent.isRegressed ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{agent.agentRole}</span>
                        {getTrendIcon(agent.trendDirection)}
                        {agent.isRegressed && (
                          <Badge variant="destructive" className="text-xs">
                            Regressed
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {agent.executionCount} executions
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={agent.successRate * 100}
                            className="h-2 flex-1"
                          />
                          <span className={`text-sm font-medium ${
                            agent.successRate >= 0.9 ? 'text-green-500' :
                            agent.successRate >= 0.8 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {(agent.successRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Latency</div>
                        <div className="text-sm font-medium">
                          {(agent.avgLatencyMs / 1000).toFixed(1)}s
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Quality Score</div>
                        <div className="text-sm font-medium">
                          {(agent.avgQuality * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Cost</div>
                        <div className="text-sm font-medium">
                          ${agent.avgCost.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Analysis Info */}
      <div className="text-xs text-muted-foreground text-right">
        Last analysis: {state.lastAnalysisAt ? new Date(state.lastAnalysisAt).toLocaleString() : 'Never'}
        {' | '}
        Last optimization: {state.lastOptimizationAt ? new Date(state.lastOptimizationAt).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}

export default MetaLearnerPanel;
