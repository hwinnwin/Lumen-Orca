/**
 * Real Test Runner
 *
 * Executes generated tests using vitest and captures results.
 * This is where the rubber meets the road - generated code must actually work.
 */

import { spawn } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

export interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  output: string;
  errors: string[];
  duration: number;
}

export interface TestRunnerConfig {
  /** Working directory for test execution */
  workDir?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Keep temp files after run */
  keepFiles?: boolean;
}

export class TestRunner {
  private config: Required<TestRunnerConfig>;

  constructor(config: TestRunnerConfig = {}) {
    this.config = {
      workDir: config.workDir || join(tmpdir(), `orca-test-${Date.now()}`),
      timeout: config.timeout || 30000,
      keepFiles: config.keepFiles || false,
    };
  }

  /**
   * Run tests for generated code
   */
  async run(
    code: string,
    tests: string,
    options: { filename?: string } = {}
  ): Promise<TestResult> {
    const startTime = Date.now();
    const filename = options.filename || 'module';

    try {
      // Create temp directory structure
      await mkdir(this.config.workDir, { recursive: true });

      // Write files
      const codeFile = join(this.config.workDir, `${filename}.ts`);
      const testFile = join(this.config.workDir, `${filename}.test.ts`);
      const configFile = join(this.config.workDir, 'vitest.config.ts');
      const packageFile = join(this.config.workDir, 'package.json');
      const tsconfigFile = join(this.config.workDir, 'tsconfig.json');

      // Write source code
      await writeFile(codeFile, code);

      // Write tests (fix imports to use local file)
      const fixedTests = tests.replace(
        /from ['"]\.\/[^'"]+['"]/g,
        `from './${filename}'`
      ).replace(
        /from ['"][^'"./][^'"]*['"]/g,
        (match) => match // Keep external imports as-is
      );
      await writeFile(testFile, fixedTests);

      // Write vitest config
      await writeFile(configFile, `
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['*.test.ts'],
  },
});
`);

      // Write package.json
      await writeFile(packageFile, JSON.stringify({
        name: 'orca-test-run',
        type: 'module',
        scripts: {
          test: 'vitest run'
        },
        devDependencies: {
          vitest: '^1.0.0',
          typescript: '^5.3.0'
        }
      }, null, 2));

      // Write tsconfig
      await writeFile(tsconfigFile, JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true
        }
      }, null, 2));

      // Install dependencies
      await this.exec('pnpm', ['install'], this.config.workDir);

      // Run vitest
      const result = await this.runVitest();

      return {
        ...result,
        duration: Date.now() - startTime,
      };

    } finally {
      // Cleanup
      if (!this.config.keepFiles) {
        try {
          await rm(this.config.workDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Run vitest and parse output
   */
  private async runVitest(): Promise<Omit<TestResult, 'duration'>> {
    return new Promise((resolve) => {
      const child = spawn('pnpm', ['test'], {
        cwd: this.config.workDir,
        shell: true,
        timeout: this.config.timeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const output = stdout + '\n' + stderr;
        const result = this.parseVitestOutput(output, code === 0);
        resolve(result);
      });

      child.on('error', (err) => {
        resolve({
          passed: false,
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          output: err.message,
          errors: [err.message],
        });
      });
    });
  }

  /**
   * Parse vitest output to extract test results
   */
  private parseVitestOutput(output: string, exitSuccess: boolean): Omit<TestResult, 'duration'> {
    const errors: string[] = [];

    // Extract test counts
    // Format: "Tests  X passed | Y failed (Z)"
    const testMatch = output.match(/Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?/i);
    const passedTests = testMatch ? parseInt(testMatch[1]) : 0;
    const failedTests = testMatch && testMatch[2] ? parseInt(testMatch[2]) : 0;
    const totalTests = passedTests + failedTests;

    // Alternative format: "✓ X tests passed" or "X passed"
    if (totalTests === 0) {
      const altMatch = output.match(/(\d+)\s+passed/i);
      if (altMatch) {
        return {
          passed: exitSuccess,
          totalTests: parseInt(altMatch[1]),
          passedTests: parseInt(altMatch[1]),
          failedTests: 0,
          output,
          errors,
        };
      }
    }

    // Extract error messages
    const errorMatches = output.matchAll(/(?:FAIL|Error|AssertionError)[^\n]*\n([^\n]+)/g);
    for (const match of errorMatches) {
      errors.push(match[0].trim());
    }

    // Check for TypeScript errors
    const tsErrors = output.matchAll(/error TS\d+:[^\n]+/g);
    for (const match of tsErrors) {
      errors.push(match[0]);
    }

    return {
      passed: exitSuccess && failedTests === 0,
      totalTests: totalTests || (exitSuccess ? 1 : 0),
      passedTests,
      failedTests,
      output,
      errors,
    };
  }

  /**
   * Execute a command
   */
  private exec(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        shell: true,
        timeout: 60000,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${command} exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Get the working directory (useful for debugging)
   */
  getWorkDir(): string {
    return this.config.workDir;
  }
}

/**
 * Mock test runner for development without actual execution
 */
export class MockTestRunner {
  private shouldPass: boolean = true;

  setShouldPass(pass: boolean): void {
    this.shouldPass = pass;
  }

  async run(code: string, tests: string): Promise<TestResult> {
    // Count test cases in the test file
    const testCount = (tests.match(/it\s*\(/g) || []).length ||
                     (tests.match(/test\s*\(/g) || []).length || 5;

    if (this.shouldPass) {
      return {
        passed: true,
        totalTests: testCount,
        passedTests: testCount,
        failedTests: 0,
        output: `✓ ${testCount} tests passed`,
        errors: [],
        duration: 150 + Math.random() * 100,
      };
    } else {
      const failCount = Math.ceil(testCount * 0.3);
      return {
        passed: false,
        totalTests: testCount,
        passedTests: testCount - failCount,
        failedTests: failCount,
        output: `✓ ${testCount - failCount} passed, ✗ ${failCount} failed`,
        errors: ['AssertionError: expected true to be false'],
        duration: 200 + Math.random() * 100,
      };
    }
  }
}
