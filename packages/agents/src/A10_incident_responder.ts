/**
 * A10: Incident Responder Agent
 * Role: Failure analysis, incident management, and recovery
 * Inputs: Error logs, alerts, system state
 * Outputs: Incident analysis, root cause, remediation plan
 *
 * Combines pattern-based root cause analysis with LLM-powered
 * deep analysis for complex incidents. Generates postmortems
 * and prevention recommendations.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface Incident {
  id: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved' | 'closed';
  summary: string;
  timeline: TimelineEvent[];
  analysis: IncidentAnalysis;
  impact: Impact;
  remediation: Remediation;
  postmortem?: Postmortem;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  actor: 'system' | 'agent' | 'human';
}

export interface IncidentAnalysis {
  rootCause: string;
  triggerCondition: string;
  impactedComponents: string[];
  blastRadius: 'isolated' | 'service' | 'system' | 'customer-facing';
  contributingFactors: string[];
}

export interface Impact {
  affectedUsers: number;
  affectedRequests: number;
  downtime: number;
  dataLoss: boolean;
  reputationalRisk: 'low' | 'medium' | 'high';
}

export interface Remediation {
  immediate: Action[];
  shortTerm: Action[];
  longTerm: Action[];
}

export interface Action {
  task: string;
  owner: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
}

export interface Postmortem {
  lessonsLearned: string[];
  actionItems: Action[];
  preventionMeasures: string[];
  detectionImprovements: string[];
  blamelessSummary: string;
}

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

const SEVERITY_RULES = {
  P1: { criteria: ['complete outage', 'data breach', 'security incident', 'all users affected'], responseTime: '15 minutes', escalation: 'immediate' },
  P2: { criteria: ['major functionality broken', 'significant user impact', 'degraded performance'], responseTime: '1 hour', escalation: 'within 30 minutes' },
  P3: { criteria: ['minor functionality affected', 'workaround available', 'limited user impact'], responseTime: '4 hours', escalation: 'next business day' },
  P4: { criteria: ['cosmetic issues', 'feature requests', 'documentation'], responseTime: 'best effort', escalation: 'as needed' },
};

export class IncidentResponder {
  private activeIncidents: Map<string, Incident> = new Map();

  /**
   * Create and analyze a new incident using local pattern matching.
   */
  async createIncident(input: {
    error: ErrorLog;
    affectedComponents: string[];
    userReports?: number;
  }): Promise<Incident> {
    const severity = this.classifySeverity(input);
    const analysis = this.analyzeRootCause(input);
    const impact = this.assessImpact(input);
    const remediation = this.generateRemediation(analysis, severity);

    const incident: Incident = {
      id: `INC-${Date.now().toString(36).toUpperCase()}`,
      severity,
      status: 'detected',
      summary: this.generateSummary(input.error),
      timeline: [{ timestamp: new Date().toISOString(), event: 'Incident detected', actor: 'system' }],
      analysis,
      impact,
      remediation,
    };

    this.activeIncidents.set(incident.id, incident);
    return incident;
  }

  /**
   * Create and analyze an incident with LLM-powered deep root cause analysis.
   */
  async createIncidentWithLLM(input: {
    error: ErrorLog;
    affectedComponents: string[];
    userReports?: number;
    recentLogs?: ErrorLog[];
    systemState?: Record<string, unknown>;
  }): Promise<Incident> {
    // First create with local analysis
    const incident = await this.createIncident(input);

    // Then enhance with LLM deep analysis
    const systemPrompt = getAgentPrompt('A10_incident');

    const recentLogsSummary = (input.recentLogs || [])
      .slice(0, 10)
      .map((l) => `[${l.timestamp}] ${l.level}: ${l.message}`)
      .join('\n');

    const userPrompt = `Analyze this incident and provide deep root cause analysis.

=== PRIMARY ERROR ===
Level: ${input.error.level}
Message: ${input.error.message}
${input.error.stack ? `Stack:\n${input.error.stack.slice(0, 1000)}` : ''}
${input.error.context ? `Context: ${JSON.stringify(input.error.context).slice(0, 500)}` : ''}

=== AFFECTED COMPONENTS ===
${input.affectedComponents.join(', ')}

=== LOCAL ANALYSIS ===
Root Cause: ${incident.analysis.rootCause}
Trigger: ${incident.analysis.triggerCondition}
Blast Radius: ${incident.analysis.blastRadius}
Contributing Factors: ${incident.analysis.contributingFactors.join(', ')}

${recentLogsSummary ? `=== RECENT LOGS ===\n${recentLogsSummary}` : ''}
${input.systemState ? `=== SYSTEM STATE ===\n${JSON.stringify(input.systemState).slice(0, 1000)}` : ''}

User Reports: ${input.userReports || 0}
Severity: ${incident.severity}

Provide:
1. Deeper root cause analysis considering log patterns and system state
2. More specific remediation steps
3. Prevention measures

Return JSON:
{
  "rootCause": "detailed root cause",
  "triggerCondition": "specific trigger",
  "contributingFactors": ["factor 1", "factor 2"],
  "blastRadius": "isolated|service|system|customer-facing",
  "remediation": {
    "immediate": [{"task": "string", "owner": "string", "priority": "critical|high|medium|low"}],
    "shortTerm": [{"task": "string", "owner": "string", "priority": "critical|high|medium|low"}],
    "longTerm": [{"task": "string", "owner": "string", "priority": "critical|high|medium|low"}]
  },
  "preventionMeasures": ["measure 1", "measure 2"]
}`;

    try {
      const response = await callLLM({
        systemPrompt,
        userPrompt,
        agentRole: 'A10_incident',
        maxTokens: 4096,
        temperature: 0.2,
      });

      const parsed = parseJSONResponse<any>(response.result);

      // Enhance analysis with LLM insights
      if (parsed.rootCause) incident.analysis.rootCause = parsed.rootCause;
      if (parsed.triggerCondition) incident.analysis.triggerCondition = parsed.triggerCondition;
      if (parsed.contributingFactors?.length) {
        const existing = new Set(incident.analysis.contributingFactors);
        for (const f of parsed.contributingFactors) {
          if (!existing.has(f)) incident.analysis.contributingFactors.push(f);
        }
      }
      if (parsed.blastRadius) incident.analysis.blastRadius = parsed.blastRadius;

      // Merge remediation actions
      if (parsed.remediation) {
        const mapActions = (actions: any[]): Action[] =>
          (actions || []).map((a: any) => ({
            task: a.task || '',
            owner: a.owner || 'engineering',
            priority: a.priority || 'medium',
            status: 'pending' as const,
          }));

        const existingTasks = new Set([
          ...incident.remediation.immediate.map((a) => a.task),
          ...incident.remediation.shortTerm.map((a) => a.task),
          ...incident.remediation.longTerm.map((a) => a.task),
        ]);

        for (const action of mapActions(parsed.remediation.immediate)) {
          if (!existingTasks.has(action.task)) incident.remediation.immediate.push(action);
        }
        for (const action of mapActions(parsed.remediation.shortTerm)) {
          if (!existingTasks.has(action.task)) incident.remediation.shortTerm.push(action);
        }
        for (const action of mapActions(parsed.remediation.longTerm)) {
          if (!existingTasks.has(action.task)) incident.remediation.longTerm.push(action);
        }
      }

      incident.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'LLM deep analysis completed',
        actor: 'agent',
      });
    } catch (error) {
      console.warn('[IncidentResponder] LLM analysis failed, using local analysis:', error);
      incident.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'LLM analysis failed, using local analysis only',
        actor: 'system',
      });
    }

    return incident;
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): Partial<Incident> {
    const incident = (llmOutput.incident as any) || llmOutput;
    const analysis = (llmOutput.analysis as any) || incident.analysis || {};
    const recs = (llmOutput.recommendations as any[]) || [];
    const postmortem = (llmOutput.postmortem as any) || undefined;

    const mapActions = (actions: any[]): Action[] =>
      (actions || []).map((a: any) => ({
        task: a.task || a.action || '',
        owner: a.owner || 'engineering',
        priority: a.priority || 'medium',
        status: 'pending' as const,
        dueDate: a.dueDate,
      }));

    return {
      id: incident.id || `INC-${Date.now().toString(36).toUpperCase()}`,
      severity: incident.severity || 'P3',
      status: incident.status || 'detected',
      summary: incident.summary || '',
      timeline: (incident.timeline || []).map((t: any) => ({
        timestamp: t.timestamp || new Date().toISOString(),
        event: t.event || '',
        actor: t.actor || 'system',
      })),
      analysis: {
        rootCause: analysis.rootCause || 'Under investigation',
        triggerCondition: analysis.triggerCondition || 'Unknown',
        impactedComponents: analysis.impactedComponents || [],
        blastRadius: analysis.blastRadius || 'isolated',
        contributingFactors: analysis.contributingFactors || [],
      },
      impact: {
        affectedUsers: 0,
        affectedRequests: 0,
        downtime: 0,
        dataLoss: false,
        reputationalRisk: 'low',
      },
      remediation: {
        immediate: mapActions(recs.filter((r: any) => r.type === 'immediate')),
        shortTerm: mapActions(recs.filter((r: any) => r.type === 'short-term')),
        longTerm: mapActions(recs.filter((r: any) => r.type === 'long-term')),
      },
      postmortem: postmortem ? {
        lessonsLearned: postmortem.lessonsLearned || [],
        actionItems: mapActions(postmortem.actionItems || []),
        preventionMeasures: postmortem.preventionMeasures || [],
        detectionImprovements: postmortem.detectionImprovements || [],
        blamelessSummary: postmortem.blamelessSummary || '',
      } : undefined,
    };
  }

  private classifySeverity(input: { error: ErrorLog; userReports?: number }): 'P1' | 'P2' | 'P3' | 'P4' {
    const { error, userReports = 0 } = input;

    // Check error message against severity criteria
    const msg = error.message.toLowerCase();
    if (error.level === 'critical') return 'P1';
    if (SEVERITY_RULES.P1.criteria.some((c) => msg.includes(c))) return 'P1';
    if (userReports > 100) return 'P1';

    if (error.level === 'error' && userReports > 10) return 'P2';
    if (SEVERITY_RULES.P2.criteria.some((c) => msg.includes(c))) return 'P2';

    if (error.level === 'error') return 'P3';
    return 'P4';
  }

  private analyzeRootCause(input: { error: ErrorLog; affectedComponents: string[] }): IncidentAnalysis {
    const { error, affectedComponents } = input;
    let rootCause = 'Unknown - requires investigation';
    let triggerCondition = 'Under investigation';
    const contributingFactors: string[] = [];

    const msg = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();

    if (msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('network')) {
      rootCause = 'External service connectivity failure';
      triggerCondition = 'Network partition or service unavailability';
      contributingFactors.push('No circuit breaker implemented', 'Missing retry logic');
    } else if (msg.includes('outofmemory') || msg.includes('heap') || msg.includes('memory')) {
      rootCause = 'Memory exhaustion';
      triggerCondition = 'Memory leak or excessive allocation';
      contributingFactors.push('Insufficient memory limits', 'Possible memory leak');
    } else if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
      rootCause = 'Rate limiting triggered';
      triggerCondition = 'Excessive API calls exceeding provider limits';
      contributingFactors.push('Missing request throttling', 'No request queuing');
    } else if (msg.includes('permission') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('401')) {
      rootCause = 'Authorization/authentication failure';
      triggerCondition = 'Invalid, expired, or missing credentials';
      contributingFactors.push('Token expiration handling', 'Misconfigured permissions');
    } else if (msg.includes('not found') || msg.includes('404')) {
      rootCause = 'Resource not found';
      triggerCondition = 'Deleted or moved resource, incorrect URL';
      contributingFactors.push('Missing resource validation', 'Stale references');
    } else if (stack.includes('typeerror') || msg.includes('undefined') || msg.includes('null')) {
      rootCause = 'Runtime type error - unexpected null/undefined';
      triggerCondition = 'Missing input validation or incomplete error handling';
      contributingFactors.push('Insufficient type checking', 'Missing null guards');
    } else if (msg.includes('syntax') || msg.includes('parse') || msg.includes('json')) {
      rootCause = 'Data parsing failure';
      triggerCondition = 'Malformed input data or unexpected response format';
      contributingFactors.push('Missing input validation', 'No schema validation');
    } else if (msg.includes('disk') || msg.includes('storage') || msg.includes('quota')) {
      rootCause = 'Storage capacity exceeded';
      triggerCondition = 'Disk full or quota limit reached';
      contributingFactors.push('No storage monitoring', 'Missing cleanup routines');
    }

    return {
      rootCause,
      triggerCondition,
      impactedComponents: affectedComponents,
      blastRadius: affectedComponents.length > 3 ? 'system' : affectedComponents.length > 1 ? 'service' : 'isolated',
      contributingFactors,
    };
  }

  private assessImpact(input: { error: ErrorLog; userReports?: number }): Impact {
    const userReports = input.userReports || 0;
    return {
      affectedUsers: userReports * 10,
      affectedRequests: userReports * 100,
      downtime: 0,
      dataLoss: input.error.message.toLowerCase().includes('data loss') || input.error.message.toLowerCase().includes('corruption'),
      reputationalRisk: userReports > 50 ? 'high' : userReports > 10 ? 'medium' : 'low',
    };
  }

  private generateRemediation(analysis: IncidentAnalysis, severity: string): Remediation {
    const immediate: Action[] = [];
    const shortTerm: Action[] = [];
    const longTerm: Action[] = [];

    if (analysis.rootCause.includes('connectivity')) {
      immediate.push({ task: 'Check external service status and network connectivity', owner: 'oncall', priority: 'critical', status: 'pending' });
      shortTerm.push({ task: 'Implement circuit breaker pattern for external calls', owner: 'engineering', priority: 'high', status: 'pending' });
      longTerm.push({ task: 'Add redundant connectivity paths and failover', owner: 'platform', priority: 'medium', status: 'pending' });
    }

    if (analysis.rootCause.includes('Memory')) {
      immediate.push({ task: 'Restart affected services to clear memory', owner: 'oncall', priority: 'critical', status: 'pending' });
      shortTerm.push({ task: 'Profile memory usage and fix leaks', owner: 'engineering', priority: 'high', status: 'pending' });
      longTerm.push({ task: 'Implement memory usage alerts and auto-scaling', owner: 'platform', priority: 'medium', status: 'pending' });
    }

    if (analysis.rootCause.includes('Rate limiting')) {
      immediate.push({ task: 'Reduce request rate or switch to backup provider', owner: 'oncall', priority: 'critical', status: 'pending' });
      shortTerm.push({ task: 'Implement request queuing and rate limiting', owner: 'engineering', priority: 'high', status: 'pending' });
    }

    if (analysis.rootCause.includes('auth')) {
      immediate.push({ task: 'Verify and refresh credentials', owner: 'oncall', priority: 'critical', status: 'pending' });
      shortTerm.push({ task: 'Implement automatic token refresh', owner: 'engineering', priority: 'high', status: 'pending' });
    }

    immediate.push({ task: 'Communicate status to stakeholders', owner: 'oncall', priority: severity === 'P1' ? 'critical' : 'high', status: 'pending' });

    longTerm.push({ task: 'Add monitoring and alerting for this failure mode', owner: 'platform', priority: 'medium', status: 'pending' });
    longTerm.push({ task: 'Update runbook with this incident pattern', owner: 'documentation', priority: 'low', status: 'pending' });

    return { immediate, shortTerm, longTerm };
  }

  private generateSummary(error: ErrorLog): string {
    const type = error.level.toUpperCase();
    const shortMessage = error.message.slice(0, 120);
    return `[${type}] ${shortMessage}${error.message.length > 120 ? '...' : ''}`;
  }

  /**
   * Update incident status with timeline event.
   */
  updateStatus(incidentId: string, status: Incident['status'], event: string): Incident | null {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident) return null;

    incident.status = status;
    incident.timeline.push({ timestamp: new Date().toISOString(), event, actor: 'agent' });
    return incident;
  }

  /**
   * Generate postmortem for resolved incident (local analysis).
   */
  generatePostmortem(incidentId: string): Postmortem | null {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident || incident.status !== 'resolved') return null;

    const postmortem: Postmortem = {
      lessonsLearned: [
        `Root cause: ${incident.analysis.rootCause}`,
        `Trigger: ${incident.analysis.triggerCondition}`,
        ...incident.analysis.contributingFactors.map((f) => `Contributing factor: ${f}`),
      ],
      actionItems: [
        ...incident.remediation.longTerm,
        { task: 'Review and update incident response playbook', owner: 'platform', priority: 'medium', status: 'pending' },
      ],
      preventionMeasures: [
        'Add automated testing for this failure scenario',
        'Implement proactive monitoring for early detection',
        'Review similar systems for the same vulnerability',
      ],
      detectionImprovements: [
        'Reduce time-to-detect with targeted alerting',
        'Add synthetic monitoring for critical paths',
      ],
      blamelessSummary: `This incident was caused by ${incident.analysis.rootCause.toLowerCase()}. The focus is on improving systems and processes to prevent recurrence.`,
    };

    incident.postmortem = postmortem;
    return postmortem;
  }

  /**
   * Generate postmortem with LLM-powered deep analysis.
   */
  async generatePostmortemWithLLM(incidentId: string): Promise<Postmortem | null> {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident || incident.status !== 'resolved') return null;

    // Get base postmortem
    const postmortem = this.generatePostmortem(incidentId);
    if (!postmortem) return null;

    try {
      const response = await callLLM({
        systemPrompt: getAgentPrompt('A10_incident'),
        userPrompt: `Generate a detailed blameless postmortem for this incident.

Incident: ${incident.summary}
Severity: ${incident.severity}
Root Cause: ${incident.analysis.rootCause}
Trigger: ${incident.analysis.triggerCondition}
Affected Components: ${incident.analysis.impactedComponents.join(', ')}
Contributing Factors: ${incident.analysis.contributingFactors.join(', ')}
Blast Radius: ${incident.analysis.blastRadius}
Timeline: ${incident.timeline.map((t) => `${t.timestamp}: ${t.event}`).join('\n')}

Return JSON:
{
  "lessonsLearned": ["lesson 1"],
  "preventionMeasures": ["measure 1"],
  "detectionImprovements": ["improvement 1"],
  "blamelessSummary": "comprehensive blameless summary"
}`,
        agentRole: 'A10_incident',
        maxTokens: 2048,
        temperature: 0.3,
      });

      const parsed = parseJSONResponse<any>(response.result);
      if (parsed.lessonsLearned?.length) postmortem.lessonsLearned = parsed.lessonsLearned;
      if (parsed.preventionMeasures?.length) postmortem.preventionMeasures = parsed.preventionMeasures;
      if (parsed.detectionImprovements?.length) postmortem.detectionImprovements = parsed.detectionImprovements;
      if (parsed.blamelessSummary) postmortem.blamelessSummary = parsed.blamelessSummary;
    } catch (error) {
      console.warn('[IncidentResponder] LLM postmortem failed, using local analysis:', error);
    }

    return postmortem;
  }

  /**
   * Get all active incidents.
   */
  getActiveIncidents(): Incident[] {
    return Array.from(this.activeIncidents.values()).filter((i) => i.status !== 'closed');
  }

  /**
   * Analyze failure patterns across incidents.
   */
  analyzePatterns(): {
    topCauses: Array<{ cause: string; count: number }>;
    averageMTTR: number;
    severityDistribution: Record<string, number>;
  } {
    const incidents = Array.from(this.activeIncidents.values());

    const causeCounts = new Map<string, number>();
    for (const incident of incidents) {
      const cause = incident.analysis.rootCause;
      causeCounts.set(cause, (causeCounts.get(cause) || 0) + 1);
    }

    const topCauses = Array.from(causeCounts.entries())
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
    const avgMTTR = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, i) => sum + i.impact.downtime, 0) / resolvedIncidents.length
      : 0;

    const severityDist = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { topCauses, averageMTTR: avgMTTR, severityDistribution: severityDist };
  }
}
