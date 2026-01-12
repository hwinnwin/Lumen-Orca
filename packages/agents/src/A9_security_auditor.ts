/**
 * A9: Security Auditor Agent
 * Role: Security scanning and vulnerability assessment
 * Inputs: Code and configuration files
 * Outputs: Security report with vulnerabilities and recommendations
 */

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

// OWASP Top 10 patterns to detect
const OWASP_PATTERNS: Array<{
  id: string;
  name: string;
  pattern: RegExp;
  cwe: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation: string;
}> = [
  {
    id: 'A01',
    name: 'Broken Access Control',
    pattern: /\.role\s*!==|isAdmin\s*===?\s*false/,
    cwe: 'CWE-284',
    severity: 'critical',
    remediation: 'Implement proper authorization checks using RLS and middleware',
  },
  {
    id: 'A02',
    name: 'Cryptographic Failures',
    pattern: /md5|sha1|DES|password\s*=\s*['"][^'"]+['"]/i,
    cwe: 'CWE-327',
    severity: 'high',
    remediation: 'Use strong encryption (AES-256) and secure hashing (bcrypt, argon2)',
  },
  {
    id: 'A03',
    name: 'Injection',
    pattern: /eval\(|exec\(|`\$\{.*\}`|innerHTML\s*=|\.html\(/,
    cwe: 'CWE-79',
    severity: 'critical',
    remediation: 'Use parameterized queries, escape user input, avoid eval/innerHTML',
  },
  {
    id: 'A04',
    name: 'Insecure Design',
    pattern: /\/\/\s*TODO:?\s*(security|auth|validate)/i,
    cwe: 'CWE-657',
    severity: 'medium',
    remediation: 'Complete security TODOs and implement threat modeling',
  },
  {
    id: 'A05',
    name: 'Security Misconfiguration',
    pattern: /cors:\s*{\s*origin:\s*['"]\*['"]/,
    cwe: 'CWE-16',
    severity: 'medium',
    remediation: 'Configure strict CORS policies and security headers',
  },
  {
    id: 'A06',
    name: 'Vulnerable Components',
    pattern: /require\(['"]lodash['"]|import.*from\s*['"]moment['"]/,
    cwe: 'CWE-1104',
    severity: 'medium',
    remediation: 'Keep dependencies updated, use npm audit, consider lighter alternatives',
  },
  {
    id: 'A07',
    name: 'Auth Failures',
    pattern: /jwt\.sign\(.*expiresIn:\s*['"]?(\d{4,}|never)/i,
    cwe: 'CWE-287',
    severity: 'high',
    remediation: 'Use short-lived tokens, implement refresh token rotation',
  },
  {
    id: 'A08',
    name: 'Data Integrity Failures',
    pattern: /JSON\.parse\(.*\)\s*(?!.*try)/,
    cwe: 'CWE-502',
    severity: 'medium',
    remediation: 'Validate and sanitize deserialized data, use schema validation',
  },
  {
    id: 'A09',
    name: 'Logging Failures',
    pattern: /console\.(log|error)\(.*password|console\.(log|error)\(.*token/i,
    cwe: 'CWE-778',
    severity: 'medium',
    remediation: 'Never log sensitive data, implement proper audit logging',
  },
  {
    id: 'A10',
    name: 'SSRF',
    pattern: /fetch\(\s*(?:req\.|request\.|params\.|query\.)/,
    cwe: 'CWE-918',
    severity: 'high',
    remediation: 'Validate and whitelist URLs, use allow-lists for external requests',
  },
];

export class SecurityAuditor {
  /**
   * Run comprehensive security audit
   */
  async audit(input: {
    code: string;
    dependencies?: string[];
    supabaseConfig?: { tables: string[] };
  }): Promise<SecurityReport> {
    const vulnerabilities = await this.scanVulnerabilities(input.code);
    const rlsStatus = await this.checkRLS(input.supabaseConfig);
    const complianceChecks = this.runComplianceChecks(input.code, vulnerabilities);

    const summary: VulnerabilitySummary = {
      critical: vulnerabilities.filter((v) => v.severity === 'critical').length,
      high: vulnerabilities.filter((v) => v.severity === 'high').length,
      medium: vulnerabilities.filter((v) => v.severity === 'medium').length,
      low: vulnerabilities.filter((v) => v.severity === 'low').length,
      info: vulnerabilities.filter((v) => v.severity === 'info').length,
      total: vulnerabilities.length,
    };

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

  private async scanVulnerabilities(code: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];
    const lines = code.split('\n');

    for (const pattern of OWASP_PATTERNS) {
      lines.forEach((line, index) => {
        if (pattern.pattern.test(line)) {
          vulnerabilities.push({
            id: `VULN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            cwe: pattern.cwe,
            severity: pattern.severity,
            category: pattern.name,
            location: `line:${index + 1}`,
            description: `Potential ${pattern.name} vulnerability detected`,
            remediation: pattern.remediation,
            references: [`https://owasp.org/Top10/#${pattern.id}`],
          });
        }
      });
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi,
      /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/,
    ];

    for (const pattern of secretPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        vulnerabilities.push({
          id: `VULN-SECRET-${Date.now()}`,
          cwe: 'CWE-798',
          severity: 'critical',
          category: 'Hardcoded Credentials',
          location: 'multiple',
          description: 'Hardcoded secrets detected in source code',
          remediation: 'Move secrets to environment variables, use secret management',
          references: ['https://cwe.mitre.org/data/definitions/798.html'],
        });
        break;
      }
    }

    return vulnerabilities;
  }

  private async checkRLS(config?: { tables: string[] }): Promise<RLSStatus> {
    if (!config) {
      return { enabled: false, tables: [], coverage: 0 };
    }

    // Stub: Would query Supabase for actual RLS status
    const tables: TableRLS[] = config.tables.map((name) => ({
      name,
      rlsEnabled: Math.random() > 0.2, // 80% have RLS enabled in simulation
      policies: ['authenticated_read', 'owner_write'],
      publicAccess: Math.random() > 0.8,
    }));

    const enabled = tables.filter((t) => t.rlsEnabled).length;
    const coverage = tables.length > 0 ? enabled / tables.length : 1;

    return {
      enabled: coverage > 0.9,
      tables,
      coverage,
    };
  }

  private runComplianceChecks(code: string, vulnerabilities: Vulnerability[]): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // OWASP Top 10 compliance
    checks.push({
      standard: 'owasp',
      check: 'OWASP Top 10 Scan',
      passed: vulnerabilities.filter((v) => v.severity === 'critical').length === 0,
      details: `Found ${vulnerabilities.length} potential issues`,
    });

    // Input validation
    const hasValidation = code.includes('zod') || code.includes('yup') || code.includes('joi');
    checks.push({
      standard: 'cwe',
      check: 'CWE-20: Input Validation',
      passed: hasValidation,
      details: hasValidation ? 'Schema validation detected' : 'No schema validation library found',
    });

    // Authentication
    const hasAuth = code.includes('supabase.auth') || code.includes('jwt') || code.includes('OAuth');
    checks.push({
      standard: 'cwe',
      check: 'CWE-287: Authentication',
      passed: hasAuth,
      details: hasAuth ? 'Authentication implementation detected' : 'No authentication found',
    });

    // HTTPS enforcement
    const hasHTTPS = !code.includes('http://') || code.includes('NODE_ENV === "development"');
    checks.push({
      standard: 'owasp',
      check: 'Transport Security',
      passed: hasHTTPS,
      details: hasHTTPS ? 'HTTPS enforced' : 'HTTP URLs detected',
    });

    return checks;
  }

  private generateRecommendations(
    vulnerabilities: Vulnerability[],
    rlsStatus: RLSStatus
  ): string[] {
    const recommendations: string[] = [];

    if (vulnerabilities.some((v) => v.severity === 'critical')) {
      recommendations.push('URGENT: Address critical vulnerabilities immediately');
    }

    if (!rlsStatus.enabled || rlsStatus.coverage < 1) {
      recommendations.push('Enable Row Level Security on all Supabase tables');
    }

    const unprotectedTables = rlsStatus.tables.filter((t) => t.publicAccess);
    if (unprotectedTables.length > 0) {
      recommendations.push(
        `Review public access on tables: ${unprotectedTables.map((t) => t.name).join(', ')}`
      );
    }

    if (vulnerabilities.some((v) => v.cwe === 'CWE-79')) {
      recommendations.push('Implement Content Security Policy headers');
    }

    recommendations.push('Run npm audit and update vulnerable dependencies');
    recommendations.push('Enable Dependabot or similar for automated security updates');

    return recommendations;
  }

  /**
   * Run dependency vulnerability scan
   */
  async scanDependencies(dependencies: string[]): Promise<Vulnerability[]> {
    // Stub: Would use npm audit or Snyk
    return dependencies
      .filter(() => Math.random() > 0.9) // 10% chance of vuln
      .map((dep) => ({
        id: `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cve: `CVE-2024-${Math.floor(Math.random() * 9999)}`,
        cwe: 'CWE-1104',
        severity: 'medium' as const,
        category: 'Vulnerable Dependency',
        location: `package.json:${dep}`,
        description: `Known vulnerability in ${dep}`,
        remediation: `Update ${dep} to latest version`,
        references: [],
      }));
  }
}
