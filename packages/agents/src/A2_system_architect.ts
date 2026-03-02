/**
 * A2: System Architect Agent
 * Role: System design and architecture planning
 * Inputs: Formal specifications from A1
 * Outputs: Architecture design with components, data flows, and diagrams
 *
 * Uses LLM analysis to create comprehensive system architectures
 * from requirement specifications, including component decomposition,
 * data flow design, and security considerations.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface ArchitectureDesign {
  id: string;
  overview: string;
  layers: ArchitectureLayer[];
  components: Component[];
  dataFlows: DataFlow[];
  securityConsiderations: string[];
  diagrams: {
    componentDiagram: string;
    sequenceDiagram: string;
  };
  tradeoffs: Tradeoff[];
}

export interface ArchitectureLayer {
  name: string;
  responsibility: string;
  components: string[];
}

export interface Component {
  id: string;
  name: string;
  type: 'service' | 'library' | 'database' | 'queue' | 'cache' | 'api';
  responsibility: string;
  interfaces: string[];
  dependencies: string[];
}

export interface DataFlow {
  from: string;
  to: string;
  data: string;
  protocol: 'http' | 'grpc' | 'websocket' | 'event' | 'direct';
}

export interface Tradeoff {
  decision: string;
  rationale: string;
  alternatives: string[];
}

export class SystemArchitectAgent {
  /**
   * Design system architecture from specifications (sync stub for backwards compat).
   * For real LLM-powered design, use designWithLLM().
   */
  design(specifications: { requirements: Array<{ id: string; text: string }> }): ArchitectureDesign {
    return {
      id: `arch-${Date.now()}`,
      overview: 'Pending LLM architecture analysis',
      layers: [
        { name: 'Presentation', responsibility: 'User interface and API endpoints', components: [] },
        { name: 'Application', responsibility: 'Business logic and orchestration', components: [] },
        { name: 'Domain', responsibility: 'Core business entities and rules', components: [] },
        { name: 'Infrastructure', responsibility: 'External service integration', components: [] },
      ],
      components: [],
      dataFlows: [],
      securityConsiderations: [],
      diagrams: { componentDiagram: '', sequenceDiagram: '' },
      tradeoffs: [],
    };
  }

  /**
   * Design system architecture using LLM analysis.
   */
  async designWithLLM(specifications: {
    title: string;
    description: string;
    requirements: Array<{ id: string; text: string; type?: string; priority?: string }>;
    constraints?: string[];
  }): Promise<ArchitectureDesign> {
    const systemPrompt = getAgentPrompt('A2_architect');

    const reqList = specifications.requirements
      .map((r) => `- [${r.id}] (${r.priority || 'should'}/${r.type || 'functional'}): ${r.text}`)
      .join('\n');

    const userPrompt = `Design a system architecture for the following project.

Title: ${specifications.title}
Description: ${specifications.description}

Requirements:
${reqList}

${specifications.constraints?.length ? `Constraints:\n${specifications.constraints.map((c) => `- ${c}`).join('\n')}` : ''}

Produce a comprehensive architecture design as JSON:
{
  "architecture": {
    "overview": "High-level description of the architecture",
    "layers": [
      { "name": "string", "responsibility": "string", "components": ["component names"] }
    ],
    "components": [
      {
        "name": "string",
        "type": "service|library|database|queue|cache|api",
        "responsibility": "string",
        "interfaces": ["interface descriptions"],
        "dependencies": ["other component names"]
      }
    ],
    "dataFlow": [
      { "from": "component", "to": "component", "data": "what data", "protocol": "http|grpc|websocket|event|direct" }
    ],
    "securityConsiderations": ["string"]
  },
  "diagrams": {
    "componentDiagram": "mermaid syntax for component diagram",
    "sequenceDiagram": "mermaid syntax for sequence diagram"
  },
  "tradeoffs": [
    { "decision": "string", "rationale": "string", "alternatives": ["string"] }
  ]
}`;

    const response = await callLLM({
      systemPrompt,
      userPrompt,
      agentRole: 'A2_architect',
      maxTokens: 6144,
      temperature: 0.4,
    });

    const parsed = parseJSONResponse<any>(response.result);
    return this.mapToArchitectureDesign(parsed);
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): ArchitectureDesign {
    return this.mapToArchitectureDesign(llmOutput);
  }

  private mapToArchitectureDesign(parsed: any): ArchitectureDesign {
    const arch = parsed.architecture || parsed;

    const components: Component[] = (arch.components || []).map((c: any, i: number) => ({
      id: c.id || `comp-${i + 1}`,
      name: c.name || `Component ${i + 1}`,
      type: c.type || 'service',
      responsibility: c.responsibility || '',
      interfaces: c.interfaces || [],
      dependencies: c.dependencies || [],
    }));

    const dataFlows: DataFlow[] = (arch.dataFlow || arch.dataFlows || []).map((df: any) => ({
      from: df.from || '',
      to: df.to || '',
      data: df.data || '',
      protocol: df.protocol || 'http',
    }));

    const layers: ArchitectureLayer[] = (arch.layers || []).map((l: any) => ({
      name: l.name || '',
      responsibility: l.responsibility || '',
      components: l.components || [],
    }));

    const tradeoffs: Tradeoff[] = (parsed.tradeoffs || arch.tradeoffs || []).map((t: any) => ({
      decision: t.decision || '',
      rationale: t.rationale || '',
      alternatives: t.alternatives || [],
    }));

    const diagrams = parsed.diagrams || arch.diagrams || {};

    return {
      id: `arch-${Date.now()}`,
      overview: arch.overview || '',
      layers,
      components,
      dataFlows,
      securityConsiderations: arch.securityConsiderations || [],
      diagrams: {
        componentDiagram: diagrams.componentDiagram || '',
        sequenceDiagram: diagrams.sequenceDiagram || '',
      },
      tradeoffs,
    };
  }

  /**
   * Validate architecture design for structural integrity.
   */
  validate(design: ArchitectureDesign): { valid: boolean; issues: string[]; score: number } {
    const issues: string[] = [];
    let score = 100;

    if (design.layers.length === 0) {
      issues.push('No architecture layers defined');
      score -= 20;
    }

    if (design.components.length === 0) {
      issues.push('No components defined');
      score -= 25;
    }

    if (design.securityConsiderations.length === 0) {
      issues.push('No security considerations documented');
      score -= 10;
    }

    if (design.dataFlows.length === 0 && design.components.length > 1) {
      issues.push('No data flows defined between components');
      score -= 15;
    }

    if (design.tradeoffs.length === 0) {
      issues.push('No architectural tradeoffs documented');
      score -= 5;
    }

    // Check for circular dependencies
    const componentDeps = new Map<string, string[]>(design.components.map((c) => [c.name, c.dependencies]));
    componentDeps.forEach((deps, name) => {
      for (const dep of deps) {
        const depDeps = componentDeps.get(dep) || [];
        if (depDeps.includes(name)) {
          issues.push(`Circular dependency detected: ${name} <-> ${dep}`);
          score -= 10;
        }
      }
    });

    // Check data flow references valid components
    const componentNames = new Set(design.components.map((c) => c.name));
    for (const flow of design.dataFlows) {
      if (!componentNames.has(flow.from)) {
        issues.push(`Data flow references unknown source: ${flow.from}`);
        score -= 3;
      }
      if (!componentNames.has(flow.to)) {
        issues.push(`Data flow references unknown target: ${flow.to}`);
        score -= 3;
      }
    }

    // Check layer components reference defined components
    for (const layer of design.layers) {
      for (const compName of layer.components) {
        if (!componentNames.has(compName)) {
          issues.push(`Layer "${layer.name}" references undefined component: ${compName}`);
          score -= 2;
        }
      }
    }

    // Check all components are assigned to a layer
    const layerComponents = new Set(design.layers.flatMap((l) => l.components));
    for (const comp of design.components) {
      if (!layerComponents.has(comp.name)) {
        issues.push(`Component "${comp.name}" not assigned to any layer`);
        score -= 2;
      }
    }

    score = Math.max(0, score);

    return { valid: issues.length === 0, issues, score };
  }
}
