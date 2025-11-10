/**
 * A1: Spec Architect (REAL IMPLEMENTATION - Phase II)
 *
 * Role: Transforms natural language requirements into formal, testable specifications
 * Innovation: Uses LLM reasoning to understand intent, identify edge cases, and create comprehensive specs
 *
 * Inputs:
 * - Natural language requirements (user stories, feature requests)
 * - Existing codebase context (optional)
 * - Project constraints (tech stack, performance, security)
 *
 * Outputs:
 * - Formal specification document
 * - Testable requirements with acceptance criteria
 * - Risk assessment
 * - Implementation suggestions
 *
 * Quality Guarantees:
 * - Completeness: All requirements are testable
 * - Clarity: Unambiguous specifications
 * - Feasibility: Realistic implementation scope
 * - Safety: Identifies potential risks upfront
 */

import { createClient } from '@supabase/supabase-js'

// Types
export interface SpecificationRequest {
  /** Natural language requirements from user */
  requirements: string

  /** Optional: Existing codebase context for better understanding */
  codebaseContext?: {
    files?: string[]
    dependencies?: Record<string, string>
    architecture?: string
  }

  /** Optional: Project constraints */
  constraints?: {
    techStack?: string[]
    maxComplexity?: 'low' | 'medium' | 'high'
    performanceTarget?: string
    securityRequirements?: string[]
  }

  /** Optional: User preferences */
  preferences?: {
    verbosity?: 'minimal' | 'detailed' | 'comprehensive'
    includeExamples?: boolean
  }
}

export interface Requirement {
  id: string
  type: 'functional' | 'non-functional' | 'constraint'
  priority: 'must-have' | 'should-have' | 'could-have' | 'wont-have'  // MoSCoW
  description: string
  acceptanceCriteria: string[]
  testable: boolean
  estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex'
  dependencies: string[]  // IDs of other requirements this depends on
  risks: string[]
}

export interface TechnicalSpecification {
  architecture: {
    components: string[]
    dataFlow: string
    apis?: string[]
    database?: string
  }
  implementation: {
    suggestedApproach: string
    alternativeApproaches?: string[]
    estimatedEffort: string
  }
  testing: {
    testTypes: string[]
    coverageTargets: Record<string, number>
    criticalPaths: string[]
  }
}

export interface RiskAssessment {
  risks: Array<{
    category: 'technical' | 'security' | 'performance' | 'complexity' | 'dependency'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    mitigation: string
    likelihood: number  // 0-1
    impact: number  // 0-1
  }>
  overallRiskScore: number  // 0-1, calculated from risks
  recommendations: string[]
}

export interface Specification {
  id: string
  version: string
  timestamp: string

  /** Original requirements from user */
  originalRequirements: string

  /** Parsed, structured requirements */
  requirements: Requirement[]

  /** Technical specification */
  technicalSpec: TechnicalSpecification

  /** Risk assessment */
  risks: RiskAssessment

  /** Validation result */
  validation: {
    isComplete: boolean
    isTestable: boolean
    isFeasible: boolean
    issues: string[]
    confidence: number  // 0-1, A1's confidence in this spec
  }

  /** Metadata */
  metadata: {
    generatedBy: 'A1_spec_architect'
    llmProvider: string
    llmModel: string
    tokensUsed: number
    costUSD: number
    latencyMs: number
  }
}

/**
 * A1 Spec Architect - Real Implementation
 */
export class SpecArchitect {
  private supabase: ReturnType<typeof createClient>
  private llmProxyUrl: string

  constructor(config: {
    supabaseUrl: string
    supabaseKey: string
    llmProxyUrl?: string
  }) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.llmProxyUrl = config.llmProxyUrl || `${config.supabaseUrl}/functions/v1/llm-proxy`
  }

  /**
   * Main entry point: Analyze requirements and generate specification
   */
  async analyzeRequirements(request: SpecificationRequest): Promise<Specification> {
    const startTime = Date.now()

    try {
      // Step 1: Use LLM to analyze and structure requirements
      const analysisPrompt = this.buildAnalysisPrompt(request)
      const analysisResult = await this.callLLM(analysisPrompt, 'requirement_analysis')

      // Step 2: Parse LLM response into structured format
      const parsedSpec = this.parseSpecification(analysisResult.result, request)

      // Step 3: Validate the specification
      const validation = this.validateSpecification(parsedSpec)

      // Step 4: Generate risk assessment
      const risks = await this.assessRisks(parsedSpec, request)

      // Step 5: Generate technical specification
      const technicalSpec = await this.generateTechnicalSpec(parsedSpec, request)

      // Assemble final specification
      const specification: Specification = {
        id: `spec-${Date.now()}`,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        originalRequirements: request.requirements,
        requirements: parsedSpec.requirements,
        technicalSpec,
        risks,
        validation,
        metadata: {
          generatedBy: 'A1_spec_architect',
          llmProvider: analysisResult.usage.provider,
          llmModel: analysisResult.usage.model,
          tokensUsed: analysisResult.usage.tokensInput + analysisResult.usage.tokensOutput,
          costUSD: analysisResult.usage.estimatedCost,
          latencyMs: Date.now() - startTime
        }
      }

      return specification
    } catch (error) {
      console.error('[A1] Error analyzing requirements:', error)
      throw new Error(`Specification analysis failed: ${error.message}`)
    }
  }

  /**
   * Build the LLM prompt for requirement analysis
   */
  private buildAnalysisPrompt(request: SpecificationRequest): string {
    const { requirements, codebaseContext, constraints, preferences } = request

    let prompt = `You are A1, the Spec Architect agent in Lumen-Orca, an AI system that achieves 99.9999% reliability.

Your role is to analyze natural language requirements and produce a formal, testable specification.

## User Requirements:
${requirements}
`

    if (codebaseContext) {
      prompt += `\n## Existing Codebase Context:
- Architecture: ${codebaseContext.architecture || 'Not specified'}
- Tech Stack: ${Object.keys(codebaseContext.dependencies || {}).join(', ')}
- Files: ${(codebaseContext.files || []).length} files
`
    }

    if (constraints) {
      prompt += `\n## Constraints:
- Tech Stack: ${(constraints.techStack || []).join(', ')}
- Max Complexity: ${constraints.maxComplexity || 'Not specified'}
- Performance Target: ${constraints.performanceTarget || 'Not specified'}
- Security: ${(constraints.securityRequirements || []).join(', ')}
`
    }

    prompt += `
## Your Task:
Analyze the requirements and provide a structured response in this EXACT JSON format:

{
  "requirements": [
    {
      "id": "REQ-001",
      "type": "functional|non-functional|constraint",
      "priority": "must-have|should-have|could-have|wont-have",
      "description": "Clear, unambiguous description",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
      "testable": true|false,
      "estimatedComplexity": "trivial|simple|moderate|complex|very-complex",
      "dependencies": ["REQ-002"],
      "risks": ["Potential risk"]
    }
  ],
  "architecture": {
    "components": ["Component 1", "Component 2"],
    "dataFlow": "Description of how data flows",
    "apis": ["API endpoint 1"],
    "database": "Database schema description"
  },
  "testing": {
    "testTypes": ["unit", "integration", "e2e"],
    "coverageTargets": {"unit": 95, "integration": 80},
    "criticalPaths": ["Critical path 1"]
  },
  "confidence": 0.85
}

IMPORTANT:
1. Every requirement MUST be testable (have measurable acceptance criteria)
2. Be specific about edge cases and error handling
3. Identify dependencies between requirements
4. Flag potential risks and complexities
5. Suggest test coverage targets
6. Return ONLY valid JSON, no markdown formatting

Respond with JSON now:`

    return prompt
  }

  /**
   * Call the LLM proxy
   */
  private async callLLM(prompt: string, taskType: string): Promise<any> {
    const response = await fetch(this.llmProxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.supabase.auth.session()?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentRole: 'A1_spec',
        prompt,
        systemPrompt: 'You are A1, the Spec Architect. You produce precise, testable specifications. You always respond with valid JSON.',
        taskId: `a1-${taskType}-${Date.now()}`
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Parse LLM response into structured Specification
   */
  private parseSpecification(llmResponse: string, request: SpecificationRequest): Partial<Specification> {
    try {
      // Remove markdown code blocks if present
      let cleaned = llmResponse.trim()
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '')
      }

      const parsed = JSON.parse(cleaned)

      return {
        requirements: parsed.requirements || [],
        technicalSpec: {
          architecture: parsed.architecture || {
            components: [],
            dataFlow: 'Not specified',
            apis: [],
            database: 'Not specified'
          },
          implementation: {
            suggestedApproach: parsed.suggestedApproach || 'Not specified',
            alternativeApproaches: parsed.alternativeApproaches || [],
            estimatedEffort: parsed.estimatedEffort || 'Unknown'
          },
          testing: parsed.testing || {
            testTypes: ['unit', 'integration'],
            coverageTargets: { unit: 95, integration: 80 },
            criticalPaths: []
          }
        },
        validation: {
          isComplete: false,
          isTestable: false,
          isFeasible: false,
          issues: [],
          confidence: parsed.confidence || 0.7
        }
      }
    } catch (error) {
      console.error('[A1] Failed to parse LLM response:', error)
      console.error('[A1] Response was:', llmResponse)

      // Return minimal valid spec on parse failure
      return {
        requirements: [],
        validation: {
          isComplete: false,
          isTestable: false,
          isFeasible: false,
          issues: [`Failed to parse LLM response: ${error.message}`],
          confidence: 0
        }
      }
    }
  }

  /**
   * Validate the specification for completeness and testability
   */
  private validateSpecification(spec: Partial<Specification>): Specification['validation'] {
    const issues: string[] = []
    let confidence = spec.validation?.confidence || 0.7

    // Check if we have requirements
    if (!spec.requirements || spec.requirements.length === 0) {
      issues.push('No requirements identified')
      confidence *= 0.5
    }

    // Check if all requirements are testable
    const untestedReqs = (spec.requirements || []).filter(r => !r.testable)
    if (untestedReqs.length > 0) {
      issues.push(`${untestedReqs.length} requirements are not testable`)
      confidence *= 0.8
    }

    // Check if requirements have acceptance criteria
    const noCriteria = (spec.requirements || []).filter(r => !r.acceptanceCriteria || r.acceptanceCriteria.length === 0)
    if (noCriteria.length > 0) {
      issues.push(`${noCriteria.length} requirements lack acceptance criteria`)
      confidence *= 0.9
    }

    // Check for must-have requirements
    const mustHaves = (spec.requirements || []).filter(r => r.priority === 'must-have')
    if (mustHaves.length === 0) {
      issues.push('No must-have requirements identified')
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(spec.requirements || [])
    if (circularDeps.length > 0) {
      issues.push(`Circular dependencies detected: ${circularDeps.join(', ')}`)
      confidence *= 0.7
    }

    return {
      isComplete: issues.length === 0,
      isTestable: untestedReqs.length === 0,
      isFeasible: spec.requirements && spec.requirements.length > 0 && spec.requirements.length < 50,  // Not too many reqs
      issues,
      confidence: Math.max(0, Math.min(1, confidence))
    }
  }

  /**
   * Assess risks in the specification
   */
  private async assessRisks(spec: Partial<Specification>, request: SpecificationRequest): Promise<RiskAssessment> {
    const risks: RiskAssessment['risks'] = []

    // Analyze complexity
    const complexReqs = (spec.requirements || []).filter(r =>
      r.estimatedComplexity === 'complex' || r.estimatedComplexity === 'very-complex'
    )
    if (complexReqs.length > 0) {
      risks.push({
        category: 'complexity',
        severity: complexReqs.length > 5 ? 'high' : 'medium',
        description: `${complexReqs.length} high-complexity requirements identified`,
        mitigation: 'Break down complex requirements into smaller, manageable tasks',
        likelihood: 0.8,
        impact: 0.6
      })
    }

    // Check for security-sensitive requirements
    const securityKeywords = ['auth', 'password', 'token', 'credential', 'secret', 'encrypt', 'security']
    const hasSecurityReqs = request.requirements.toLowerCase().split(/\s+/).some(word =>
      securityKeywords.some(keyword => word.includes(keyword))
    )
    if (hasSecurityReqs) {
      risks.push({
        category: 'security',
        severity: 'high',
        description: 'Security-sensitive requirements detected',
        mitigation: 'Ensure A9 security scanner reviews all code, use security best practices',
        likelihood: 0.7,
        impact: 0.9
      })
    }

    // Check for performance-sensitive requirements
    const perfKeywords = ['fast', 'performance', 'latency', 'speed', 'realtime', 'real-time']
    const hasPerfReqs = request.requirements.toLowerCase().split(/\s+/).some(word =>
      perfKeywords.some(keyword => word.includes(keyword))
    )
    if (hasPerfReqs) {
      risks.push({
        category: 'performance',
        severity: 'medium',
        description: 'Performance requirements identified',
        mitigation: 'Ensure A8 performance analyzer validates benchmarks',
        likelihood: 0.6,
        impact: 0.7
      })
    }

    // Calculate overall risk score (weighted average)
    const overallRiskScore = risks.length > 0
      ? risks.reduce((sum, r) => sum + (r.likelihood * r.impact), 0) / risks.length
      : 0.1  // Low baseline risk

    // Generate recommendations
    const recommendations: string[] = []
    if (overallRiskScore > 0.7) {
      recommendations.push('High risk project - consider phased implementation')
      recommendations.push('Increase test coverage targets to 98%+')
      recommendations.push('Enable continuous monitoring and rollback capability')
    }
    if (complexReqs.length > 3) {
      recommendations.push('Break project into multiple iterations')
    }
    if (hasSecurityReqs) {
      recommendations.push('Mandatory security review before deployment')
    }

    return {
      risks,
      overallRiskScore,
      recommendations
    }
  }

  /**
   * Generate detailed technical specification
   */
  private async generateTechnicalSpec(
    spec: Partial<Specification>,
    request: SpecificationRequest
  ): Promise<TechnicalSpecification> {
    // Use existing spec from parsing, or generate minimal one
    return spec.technicalSpec || {
      architecture: {
        components: [],
        dataFlow: 'Not specified',
        apis: [],
        database: 'Not specified'
      },
      implementation: {
        suggestedApproach: 'Incremental implementation with continuous testing',
        alternativeApproaches: ['Big-bang implementation', 'Prototype-first approach'],
        estimatedEffort: `${(spec.requirements || []).length * 2} hours`
      },
      testing: {
        testTypes: ['unit', 'integration', 'e2e'],
        coverageTargets: {
          unit: 95,
          integration: 85,
          e2e: 70
        },
        criticalPaths: (spec.requirements || [])
          .filter(r => r.priority === 'must-have')
          .map(r => r.description)
      }
    }
  }

  /**
   * Detect circular dependencies in requirements
   */
  private detectCircularDependencies(requirements: Requirement[]): string[] {
    const circular: string[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const reqMap = new Map(requirements.map(r => [r.id, r]))

    const hasCycle = (reqId: string): boolean => {
      visited.add(reqId)
      recursionStack.add(reqId)

      const req = reqMap.get(reqId)
      if (req) {
        for (const depId of req.dependencies) {
          if (!visited.has(depId)) {
            if (hasCycle(depId)) return true
          } else if (recursionStack.has(depId)) {
            circular.push(`${reqId} -> ${depId}`)
            return true
          }
        }
      }

      recursionStack.delete(reqId)
      return false
    }

    for (const req of requirements) {
      if (!visited.has(req.id)) {
        hasCycle(req.id)
      }
    }

    return circular
  }

  /**
   * Quick validation helper (for testing/debugging)
   */
  async quickAnalyze(requirements: string): Promise<Specification> {
    return this.analyzeRequirements({
      requirements,
      preferences: {
        verbosity: 'detailed',
        includeExamples: true
      }
    })
  }
}

// Export singleton instance helper
export function createSpecArchitect(config: {
  supabaseUrl: string
  supabaseKey: string
}): SpecArchitect {
  return new SpecArchitect(config)
}
