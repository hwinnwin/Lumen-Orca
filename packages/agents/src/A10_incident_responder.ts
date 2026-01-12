/**
 * A10: Incident Responder Agent
 * Role: Failure analysis, incident management, and recovery
 * Inputs: Error logs, alerts, system state
 * Outputs: Incident analysis, root cause, remediation plan
 */

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
  downtime: number; // minutes
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

// Severity classification rules
const SEVERITY_RULES = {
  P1: {
    criteria: ['complete outage', 'data breach', 'security incident', 'all users affected'],
    responseTime: '15 minutes',
    escalation: 'immediate',
  },
  P2: {
    criteria: ['major functionality broken', 'significant user impact', 'degraded performance'],
    responseTime: '1 hour',
    escalation: 'within 30 minutes',
  },
  P3: {
    criteria: ['minor functionality affected', 'workaround available', 'limited user impact'],
    responseTime: '4 hours',
    escalation: 'next business day',
  },
  P4: {
    criteria: ['cosmetic issues', 'feature requests', 'documentation'],
    responseTime: 'best effort',
    escalation: 'as needed',
  },
};

export class IncidentResponder {
  private activeIncidents: Map<string, Incident> = new Map();

  /**
   * Create and analyze a new incident
   */
  async createIncident(input: {
    error: ErrorLog;
    affectedComponents: string[];
    userReports?: number;
  }): Promise<Incident> {
    const severity = this.classifySeverity(input);
    const analysis = await this.analyzeRootCause(input);
    const impact = this.assessImpact(input);
    const remediation = this.generateRemediation(analysis, severity);

    const incident: Incident = {
      id: `INC-${Date.now().toString(36).toUpperCase()}`,
      severity,
      status: 'detected',
      summary: this.generateSummary(input.error),
      timeline: [
        {
          timestamp: new Date().toISOString(),
          event: 'Incident detected',
          actor: 'system',
        },
      ],
      analysis,
      impact,
      remediation,
    };

    this.activeIncidents.set(incident.id, incident);
    return incident;
  }

  private classifySeverity(input: { error: ErrorLog; userReports?: number }): 'P1' | 'P2' | 'P3' | 'P4' {
    const { error, userReports = 0 } = input;

    if (error.level === 'critical' || userReports > 100) return 'P1';
    if (error.level === 'error' && userReports > 10) return 'P2';
    if (error.level === 'error') return 'P3';
    return 'P4';
  }

  private async analyzeRootCause(input: {
    error: ErrorLog;
    affectedComponents: string[];
  }): Promise<IncidentAnalysis> {
    const { error, affectedComponents } = input;

    // Pattern matching for common root causes
    let rootCause = 'Unknown';
    let triggerCondition = 'Under investigation';
    const contributingFactors: string[] = [];

    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      rootCause = 'External service connectivity failure';
      triggerCondition = 'Network partition or service unavailability';
      contributingFactors.push('No circuit breaker implemented');
    } else if (error.message.includes('OutOfMemory') || error.message.includes('heap')) {
      rootCause = 'Memory exhaustion';
      triggerCondition = 'Memory leak or spike in load';
      contributingFactors.push('Insufficient memory limits', 'Possible memory leak');
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      rootCause = 'Rate limiting triggered';
      triggerCondition = 'Excessive API calls';
      contributingFactors.push('Missing request throttling', 'Spike in traffic');
    } else if (error.message.includes('permission') || error.message.includes('403')) {
      rootCause = 'Authorization failure';
      triggerCondition = 'Invalid or expired credentials';
      contributingFactors.push('Token expiration', 'Misconfigured permissions');
    } else if (error.stack?.includes('TypeError') || error.stack?.includes('undefined')) {
      rootCause = 'Runtime type error';
      triggerCondition = 'Unexpected null/undefined value';
      contributingFactors.push('Missing input validation', 'Incomplete error handling');
    }

    return {
      rootCause,
      triggerCondition,
      impactedComponents: affectedComponents,
      blastRadius: affectedComponents.length > 3 ? 'system' : 'service',
      contributingFactors,
    };
  }

  private assessImpact(input: { error: ErrorLog; userReports?: number }): Impact {
    const userReports = input.userReports || 0;

    return {
      affectedUsers: userReports * 10, // Estimate
      affectedRequests: userReports * 100,
      downtime: 0, // Updated as incident progresses
      dataLoss: false,
      reputationalRisk: userReports > 50 ? 'high' : userReports > 10 ? 'medium' : 'low',
    };
  }

  private generateRemediation(analysis: IncidentAnalysis, severity: string): Remediation {
    const immediate: Action[] = [];
    const shortTerm: Action[] = [];
    const longTerm: Action[] = [];

    // Immediate actions based on root cause
    if (analysis.rootCause.includes('connectivity')) {
      immediate.push({
        task: 'Check external service status and network connectivity',
        owner: 'oncall',
        priority: 'critical',
        status: 'pending',
      });
      shortTerm.push({
        task: 'Implement circuit breaker pattern',
        owner: 'engineering',
        priority: 'high',
        status: 'pending',
      });
    }

    if (analysis.rootCause.includes('Memory')) {
      immediate.push({
        task: 'Restart affected services',
        owner: 'oncall',
        priority: 'critical',
        status: 'pending',
      });
      shortTerm.push({
        task: 'Analyze memory profile and fix leaks',
        owner: 'engineering',
        priority: 'high',
        status: 'pending',
      });
    }

    // General actions
    immediate.push({
      task: 'Communicate status to stakeholders',
      owner: 'oncall',
      priority: severity === 'P1' ? 'critical' : 'high',
      status: 'pending',
    });

    longTerm.push({
      task: 'Add monitoring and alerting for this failure mode',
      owner: 'platform',
      priority: 'medium',
      status: 'pending',
    });

    longTerm.push({
      task: 'Update runbook with this incident pattern',
      owner: 'documentation',
      priority: 'medium',
      status: 'pending',
    });

    return { immediate, shortTerm, longTerm };
  }

  private generateSummary(error: ErrorLog): string {
    const type = error.level.toUpperCase();
    const shortMessage = error.message.slice(0, 100);
    return `[${type}] ${shortMessage}${error.message.length > 100 ? '...' : ''}`;
  }

  /**
   * Update incident status
   */
  updateStatus(incidentId: string, status: Incident['status'], event: string): Incident | null {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident) return null;

    incident.status = status;
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      event,
      actor: 'agent',
    });

    return incident;
  }

  /**
   * Generate postmortem for resolved incident
   */
  generatePostmortem(incidentId: string): Postmortem | null {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident || incident.status !== 'resolved') return null;

    const postmortem: Postmortem = {
      lessonsLearned: [
        `Root cause: ${incident.analysis.rootCause}`,
        `Trigger: ${incident.analysis.triggerCondition}`,
        ...incident.analysis.contributingFactors.map((f) => `Contributing: ${f}`),
      ],
      actionItems: [
        ...incident.remediation.longTerm,
        {
          task: 'Review and update incident response playbook',
          owner: 'platform',
          priority: 'medium',
          status: 'pending',
        },
      ],
      preventionMeasures: [
        'Implement automated testing for this scenario',
        'Add monitoring alerts for early detection',
        'Review similar systems for same vulnerability',
      ],
      detectionImprovements: [
        'Reduce time-to-detect with proactive monitoring',
        'Add synthetic monitoring for critical paths',
      ],
      blamelessSummary:
        'This incident was caused by a combination of factors. The focus is on improving systems and processes, not assigning blame.',
    };

    incident.postmortem = postmortem;
    return postmortem;
  }

  /**
   * Get all active incidents
   */
  getActiveIncidents(): Incident[] {
    return Array.from(this.activeIncidents.values()).filter(
      (i) => i.status !== 'closed'
    );
  }

  /**
   * Analyze failure patterns across incidents
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
    const avgMTTR =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum, i) => sum + i.impact.downtime, 0) / resolvedIncidents.length
        : 0;

    const severityDist = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      topCauses,
      averageMTTR: avgMTTR,
      severityDistribution: severityDist,
    };
  }
}
