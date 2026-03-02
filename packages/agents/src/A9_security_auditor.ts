/**
 * A9: Security Auditor Agent
 * Role: Security scanning and vulnerability assessment
 * Inputs: Code and configuration files
 * Outputs: Security report with vulnerabilities and recommendations
 *
 * Combines regex-based OWASP pattern detection with LLM-powered
 * deep security analysis for comprehensive vulnerability assessment.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface SecurityReport {
  id: string;
  timestamp: string;
  vulnerabilities: Vulnerability[];
  passed: boolean;
  summary: VulnerabilitySummary;
  rlsStatus: RLSStatus;
  recommendations: string[];
  complianceChecks: ComplianceCheck[];
}

export interface Vulnerability {
  id: string;
  cve?: string;
  cwe: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  location: string;
  description: string;
  remediation: string;
  references: string[];
}

export interface VulnerabilitySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

export interface RLSStatus {
  enabled: boolean;
  tables: TableRLS[];
  coverage: number;
}

export interface TableRLS {
  name: string;
  rlsEnabled: boolean;
  policies: string[];
  publicAccess: boolean;
}

export interface ComplianceCheck {
  standard: 'owasp' | 'cwe' | 'pci' | 'hipaa';
  check: string;
  passed: boolean;
  details: string;
}

const OWASP_PATTERNS: Array<{
  id: string;
  name: string;
  pattern: RegExp;
  cwe: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation: string;
}> = [
  { id: 'A01', name: 'Broken Access Control', pattern: /\.role\s*!==|isAdmin\s*===?\s*false/, cwe: 'CWE-284', severity: 'critical', remediation: 'Implement proper authorization checks using RLS and middleware' },
  { id: 'A02', name: 'Cryptographic Failures', pattern: /md5|sha1|DES|password\s*=\s*['"][^'"]+['"]/i, cwe: 'CWE-327', severity: 'high', remediation: 'Use strong encryption (AES-256) and secure hashing (bcrypt, argon2)' },
  { id: 'A03', name: 'Injection', pattern: /eval\(|exec\(|`\$\{.*\}`|innerHTML\s*=|\.html\(/, cwe: 'CWE-79', severity: 'critical', remediation: 'Use parameterized queries, escape user input, avoid eval/innerHTML' },
  { id: 'A04', name: 'Insecure Design', pattern: /\/\/\s*TODO:?\s*(security|auth|validate)/i, cwe: 'CWE-657', severity: 'medium', remediation: 'Complete security TODOs and implement threat modeling' },
  { id: 'A05', name: 'Security Misconfiguration', pattern: /cors:\s*{\s*origin:\s*['"]\*['"]/, cwe: 'CWE-16', severity: 'medium', remediation: 'Configure strict CORS policies and security headers' },
  { id: 'A06', name: 'Vulnerable Components', pattern: /require\(['"]lodash['"]|import.*from\s*['"]moment['"]/, cwe: 'CWE-1104', severity: 'medium', remediation: 'Keep dependencies updated, use npm audit, consider lighter alternatives' },
  { id: 'A07', name: 'Auth Failures', pattern: /jwt\.sign\(.*expiresIn:\s*['"]?(\d{4,}|never)/i, cwe: 'CWE-287', severity: 'high', remediation: 'Use short-lived tokens, implement refresh token rotation' },
  { id: 'A08', name: 'Data Integrity Failures', pattern: /JSON\.parse\(.*\)\s*(?!.*try)/, cwe: 'CWE-502', severity: 'medium', remediation: 'Validate and sanitize deserialized data, use schema validation' },
  { id: 'A09', name: 'Logging Failures', pattern: /console\.(log|error)\(.*password|console\.(log|error)\(.*token/i, cwe: 'CWE-778', severity: 'medium', remediation: 'Never log sensitive data, implement proper audit logging' },
  { id: 'A10', name: 'SSRF', pattern: /fetch\(\s*(?:req\.|request\.|params\.|query\.)/, cwe: 'CWE-918', severity: 'high', remediation: 'Validate and whitelist URLs, use allow-lists for external requests' },
];

export class SecurityAuditor {
  /**
   * Run comprehensive security audit using local pattern matching.
   */
  async audit(input: {
    code: string;
    dependencies?: string[];
    supabaseConfig?: { tables: string[] };
  }): Promise<SecurityReport> {
    const vulnerabilities = this.scanVulnerabilities(input.code);
    if (input.dependencies) {
      vulnerabilities.push(...this.scanDependencyVulnerabilities(input.dependencies));
    }
    const rlsStatus = this.checkRLSFromCode(input.code, input.supabaseConfig);
    const complianceChecks = this.runComplianceChecks(input.code, vulnerabilities);
    const summary = this.buildSummary(vulnerabilities);
    const recommendations = this.generateRecommendations(vulnerabilities, rlsStatus);

    return {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      vulnerabilities,
      passed: summary.critical === 0 && summary.high === 0,
      summary,
      rlsStatus,
      recommendations,
      complianceChecks,
    };
  }

  /**
   * Run LLM-powered deep security audit.
   */
  async auditWithLLM(input: {
    code: string;
    dependencies?: string[];
    supabaseConfig?: { tables: string[] };
    migrationSQL?: string;
  }): Promise<SecurityReport> {
    // First run local scan
    const localReport = await this.audit(input);

    // Then enhance with LLM deep analysis
    const systemPrompt = getAgentPrompt('A9_security');

    const securityRelevantCode = this.extractSecurityRelevantCode(input.code);

    const userPrompt = `Perform a deep security audit of this code.

=== CODE (security-relevant sections) ===
${securityRelevantCode.slice(0, 5000)}

=== LOCAL SCAN RESULTS ===
Found ${localReport.vulnerabilities.length} issues:
${localReport.vulnerabilities.map((v) => `- [${v.severity.toUpperCase()}] ${v.category}: ${v.description} (${v.location})`).join('\n')}

${input.dependencies?.length ? `=== DEPENDENCIES ===\n${input.dependencies.join(', ')}` : ''}
${input.migrationSQL ? `=== DATABASE MIGRATION ===\n${input.migrationSQL.slice(0, 2000)}` : ''}

RLS Status: ${localReport.rlsStatus.enabled ? 'Enabled' : 'Disabled'} (${(localReport.rlsStatus.coverage * 100).toFixed(0)}% coverage)

Identify additional vulnerabilities the regex scan may have missed:
1. Logic-based vulnerabilities (broken auth flows, privilege escalation)
2. Data exposure risks (PII leaks, insecure storage)
3. Race conditions and TOCTOU vulnerabilities
4. Insecure direct object references
5. Missing input validation on critical paths

Return JSON:
{
  "additionalVulnerabilities": [
    {
      "cwe": "CWE-XXX",
      "severity": "critical|high|medium|low",
      "category": "OWASP category",
      "location": "function/component name",
      "description": "specific issue",
      "remediation": "how to fix"
    }
  ],
  "rlsRecommendations": ["RLS-specific advice"],
  "overallRiskLevel": "critical|high|medium|low",
  "recommendations": ["actionable recommendation"]
}`;

    try {
      const response = await callLLM({
        systemPrompt,
        userPrompt,
        agentRole: 'A9_security',
        maxTokens: 4096,
        temperature: 0.2,
      });

      const parsed = parseJSONResponse<any>(response.result);

      // Merge LLM-found vulnerabilities with local ones
      const llmVulns: Vulnerability[] = (parsed.additionalVulnerabilities || []).map((v: any, i: number) => ({
        id: `VULN-LLM-${Date.now()}-${i}`,
        cwe: v.cwe || 'CWE-000',
        severity: v.severity || 'medium',
        category: v.category || 'LLM-detected',
        location: v.location || 'unknown',
        description: v.description || '',
        remediation: v.remediation || '',
        references: [],
      }));

      localReport.vulnerabilities.push(...llmVulns);
      localReport.summary = this.buildSummary(localReport.vulnerabilities);
      localReport.passed = localReport.summary.critical === 0 && localReport.summary.high === 0;

      // Merge recommendations
      const llmRecs = parsed.recommendations || [];
      const rlsRecs = parsed.rlsRecommendations || [];
      const existingRecs = new Set(localReport.recommendations);
      for (const rec of [...llmRecs, ...rlsRecs]) {
        if (!existingRecs.has(rec)) localReport.recommendations.push(rec);
      }
    } catch (error) {
      console.warn('[SecurityAuditor] LLM analysis failed, using local scan:', error);
    }

    return localReport;
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): SecurityReport {
    const vulns = ((llmOutput.vulnerabilities as any[]) || []).map((v: any, i: number) => ({
      id: v.id || `VULN-${Date.now()}-${i}`,
      cve: v.cve,
      cwe: v.cwe || 'CWE-000',
      severity: v.severity || 'medium',
      category: v.category || 'unknown',
      location: v.location || 'unknown',
      description: v.description || '',
      remediation: v.remediation || '',
      references: v.references || [],
    })) as Vulnerability[];

    const summary = this.buildSummary(vulns);

    return {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      vulnerabilities: vulns,
      passed: (llmOutput.passed as boolean) ?? (summary.critical === 0 && summary.high === 0),
      summary,
      rlsStatus: (llmOutput.rlsStatus as RLSStatus) || { enabled: false, tables: [], coverage: 0 },
      recommendations: (llmOutput.recommendations as string[]) || [],
      complianceChecks: [],
    };
  }

  private scanVulnerabilities(code: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const lines = code.split('\n');

    for (const pattern of OWASP_PATTERNS) {
      lines.forEach((line, index) => {
        if (pattern.pattern.test(line)) {
          vulnerabilities.push({
            id: `VULN-${pattern.id}-${index + 1}`,
            cwe: pattern.cwe,
            severity: pattern.severity,
            category: pattern.name,
            location: `line:${index + 1}`,
            description: `Potential ${pattern.name} vulnerability detected: ${line.trim().slice(0, 80)}`,
            remediation: pattern.remediation,
            references: [`https://owasp.org/Top10/#${pattern.id}`],
          });
        }
      });
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi, name: 'API Key' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi, name: 'Secret' },
      { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, name: 'Password' },
    ];

    for (const sp of secretPatterns) {
      lines.forEach((line, index) => {
        if (sp.pattern.test(line)) {
          vulnerabilities.push({
            id: `VULN-SECRET-${index + 1}`,
            cwe: 'CWE-798',
            severity: 'critical',
            category: 'Hardcoded Credentials',
            location: `line:${index + 1}`,
            description: `Hardcoded ${sp.name} detected in source code`,
            remediation: 'Move secrets to environment variables or secret management service',
            references: ['https://cwe.mitre.org/data/definitions/798.html'],
          });
        }
        sp.pattern.lastIndex = 0; // Reset regex state
      });
    }

    return vulnerabilities;
  }

  private scanDependencyVulnerabilities(dependencies: string[]): Vulnerability[] {
    const knownVulnerable: Record<string, { cve: string; severity: 'critical' | 'high' | 'medium'; fix: string }> = {
      'lodash': { cve: 'CVE-2021-23337', severity: 'high', fix: 'Update to lodash@4.17.21+' },
      'moment': { cve: 'CVE-2022-31129', severity: 'high', fix: 'Migrate to date-fns or dayjs' },
      'minimist': { cve: 'CVE-2021-44906', severity: 'critical', fix: 'Update to minimist@1.2.6+' },
      'node-fetch': { cve: 'CVE-2022-0235', severity: 'high', fix: 'Update to node-fetch@2.6.7+ or use native fetch' },
      'express': { cve: 'CVE-2024-29041', severity: 'medium', fix: 'Update to latest express version' },
    };

    const vulns: Vulnerability[] = [];
    for (const dep of dependencies) {
      const depName = dep.split('@')[0];
      const known = knownVulnerable[depName];
      if (known) {
        vulns.push({
          id: `DEP-${depName}`,
          cve: known.cve,
          cwe: 'CWE-1104',
          severity: known.severity,
          category: 'Vulnerable Dependency',
          location: `dependency:${dep}`,
          description: `Known vulnerability in ${depName} (${known.cve})`,
          remediation: known.fix,
          references: [`https://nvd.nist.gov/vuln/detail/${known.cve}`],
        });
      }
    }
    return vulns;
  }

  private checkRLSFromCode(code: string, config?: { tables: string[] }): RLSStatus {
    const tables: TableRLS[] = [];

    // Extract table references from code
    const tableNames = config?.tables || [];
    const codeTableRefs = code.match(/\.from\(['"](\w+)['"]\)/g) || [];
    for (const ref of codeTableRefs) {
      const match = ref.match(/\.from\(['"](\w+)['"]\)/);
      if (match && !tableNames.includes(match[1])) {
        tableNames.push(match[1]);
      }
    }

    // Check for RLS-related patterns in code
    const hasRLSPolicy = code.includes('CREATE POLICY') || code.includes('ALTER TABLE') && code.includes('ENABLE ROW LEVEL SECURITY');
    const hasAuthFilter = code.includes('auth.uid()') || code.includes('user_id');

    for (const name of tableNames) {
      tables.push({
        name,
        rlsEnabled: hasRLSPolicy || hasAuthFilter,
        policies: hasAuthFilter ? ['user_isolation'] : [],
        publicAccess: !hasAuthFilter,
      });
    }

    const enabledCount = tables.filter((t) => t.rlsEnabled).length;
    const coverage = tables.length > 0 ? enabledCount / tables.length : 1;

    return {
      enabled: coverage >= 0.9,
      tables,
      coverage,
    };
  }

  private runComplianceChecks(code: string, vulnerabilities: Vulnerability[]): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    checks.push({
      standard: 'owasp',
      check: 'OWASP Top 10 Scan',
      passed: vulnerabilities.filter((v) => v.severity === 'critical').length === 0,
      details: `Found ${vulnerabilities.length} potential issues (${vulnerabilities.filter((v) => v.severity === 'critical').length} critical)`,
    });

    const hasValidation = /zod|yup|joi|\.safeParse|\.parse\(|Joi\.object/.test(code);
    checks.push({
      standard: 'cwe',
      check: 'CWE-20: Input Validation',
      passed: hasValidation,
      details: hasValidation ? 'Schema validation detected' : 'No schema validation library found',
    });

    const hasAuth = /supabase\.auth|jwt|OAuth|getSession|useAuth/.test(code);
    checks.push({
      standard: 'cwe',
      check: 'CWE-287: Authentication',
      passed: hasAuth,
      details: hasAuth ? 'Authentication implementation detected' : 'No authentication found',
    });

    const hasHTTPS = !code.includes('http://') || /NODE_ENV.*development|localhost/.test(code);
    checks.push({
      standard: 'owasp',
      check: 'Transport Security',
      passed: hasHTTPS,
      details: hasHTTPS ? 'HTTPS enforced or dev-only HTTP' : 'HTTP URLs detected in production code',
    });

    const hasCSP = code.includes('Content-Security-Policy') || code.includes('helmet');
    checks.push({
      standard: 'owasp',
      check: 'Security Headers',
      passed: hasCSP,
      details: hasCSP ? 'CSP or helmet detected' : 'No Content Security Policy found',
    });

    return checks;
  }

  private buildSummary(vulnerabilities: Vulnerability[]): VulnerabilitySummary {
    return {
      critical: vulnerabilities.filter((v) => v.severity === 'critical').length,
      high: vulnerabilities.filter((v) => v.severity === 'high').length,
      medium: vulnerabilities.filter((v) => v.severity === 'medium').length,
      low: vulnerabilities.filter((v) => v.severity === 'low').length,
      info: vulnerabilities.filter((v) => v.severity === 'info').length,
      total: vulnerabilities.length,
    };
  }

  private generateRecommendations(vulnerabilities: Vulnerability[], rlsStatus: RLSStatus): string[] {
    const recs: string[] = [];

    const criticals = vulnerabilities.filter((v) => v.severity === 'critical');
    if (criticals.length > 0) {
      recs.push(`URGENT: Address ${criticals.length} critical vulnerabilities: ${criticals.map((v) => v.category).join(', ')}`);
    }

    const highs = vulnerabilities.filter((v) => v.severity === 'high');
    if (highs.length > 0) {
      recs.push(`Address ${highs.length} high-severity vulnerabilities: ${highs.map((v) => v.category).join(', ')}`);
    }

    if (!rlsStatus.enabled || rlsStatus.coverage < 1) {
      recs.push('Enable Row Level Security on all Supabase tables');
    }

    const unprotected = rlsStatus.tables.filter((t) => t.publicAccess);
    if (unprotected.length > 0) {
      recs.push(`Review public access on tables: ${unprotected.map((t) => t.name).join(', ')}`);
    }

    if (vulnerabilities.some((v) => v.cwe === 'CWE-79')) {
      recs.push('Implement Content Security Policy headers to mitigate XSS');
    }

    if (vulnerabilities.some((v) => v.category === 'Vulnerable Dependency')) {
      recs.push('Run npm audit and update vulnerable dependencies');
    }

    if (recs.length === 0) {
      recs.push('No critical or high-severity issues found. Continue regular security scanning.');
    }

    return recs;
  }

  private extractSecurityRelevantCode(code: string): string {
    const lines = code.split('\n');
    const relevant: string[] = [];
    const patterns = [/auth|login|password|token|secret|key|credential/i, /fetch\(|axios|request\(/, /eval|exec|innerHTML|dangerouslySetInnerHTML/, /\.from\(|\.insert|\.update|\.delete|\.select/, /cors|helmet|csp|Content-Security/, /encrypt|decrypt|hash|bcrypt|jwt/i, /cookie|session|localStorage|sessionStorage/];

    for (let i = 0; i < lines.length; i++) {
      if (patterns.some((p) => p.test(lines[i]))) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 3);
        relevant.push(`// Line ${i + 1}:`);
        relevant.push(...lines.slice(start, end));
        relevant.push('');
      }
    }

    return relevant.length > 0 ? relevant.join('\n') : code.slice(0, 3000);
  }
}
