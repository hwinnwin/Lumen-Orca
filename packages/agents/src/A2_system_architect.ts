/**
 * A2: System Architect Agent
 * Role: System design and architecture planning
 * Inputs: Formal specifications from A1
 * Outputs: Architecture design with components, data flows, and diagrams
 */

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
   * Design system architecture from specifications
   */
  design(specifications: { requirements: Array<{ id: string; text: string }> }): ArchitectureDesign {
    return {
      id: `arch-${Date.now()}`,
      overview: 'Architecture generated from specifications',
      layers: [
        {
          name: 'Presentation',
          responsibility: 'User interface and API endpoints',
          components: ['WebApp', 'APIGateway'],
        },
        {
          name: 'Application',
          responsibility: 'Business logic and orchestration',
          components: ['Services', 'Handlers'],
        },
        {
          name: 'Domain',
          responsibility: 'Core business entities and rules',
          components: ['Entities', 'ValueObjects', 'DomainServices'],
        },
        {
          name: 'Infrastructure',
          responsibility: 'External service integration',
          components: ['Database', 'Cache', 'ExternalAPIs'],
        },
      ],
      components: [],
      dataFlows: [],
      securityConsiderations: [
        'Authentication at API Gateway',
        'Row-level security in database',
        'Encrypted data at rest and in transit',
      ],
      diagrams: {
        componentDiagram: '```mermaid\ncomponent diagram\n```',
        sequenceDiagram: '```mermaid\nsequence diagram\n```',
      },
      tradeoffs: [],
    };
  }

  /**
   * Validate architecture design
   */
  validate(design: ArchitectureDesign): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (design.layers.length === 0) {
      issues.push('No architecture layers defined');
    }

    if (design.securityConsiderations.length === 0) {
      issues.push('No security considerations documented');
    }

    // Check for circular dependencies
    const componentDeps = new Map(design.components.map((c) => [c.id, c.dependencies]));
    for (const [id, deps] of componentDeps) {
      for (const dep of deps) {
        const depDeps = componentDeps.get(dep) || [];
        if (depDeps.includes(id)) {
          issues.push(`Circular dependency detected: ${id} <-> ${dep}`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
