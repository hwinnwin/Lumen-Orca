/**
 * Orca Core Types
 *
 * The Dragon Architect Pattern:
 * Truth emerges from cross-verification, not generation.
 * Nothing is accepted until verified from multiple angles.
 */

// === Artifact Types ===

export type ArtifactType =
  | 'spec'           // Natural language specification
  | 'architecture'   // System design document
  | 'contract'       // Interface/schema definition
  | 'code'           // Source code
  | 'test'           // Test code
  | 'evidence'       // Verification results
  | 'question'       // Clarification needed

export interface Artifact {
  id: string;
  type: ArtifactType;
  content: string;
  metadata: {
    createdAt: Date;
    createdBy: string;  // Which agent/phase
    version: number;
    parentId?: string;  // What artifact this was derived from
  };
  verification: VerificationStatus;
}

// === Cross-Reference Types ===

export type VerificationResult = 'pass' | 'fail' | 'partial' | 'pending';

export interface CrossReference {
  id: string;
  sourceArtifact: string;  // Artifact being verified
  targetArtifact: string;  // Artifact being verified against
  relationship: CrossReferenceType;
  result: VerificationResult;
  confidence: number;      // 0-1, how confident in this verification
  reasoning: string;       // Explanation of verification result
  issues: Issue[];         // Any problems found
  verifiedAt: Date;
}

export type CrossReferenceType =
  | 'implements'       // Code implements Spec
  | 'tests'            // Test tests Code
  | 'covers'           // Test covers Spec requirement
  | 'conforms'         // Code conforms to Contract
  | 'consistent'       // Code consistent with existing Codebase
  | 'validates'        // Runtime validates Code behavior
  | 'resolves'         // Answer resolves Question

export interface Issue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
}

// === Verification Status ===

export interface VerificationStatus {
  overall: VerificationResult;
  crossReferences: CrossReference[];
  confidence: number;  // Aggregate confidence (0-1)

  // Individual verification dimensions
  dimensions: {
    specAlignment: VerificationResult;     // Does it match spec?
    testCoverage: VerificationResult;      // Is it tested?
    contractConformance: VerificationResult; // Does it follow interfaces?
    codeConsistency: VerificationResult;   // Is it consistent with existing code?
    runtimeBehavior: VerificationResult;   // Does it actually work?
  };
}

export function createPendingVerification(): VerificationStatus {
  return {
    overall: 'pending',
    crossReferences: [],
    confidence: 0,
    dimensions: {
      specAlignment: 'pending',
      testCoverage: 'pending',
      contractConformance: 'pending',
      codeConsistency: 'pending',
      runtimeBehavior: 'pending',
    },
  };
}

// === Build Plan Types ===

export interface Component {
  id: string;
  name: string;
  description: string;
  dependencies: string[];  // IDs of components this depends on
  artifacts: Artifact[];
  status: ComponentStatus;
}

export type ComponentStatus =
  | 'pending'      // Not started
  | 'generating'   // Code being generated
  | 'testing'      // Tests being run
  | 'fixing'       // Errors being corrected
  | 'verifying'    // Cross-references being checked
  | 'complete'     // All verifications pass
  | 'blocked'      // Cannot proceed (needs human input)
  | 'failed'       // Exceeded retry limit

export interface BuildPlan {
  id: string;
  name: string;
  description: string;
  components: Component[];
  buildOrder: string[];  // Component IDs in dependency order
  status: BuildStatus;
  startedAt?: Date;
  completedAt?: Date;
}

export type BuildStatus =
  | 'planning'
  | 'building'
  | 'integrating'
  | 'validating'
  | 'complete'
  | 'failed'
  | 'blocked'

// === Execution Context ===

export interface ExecutionContext {
  buildPlan: BuildPlan;
  currentComponent?: string;
  currentPhase: Phase;

  // The growing codebase
  codebase: Map<string, string>;  // filepath -> content

  // All artifacts produced
  artifacts: Map<string, Artifact>;

  // All cross-references computed
  crossReferences: CrossReference[];

  // Decision log for debugging
  decisions: Decision[];

  // Questions that need human input
  pendingQuestions: Question[];

  // Retry tracking
  retries: Map<string, number>;  // componentId -> retry count
  maxRetries: number;
}

export type Phase =
  | 'understand'   // Parsing the prompt
  | 'architect'    // Designing the system
  | 'build'        // Generating code
  | 'test'         // Running tests
  | 'fix'          // Correcting errors
  | 'verify'       // Cross-referencing
  | 'integrate'    // Wiring components
  | 'validate'     // Final checks
  | 'complete'     // Done
  | 'blocked'      // Waiting for human

export interface Decision {
  timestamp: Date;
  phase: Phase;
  component?: string;
  description: string;
  reasoning: string;
  alternatives?: string[];
  outcome: string;
}

export interface Question {
  id: string;
  context: string;
  question: string;
  options?: string[];
  importance: 'blocking' | 'clarifying' | 'optional';
  answer?: string;
  answeredAt?: Date;
}

// === Agent Types ===

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  execute(input: AgentInput): Promise<AgentOutput>;
}

export type AgentRole =
  | 'spec-parser'      // Understands natural language specs
  | 'architect'        // Designs system structure
  | 'coder'           // Generates code
  | 'tester'          // Generates and runs tests
  | 'reviewer'        // Reviews code for issues
  | 'fixer'           // Diagnoses and fixes errors
  | 'verifier'        // Cross-references artifacts
  | 'integrator'      // Wires components together

export interface AgentInput {
  task: string;
  context: ExecutionContext;
  artifacts: Artifact[];
  constraints?: string[];
}

export interface AgentOutput {
  artifacts: Artifact[];
  crossReferences: CrossReference[];
  decisions: Decision[];
  questions: Question[];
  success: boolean;
  error?: string;
}

// === Configuration ===

export interface OrcaConfig {
  maxRetries: number;              // Per-component retry limit (default: 3)
  confidenceThreshold: number;     // Minimum confidence to accept (default: 0.8)
  requireAllDimensions: boolean;   // All verification dimensions must pass (default: true)
  allowPartialProgress: boolean;   // Continue if some components fail (default: false)
  humanApprovalGates: Phase[];     // Phases requiring human approval
}

export const DEFAULT_CONFIG: OrcaConfig = {
  maxRetries: 3,
  confidenceThreshold: 0.8,
  requireAllDimensions: true,
  allowPartialProgress: false,
  humanApprovalGates: ['architect', 'integrate'], // Review design and integration
};
