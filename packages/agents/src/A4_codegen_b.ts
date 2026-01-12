/**
 * A4: Code Generator (Path B)
 * Role: Alternative code generation for diversity
 * Inputs: Same architecture design as A3
 * Outputs: Alternative implementation with different patterns
 * Quality: Emphasizes functional patterns and immutability
 */

export interface GeneratedCodeB {
  id: string;
  code: string;
  language: 'typescript';
  tests: TestCaseB[];
  approachRationale: string;
  tradeoffs: string[];
  dependencies: string[];
}

export interface TestCaseB {
  name: string;
  type: 'unit' | 'integration' | 'property';
  code: string;
  properties?: string[];
}

export interface GenerationOptionsB {
  functionalStyle: boolean;
  useImmutableStructures: boolean;
  preferComposition: boolean;
}

export class CodeGeneratorB {
  private options: GenerationOptionsB;

  constructor(options: Partial<GenerationOptionsB> = {}) {
    this.options = {
      functionalStyle: true,
      useImmutableStructures: true,
      preferComposition: true,
      ...options,
    };
  }

  /**
   * Generate alternative implementation
   */
  generate(design: { components: Array<{ name: string; type: string }> }): GeneratedCodeB {
    const code = this.generateFunctionalCode(design.components);
    const tests = this.generatePropertyTests(design.components);

    return {
      id: `gen-b-${Date.now()}`,
      code,
      language: 'typescript',
      tests,
      approachRationale: this.generateRationale(),
      tradeoffs: this.identifyTradeoffs(),
      dependencies: this.inferDependencies(),
    };
  }

  private generateFunctionalCode(components: Array<{ name: string; type: string }>): string {
    // Emphasize functional patterns
    return components
      .map(
        (c) => `
// ${c.name} - Functional implementation
import { pipe, flow } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

// Immutable state type
type ${c.name}State = Readonly<{
  // TODO: Define state
}>;

// Pure transformation functions
const create${c.name} = (): ${c.name}State => Object.freeze({});

const update${c.name} = (state: ${c.name}State) =>
  (updates: Partial<${c.name}State>): ${c.name}State =>
    Object.freeze({ ...state, ...updates });

// Effect handlers using Either for error handling
const ${c.name.toLowerCase()}Effect = (input: unknown): E.Either<Error, ${c.name}State> =>
  E.tryCatch(
    () => create${c.name}(),
    (error) => error instanceof Error ? error : new Error(String(error))
  );

export { create${c.name}, update${c.name}, ${c.name.toLowerCase()}Effect };
export type { ${c.name}State };
`
      )
      .join('\n');
  }

  private generatePropertyTests(components: Array<{ name: string }>): TestCaseB[] {
    return components.map((c) => ({
      name: `${c.name}.property.test`,
      type: 'property' as const,
      code: `
import * as fc from 'fast-check';
import { create${c.name}, update${c.name} } from './${c.name}';

describe('${c.name} properties', () => {
  it('create returns frozen object', () => {
    const state = create${c.name}();
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('update preserves immutability', () => {
    fc.assert(fc.property(
      fc.record({}),
      (updates) => {
        const original = create${c.name}();
        const updated = update${c.name}(original)(updates);
        return Object.isFrozen(updated) && original !== updated;
      }
    ));
  });
});
`,
      properties: ['immutability', 'referential transparency'],
    }));
  }

  private generateRationale(): string {
    const reasons: string[] = [];
    if (this.options.functionalStyle) {
      reasons.push('Uses functional programming patterns for predictable state management');
    }
    if (this.options.useImmutableStructures) {
      reasons.push('Immutable data structures prevent accidental mutations and enable better debugging');
    }
    if (this.options.preferComposition) {
      reasons.push('Composition over inheritance provides more flexibility and easier testing');
    }
    return reasons.join('. ');
  }

  private identifyTradeoffs(): string[] {
    return [
      'Slightly higher memory usage due to immutability',
      'Learning curve for functional patterns',
      'May require additional libraries (fp-ts, immer)',
      'More verbose for simple CRUD operations',
    ];
  }

  private inferDependencies(): string[] {
    return ['fp-ts', 'fast-check', 'typescript'];
  }
}
