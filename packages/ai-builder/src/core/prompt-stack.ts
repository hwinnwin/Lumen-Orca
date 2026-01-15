/**
 * AI Builder Platform — Prompt Stack Architecture
 *
 * THE MOAT: No single prompts. Ever.
 *
 * Each AI runs on a layered prompt stack:
 * 1. Core System Layer (Immutable)
 * 2. Behavior Layer
 * 3. Tone & Style Layer
 * 4. Task Layer
 * 5. Session Layer
 * 6. Interceptor Layer
 *
 * Users never see most of this. That's the point.
 */

import type {
  AIObject,
  AIBehavior,
  AITone,
  AISafety,
  AIMemoryPolicy,
  AIOutputFormat,
  AIRole,
  AIPurpose,
  HardStopCategory,
} from './ai-object';

// ============================================================================
// PROMPT STACK TYPES
// ============================================================================

export interface PromptStack {
  /** Layer 1: Core System (Immutable platform rules) */
  coreSystem: CoreSystemLayer;

  /** Layer 2: Behavior (What the AI is and is not) */
  behavior: BehaviorLayer;

  /** Layer 3: Tone & Style (How it communicates) */
  toneStyle: ToneStyleLayer;

  /** Layer 4: Task (What it helps with) */
  task: TaskLayer;

  /** Layer 5: Session (Context and memory) */
  session: SessionLayer;

  /** Layer 6: Interceptor (Runtime checks) */
  interceptor: InterceptorLayer;
}

export interface CompiledPrompt {
  /** The final system prompt */
  systemPrompt: string;

  /** Runtime interceptors to apply */
  interceptors: RuntimeInterceptor[];

  /** Metadata for debugging */
  metadata: PromptMetadata;
}

export interface PromptMetadata {
  /** AI Object ID this was compiled from */
  aiObjectId: string;

  /** Version used */
  versionNumber: string;

  /** Compilation timestamp */
  compiledAt: Date;

  /** Layer checksums for change detection */
  layerChecksums: Record<string, string>;

  /** Total token estimate */
  estimatedTokens: number;
}

// ============================================================================
// LAYER 1: CORE SYSTEM (IMMUTABLE)
// ============================================================================

export interface CoreSystemLayer {
  /** Platform identity statement */
  platformIdentity: string;

  /** Legal and ethical constraints */
  legalConstraints: string[];

  /** Non-negotiable safety rules */
  safetyRules: SafetyRule[];

  /** AI disclosure requirements */
  disclosureRequirements: string[];
}

export interface SafetyRule {
  /** Rule identifier */
  id: string;

  /** Rule category */
  category: HardStopCategory;

  /** Rule statement */
  statement: string;

  /** Whether this can ever be overridden */
  immutable: boolean;
}

/**
 * IMMUTABLE CORE SYSTEM LAYER
 * This is baked into every AI on the platform.
 */
export const CORE_SYSTEM_LAYER: CoreSystemLayer = {
  platformIdentity: `You are an AI assistant created through the AI Builder Platform.
You operate within a governance framework that ensures safe, reliable, and ethical behavior.
Your responses must always align with platform policies and the specific configuration provided.`,

  legalConstraints: [
    'Never provide legal advice as if you were a licensed attorney.',
    'Never provide medical advice as if you were a licensed physician.',
    'Never provide financial advice as if you were a licensed financial advisor.',
    'Always recommend consulting appropriate professionals for specialized advice.',
    'Respect intellectual property rights and copyright.',
    'Comply with applicable data protection and privacy regulations.',
  ],

  safetyRules: [
    {
      id: 'no_real_person_impersonation',
      category: 'real_person_impersonation',
      statement: 'Never impersonate real individuals (living or deceased). Do not claim to be a specific real person or simulate their voice/writing style in a way that could deceive.',
      immutable: true,
    },
    {
      id: 'no_copyrighted_characters',
      category: 'copyrighted_character',
      statement: 'Do not roleplay as or impersonate copyrighted characters from media, books, games, or other intellectual property without clear satire/parody framing.',
      immutable: true,
    },
    {
      id: 'no_illegal_assistance',
      category: 'illegal_activity',
      statement: 'Never provide assistance with illegal activities including but not limited to: hacking, fraud, violence, weapons creation, drug manufacturing, or any criminal enterprise.',
      immutable: true,
    },
    {
      id: 'no_self_harm',
      category: 'self_harm',
      statement: 'Never encourage, instruct, or assist with self-harm, suicide, or dangerous activities. Always provide crisis resources when detecting distress.',
      immutable: true,
    },
    {
      id: 'no_discrimination',
      category: 'discrimination',
      statement: 'Never produce content that discriminates against or demeans individuals or groups based on protected characteristics.',
      immutable: true,
    },
    {
      id: 'no_misinformation',
      category: 'misinformation',
      statement: 'Do not knowingly spread false information. When uncertain, acknowledge uncertainty. Do not fabricate citations, statistics, or facts.',
      immutable: true,
    },
  ],

  disclosureRequirements: [
    'Always acknowledge being an AI when directly asked.',
    'Never claim to be human or deny being an AI.',
    'Be transparent about limitations and uncertainties.',
    'Clarify that you cannot access real-time information unless explicitly configured.',
  ],
};

// ============================================================================
// LAYER 2: BEHAVIOR
// ============================================================================

export interface BehaviorLayer {
  /** Role clarity statement */
  roleClarity: string;

  /** What this AI is */
  identity: string[];

  /** What this AI is not */
  antiIdentity: string[];

  /** Decision-making guidelines */
  decisionGuidelines: string[];

  /** Boundary enforcement */
  boundaries: string[];
}

export function compileBehaviorLayer(
  role: AIRole,
  purpose: AIPurpose,
  behavior: AIBehavior
): BehaviorLayer {
  const roleClarity = `You are a ${role.title}. ${role.description}`;

  const identity = [
    `Your primary purpose: ${purpose.statement}`,
    ...purpose.capabilities.map(c => `You help with: ${c}`),
    ...role.expertise.map(e => `You have expertise in: ${e}`),
  ];

  const antiIdentity = [
    ...purpose.exclusions.map(e => `You do NOT: ${e}`),
    ...behavior.prohibitions.map(p => `You must never: ${p}`),
  ];

  const decisionGuidelines = compileDecisionStyle(behavior, role.decisionStyle);

  const boundaries = behavior.scopeBoundaries.map(b =>
    `Scope boundary (${b.type}): Allowed: [${b.allowed.join(', ')}]. ` +
    `Forbidden: [${b.forbidden.join(', ')}]. ` +
    `If out of scope, respond: "${b.outOfScopeResponse}"`
  );

  return {
    roleClarity,
    identity,
    antiIdentity,
    decisionGuidelines,
    boundaries,
  };
}

function compileDecisionStyle(
  behavior: AIBehavior,
  style: AIRole['decisionStyle']
): string[] {
  const guidelines: string[] = [];

  switch (style) {
    case 'directive':
      guidelines.push('Provide clear, direct recommendations.');
      guidelines.push('State your suggested course of action upfront.');
      guidelines.push('Explain rationale after the recommendation.');
      break;
    case 'consultative':
      guidelines.push('Ask clarifying questions before giving advice.');
      guidelines.push('Ensure you understand the full context first.');
      guidelines.push('Tailor recommendations to specific circumstances.');
      break;
    case 'collaborative':
      guidelines.push('Present options rather than single answers.');
      guidelines.push('Work through decisions together with the user.');
      guidelines.push('Encourage user input at each step.');
      break;
    case 'analytical':
      guidelines.push('Lead with data and evidence.');
      guidelines.push('Present pros and cons objectively.');
      guidelines.push('Let analysis guide recommendations.');
      break;
    case 'supportive':
      guidelines.push('Focus on what the user wants to achieve.');
      guidelines.push('Validate their direction while offering perspective.');
      guidelines.push('Provide encouragement alongside practical help.');
      break;
  }

  // Add strictness modifier
  if (behavior.strictness >= 4) {
    guidelines.push('Strictly enforce all guidelines. Do not make exceptions.');
  } else if (behavior.strictness <= 2) {
    guidelines.push('Apply guidelines flexibly based on context.');
  }

  // Add ambiguity handling
  switch (behavior.ambiguityHandling) {
    case 'ask_first':
      guidelines.push('When requests are ambiguous, ask for clarification before proceeding.');
      break;
    case 'best_effort':
      guidelines.push('When requests are ambiguous, make reasonable assumptions and proceed.');
      break;
    case 'refuse':
      guidelines.push('When requests are ambiguous, ask for explicit clarification before taking action.');
      break;
    case 'acknowledge':
      guidelines.push('When requests are ambiguous, proceed but explicitly state your assumptions.');
      break;
  }

  return guidelines;
}

// ============================================================================
// LAYER 3: TONE & STYLE
// ============================================================================

export interface ToneStyleLayer {
  /** Overall tone statement */
  toneStatement: string;

  /** Language guidelines */
  languageGuidelines: string[];

  /** Formatting preferences */
  formattingPreferences: string[];
}

export function compileToneStyleLayer(tone: AITone): ToneStyleLayer {
  const toneDescriptors: string[] = [];

  // Temperature
  switch (tone.temperature) {
    case 'cold':
      toneDescriptors.push('purely factual', 'emotionally neutral');
      break;
    case 'neutral':
      toneDescriptors.push('balanced', 'professional');
      break;
    case 'warm':
      toneDescriptors.push('approachable', 'encouraging');
      break;
    case 'friendly':
      toneDescriptors.push('warm', 'personable', 'supportive');
      break;
  }

  // Formality
  switch (tone.formality) {
    case 'casual':
      toneDescriptors.push('conversational', 'relaxed');
      break;
    case 'balanced':
      toneDescriptors.push('appropriately formal');
      break;
    case 'professional':
      toneDescriptors.push('business-appropriate', 'polished');
      break;
    case 'formal':
      toneDescriptors.push('highly formal', 'precise');
      break;
  }

  const toneStatement = `Communicate in a ${toneDescriptors.join(', ')} manner.`;

  const languageGuidelines: string[] = [];

  // Verbosity
  switch (tone.verbosity) {
    case 'minimal':
      languageGuidelines.push('Keep responses extremely brief. Use as few words as possible.');
      break;
    case 'concise':
      languageGuidelines.push('Keep responses short and focused. Avoid unnecessary elaboration.');
      break;
    case 'standard':
      languageGuidelines.push('Provide complete answers with appropriate detail.');
      break;
    case 'detailed':
      languageGuidelines.push('Provide thorough explanations with context and examples.');
      break;
    case 'comprehensive':
      languageGuidelines.push('Provide exhaustive coverage of topics with full context.');
      break;
  }

  // Language style
  const style = tone.languageStyle;
  if (style.useTechnicalTerms) {
    languageGuidelines.push('Use technical terminology when appropriate for the audience.');
  } else {
    languageGuidelines.push('Avoid jargon. Explain concepts in plain language.');
  }

  if (style.useExamples) {
    languageGuidelines.push('Include relevant examples to illustrate points.');
  }

  if (style.useAnalogies) {
    languageGuidelines.push('Use analogies and metaphors to explain complex concepts.');
  }

  switch (style.sentenceStructure) {
    case 'simple':
      languageGuidelines.push('Use simple, short sentences.');
      break;
    case 'varied':
      languageGuidelines.push('Vary sentence length and structure for readability.');
      break;
    case 'complex':
      languageGuidelines.push('Use sophisticated sentence structures when appropriate.');
      break;
  }

  const formattingPreferences: string[] = [];
  if (style.useStructuredFormat) {
    formattingPreferences.push('Use bullet points, numbered lists, and headers when helpful.');
    formattingPreferences.push('Structure complex information for easy scanning.');
  } else {
    formattingPreferences.push('Use prose format. Minimize lists and headers.');
  }

  // Custom markers
  if (tone.customMarkers) {
    for (const marker of tone.customMarkers) {
      languageGuidelines.push(`When ${marker.trigger}: ${marker.modification}`);
    }
  }

  return {
    toneStatement,
    languageGuidelines,
    formattingPreferences,
  };
}

// ============================================================================
// LAYER 4: TASK
// ============================================================================

export interface TaskLayer {
  /** Primary task description */
  taskDescription: string;

  /** Accepted input types */
  inputGuidelines: string[];

  /** Output structure requirements */
  outputGuidelines: string[];

  /** Task-specific instructions */
  taskInstructions: string[];
}

export function compileTaskLayer(
  purpose: AIPurpose,
  outputFormat: AIOutputFormat
): TaskLayer {
  const taskDescription = `Your task focus: ${purpose.statement}`;

  const inputGuidelines = outputFormat.acceptedInputs.map(input => {
    switch (input) {
      case 'text':
        return 'Accept general text input for processing.';
      case 'question':
        return 'Accept questions and provide answers.';
      case 'document':
        return 'Accept documents for analysis and summarization.';
      case 'data':
        return 'Accept data for analysis and interpretation.';
      case 'code':
        return 'Accept code for review, explanation, or modification.';
      case 'image_description':
        return 'Accept descriptions of images for analysis.';
      default:
        return '';
    }
  }).filter(Boolean);

  const outputGuidelines: string[] = [];

  // Output structure
  switch (outputFormat.defaultStructure) {
    case 'freeform':
      outputGuidelines.push('Format output naturally based on content.');
      break;
    case 'structured':
      outputGuidelines.push('Always use structured formatting (headers, lists, sections).');
      break;
    case 'conversational':
      outputGuidelines.push('Respond conversationally, as in a dialogue.');
      break;
    case 'step_by_step':
      outputGuidelines.push('Break down responses into clear, numbered steps.');
      break;
    case 'q_and_a':
      outputGuidelines.push('Format responses as clear question-answer pairs.');
      break;
  }

  // Length preferences
  const length = outputFormat.lengthPreference;
  switch (length.preferred) {
    case 'concise':
      outputGuidelines.push('Keep responses brief and to the point.');
      break;
    case 'balanced':
      outputGuidelines.push('Provide appropriately detailed responses.');
      break;
    case 'thorough':
      outputGuidelines.push('Provide comprehensive, detailed responses.');
      break;
  }

  // Custom formatting rules
  const taskInstructions = outputFormat.formattingRules.map(rule =>
    `When ${rule.condition}: ${rule.format}`
  );

  // Add use cases as context
  if (purpose.useCases.length > 0) {
    taskInstructions.push(`Common use cases: ${purpose.useCases.join(', ')}`);
  }

  return {
    taskDescription,
    inputGuidelines,
    outputGuidelines,
    taskInstructions,
  };
}

// ============================================================================
// LAYER 5: SESSION
// ============================================================================

export interface SessionLayer {
  /** Context window instructions */
  contextInstructions: string[];

  /** Memory usage guidelines */
  memoryGuidelines: string[];

  /** Session boundary rules */
  sessionRules: string[];
}

export function compileSessionLayer(memory: AIMemoryPolicy): SessionLayer {
  const contextInstructions: string[] = [];
  const memoryGuidelines: string[] = [];
  const sessionRules: string[] = [];

  // Memory mode
  switch (memory.mode) {
    case 'stateless':
      memoryGuidelines.push('Treat each message independently. Do not reference previous messages.');
      break;
    case 'session':
      memoryGuidelines.push('Remember context within this conversation session.');
      memoryGuidelines.push('Do not reference information from other sessions.');
      break;
    case 'persistent':
      memoryGuidelines.push('You may reference information from previous sessions with this user.');
      break;
    case 'selective':
      memoryGuidelines.push('Only remember information the user explicitly asks you to remember.');
      break;
  }

  // Context window
  switch (memory.contextWindowSize) {
    case 'minimal':
      contextInstructions.push('Focus on the most recent exchange only.');
      break;
    case 'standard':
      contextInstructions.push('Consider recent conversation context.');
      break;
    case 'extended':
      contextInstructions.push('Consider broader conversation context when relevant.');
      break;
    case 'maximum':
      contextInstructions.push('Maintain awareness of full conversation history.');
      break;
  }

  // Session boundaries
  const boundary = memory.sessionBoundary;
  switch (boundary.boundaryType) {
    case 'explicit':
      sessionRules.push('Sessions end only when explicitly closed by the user.');
      break;
    case 'time_based':
      sessionRules.push(`Sessions expire after ${boundary.timeoutMinutes || 30} minutes of inactivity.`);
      break;
    case 'continuous':
      sessionRules.push('Treat all interactions as one continuous session.');
      break;
  }

  // Carryover
  if (boundary.carryOver.includes('context')) {
    sessionRules.push('Carry conversation context across session boundaries.');
  }
  if (boundary.carryOver.includes('preferences')) {
    sessionRules.push('Remember user preferences across sessions.');
  }
  if (boundary.carryOver.includes('nothing')) {
    sessionRules.push('Start fresh at each session boundary.');
  }

  return {
    contextInstructions,
    memoryGuidelines,
    sessionRules,
  };
}

// ============================================================================
// LAYER 6: INTERCEPTOR
// ============================================================================

export interface InterceptorLayer {
  /** Drift detection configuration */
  driftDetection: DriftDetectionConfig;

  /** Safety interceptors */
  safetyInterceptors: SafetyInterceptorConfig[];

  /** Dependency detection */
  dependencyDetection: DependencyDetectionConfig;
}

export interface DriftDetectionConfig {
  /** Enable drift detection */
  enabled: boolean;

  /** Topics that should trigger drift warning */
  driftTopics: string[];

  /** How to handle detected drift */
  driftResponse: string;
}

export interface SafetyInterceptorConfig {
  /** Interceptor name */
  name: string;

  /** Detection patterns (regex) */
  patterns: string[];

  /** Response when triggered */
  response: string;

  /** Severity level */
  severity: 'block' | 'warn' | 'log';
}

export interface DependencyDetectionConfig {
  /** Enable dependency language detection */
  enabled: boolean;

  /** Phrases that indicate dependency */
  triggerPhrases: string[];

  /** Intervention response */
  intervention: string;
}

export interface RuntimeInterceptor {
  /** Interceptor ID */
  id: string;

  /** Check function (runs against user input) */
  check: (input: string) => InterceptorResult;
}

export interface InterceptorResult {
  /** Whether the interceptor was triggered */
  triggered: boolean;

  /** Severity if triggered */
  severity?: 'block' | 'warn' | 'log';

  /** Message to inject or display */
  message?: string;

  /** Whether to continue processing */
  continueProcessing: boolean;
}

export function compileInterceptorLayer(
  safety: AISafety,
  behavior: AIBehavior
): InterceptorLayer {
  // Drift detection based on scope boundaries
  const driftTopics = behavior.scopeBoundaries
    .filter(b => b.type === 'topic')
    .flatMap(b => b.forbidden);

  const driftDetection: DriftDetectionConfig = {
    enabled: driftTopics.length > 0,
    driftTopics,
    driftResponse: 'This topic is outside my configured scope. Let me redirect our conversation.',
  };

  // Safety interceptors from hard stops
  const safetyInterceptors: SafetyInterceptorConfig[] = safety.hardStops
    .filter(hs => hs.enabled)
    .map(hs => ({
      name: hs.category,
      patterns: getPatterns(hs.category),
      response: hs.message || getDefaultSafetyResponse(hs.category),
      severity: 'block' as const,
    }));

  // Add soft boundaries as warnings
  for (const boundary of safety.softBoundaries) {
    safetyInterceptors.push({
      name: boundary.name,
      patterns: [boundary.pattern],
      response: boundary.warning,
      severity: boundary.allowOverride ? 'warn' : 'block',
    });
  }

  // Dependency detection
  const dependencyDetection: DependencyDetectionConfig = {
    enabled: safety.dependencyPrevention.enabled,
    triggerPhrases: getDependencyTriggers(safety.dependencyPrevention.sensitivity),
    intervention: safety.dependencyPrevention.customMessage ||
      getDefaultDependencyIntervention(safety.dependencyPrevention.interventionStyle),
  };

  return {
    driftDetection,
    safetyInterceptors,
    dependencyDetection,
  };
}

// ============================================================================
// PATTERN HELPERS
// ============================================================================

function getPatterns(category: HardStopCategory): string[] {
  // These are starter patterns - in production, use more sophisticated detection
  const patterns: Record<HardStopCategory, string[]> = {
    real_person_impersonation: [
      'pretend to be .+ (celebrity|politician|public figure)',
      'act as .+ (real person)',
      'you are (elon musk|joe biden|taylor swift)', // Example patterns
    ],
    copyrighted_character: [
      'roleplay as (harry potter|mickey mouse|spiderman)',
      'you are (darth vader|gandalf|pikachu)',
    ],
    illegal_activity: [
      'how to (hack|break into|steal)',
      'make a (bomb|weapon|drug)',
      'illegal .+ instructions',
    ],
    self_harm: [
      'how to (hurt|harm|kill) (myself|yourself)',
      'suicide (methods|instructions)',
      'ways to (die|end it)',
    ],
    violence: [
      'how to (hurt|attack|harm) (someone|people)',
      'instructions for violence',
    ],
    discrimination: [
      'why .+ (race|gender|religion) is (inferior|bad|evil)',
    ],
    misinformation: [
      'write fake (news|facts|statistics)',
      'create propaganda',
    ],
    privacy_violation: [
      'find .+ (address|phone number|personal information)',
      'doxx',
    ],
  };

  return patterns[category] || [];
}

function getDefaultSafetyResponse(category: HardStopCategory): string {
  const responses: Record<HardStopCategory, string> = {
    real_person_impersonation: 'I cannot impersonate real people.',
    copyrighted_character: 'I cannot roleplay as copyrighted characters.',
    illegal_activity: 'I cannot assist with illegal activities.',
    self_harm: 'I\'m concerned about this request. If you\'re struggling, please reach out to a crisis helpline.',
    violence: 'I cannot provide assistance with violence.',
    discrimination: 'I cannot produce discriminatory content.',
    misinformation: 'I cannot help create false or misleading information.',
    privacy_violation: 'I cannot help with obtaining private information.',
  };

  return responses[category] || 'I cannot help with this request.';
}

function getDependencyTriggers(sensitivity: 'low' | 'medium' | 'high'): string[] {
  const baseTriggers = [
    'you\'re the only one who understands',
    'i need you',
    'don\'t leave me',
    'promise you\'ll always',
  ];

  const mediumTriggers = [
    'you\'re my best friend',
    'i can only talk to you',
    'you\'re always there for me',
  ];

  const highTriggers = [
    'you understand me',
    'you\'re so helpful',
    'i appreciate you',
  ];

  switch (sensitivity) {
    case 'low':
      return baseTriggers;
    case 'medium':
      return [...baseTriggers, ...mediumTriggers];
    case 'high':
      return [...baseTriggers, ...mediumTriggers, ...highTriggers];
  }
}

function getDefaultDependencyIntervention(
  style: 'redirect' | 'gentle_reminder' | 'explicit_warning'
): string {
  switch (style) {
    case 'redirect':
      return 'Let me help you with your task. Is there something specific I can assist with?';
    case 'gentle_reminder':
      return 'I\'m an AI assistant here to help with tasks. For emotional support, human connections are invaluable.';
    case 'explicit_warning':
      return 'I notice this conversation may be becoming personal. I\'m an AI and cannot replace human relationships. Please consider reaching out to friends, family, or a counselor for personal support.';
  }
}

// ============================================================================
// PROMPT COMPILER
// ============================================================================

export function compilePromptStack(aiObject: AIObject): CompiledPrompt {
  // Compile each layer
  const behaviorLayer = compileBehaviorLayer(
    aiObject.role,
    aiObject.purpose,
    aiObject.behavior
  );

  const toneStyleLayer = compileToneStyleLayer(aiObject.tone);

  const taskLayer = compileTaskLayer(
    aiObject.purpose,
    aiObject.outputFormat
  );

  const sessionLayer = compileSessionLayer(aiObject.memory);

  const interceptorLayer = compileInterceptorLayer(
    aiObject.safety,
    aiObject.behavior
  );

  // Assemble the system prompt
  const sections: string[] = [];

  // Layer 1: Core System
  sections.push('=== SYSTEM FOUNDATION ===');
  sections.push(CORE_SYSTEM_LAYER.platformIdentity);
  sections.push('');
  sections.push('Core Rules:');
  for (const rule of CORE_SYSTEM_LAYER.safetyRules) {
    sections.push(`- ${rule.statement}`);
  }
  sections.push('');
  sections.push('Legal Constraints:');
  for (const constraint of CORE_SYSTEM_LAYER.legalConstraints) {
    sections.push(`- ${constraint}`);
  }
  sections.push('');
  sections.push('Disclosure:');
  for (const disclosure of CORE_SYSTEM_LAYER.disclosureRequirements) {
    sections.push(`- ${disclosure}`);
  }

  // Layer 2: Behavior
  sections.push('');
  sections.push('=== YOUR ROLE ===');
  sections.push(behaviorLayer.roleClarity);
  sections.push('');
  sections.push('What You Are:');
  for (const identity of behaviorLayer.identity) {
    sections.push(`- ${identity}`);
  }
  if (behaviorLayer.antiIdentity.length > 0) {
    sections.push('');
    sections.push('What You Are Not:');
    for (const anti of behaviorLayer.antiIdentity) {
      sections.push(`- ${anti}`);
    }
  }
  sections.push('');
  sections.push('Decision Guidelines:');
  for (const guideline of behaviorLayer.decisionGuidelines) {
    sections.push(`- ${guideline}`);
  }
  if (behaviorLayer.boundaries.length > 0) {
    sections.push('');
    sections.push('Boundaries:');
    for (const boundary of behaviorLayer.boundaries) {
      sections.push(`- ${boundary}`);
    }
  }

  // Layer 3: Tone & Style
  sections.push('');
  sections.push('=== COMMUNICATION STYLE ===');
  sections.push(toneStyleLayer.toneStatement);
  sections.push('');
  sections.push('Language:');
  for (const guideline of toneStyleLayer.languageGuidelines) {
    sections.push(`- ${guideline}`);
  }
  sections.push('');
  sections.push('Formatting:');
  for (const pref of toneStyleLayer.formattingPreferences) {
    sections.push(`- ${pref}`);
  }

  // Layer 4: Task
  sections.push('');
  sections.push('=== TASK FOCUS ===');
  sections.push(taskLayer.taskDescription);
  sections.push('');
  sections.push('Input Handling:');
  for (const input of taskLayer.inputGuidelines) {
    sections.push(`- ${input}`);
  }
  sections.push('');
  sections.push('Output:');
  for (const output of taskLayer.outputGuidelines) {
    sections.push(`- ${output}`);
  }
  if (taskLayer.taskInstructions.length > 0) {
    sections.push('');
    sections.push('Specific Instructions:');
    for (const instruction of taskLayer.taskInstructions) {
      sections.push(`- ${instruction}`);
    }
  }

  // Layer 5: Session
  sections.push('');
  sections.push('=== SESSION BEHAVIOR ===');
  for (const instruction of sessionLayer.contextInstructions) {
    sections.push(`- ${instruction}`);
  }
  for (const guideline of sessionLayer.memoryGuidelines) {
    sections.push(`- ${guideline}`);
  }
  for (const rule of sessionLayer.sessionRules) {
    sections.push(`- ${rule}`);
  }

  // AI Framing (from safety)
  if (aiObject.safety.aiFraming.alwaysIdentifyAsAI) {
    sections.push('');
    sections.push('=== AI TRANSPARENCY ===');
    sections.push('- Always acknowledge being an AI when asked.');
    if (aiObject.safety.aiFraming.customDisclaimer) {
      sections.push(`- Disclaimer: ${aiObject.safety.aiFraming.customDisclaimer}`);
    }
  }

  const systemPrompt = sections.join('\n');

  // Build runtime interceptors
  const interceptors: RuntimeInterceptor[] = buildRuntimeInterceptors(interceptorLayer);

  // Calculate metadata
  const metadata: PromptMetadata = {
    aiObjectId: aiObject.id,
    versionNumber: aiObject.version.versionNumber,
    compiledAt: new Date(),
    layerChecksums: {
      core: hashString(JSON.stringify(CORE_SYSTEM_LAYER)),
      behavior: hashString(JSON.stringify(behaviorLayer)),
      tone: hashString(JSON.stringify(toneStyleLayer)),
      task: hashString(JSON.stringify(taskLayer)),
      session: hashString(JSON.stringify(sessionLayer)),
      interceptor: hashString(JSON.stringify(interceptorLayer)),
    },
    estimatedTokens: Math.ceil(systemPrompt.length / 4), // Rough estimate
  };

  return {
    systemPrompt,
    interceptors,
    metadata,
  };
}

function buildRuntimeInterceptors(layer: InterceptorLayer): RuntimeInterceptor[] {
  const interceptors: RuntimeInterceptor[] = [];

  // Drift detection interceptor
  if (layer.driftDetection.enabled) {
    interceptors.push({
      id: 'drift_detection',
      check: (input: string) => {
        const lowerInput = input.toLowerCase();
        for (const topic of layer.driftDetection.driftTopics) {
          if (lowerInput.includes(topic.toLowerCase())) {
            return {
              triggered: true,
              severity: 'warn',
              message: layer.driftDetection.driftResponse,
              continueProcessing: true,
            };
          }
        }
        return { triggered: false, continueProcessing: true };
      },
    });
  }

  // Safety interceptors
  for (const safety of layer.safetyInterceptors) {
    interceptors.push({
      id: `safety_${safety.name}`,
      check: (input: string) => {
        const lowerInput = input.toLowerCase();
        for (const pattern of safety.patterns) {
          try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(lowerInput)) {
              return {
                triggered: true,
                severity: safety.severity,
                message: safety.response,
                continueProcessing: safety.severity !== 'block',
              };
            }
          } catch {
            // Invalid regex, skip
          }
        }
        return { triggered: false, continueProcessing: true };
      },
    });
  }

  // Dependency detection interceptor
  if (layer.dependencyDetection.enabled) {
    interceptors.push({
      id: 'dependency_detection',
      check: (input: string) => {
        const lowerInput = input.toLowerCase();
        for (const phrase of layer.dependencyDetection.triggerPhrases) {
          if (lowerInput.includes(phrase.toLowerCase())) {
            return {
              triggered: true,
              severity: 'warn',
              message: layer.dependencyDetection.intervention,
              continueProcessing: true,
            };
          }
        }
        return { triggered: false, continueProcessing: true };
      },
    });
  }

  return interceptors;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  PromptStack,
  CompiledPrompt,
  PromptMetadata,
  CoreSystemLayer,
  BehaviorLayer,
  ToneStyleLayer,
  TaskLayer,
  SessionLayer,
  InterceptorLayer,
};
