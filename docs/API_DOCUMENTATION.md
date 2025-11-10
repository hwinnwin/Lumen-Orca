# 🔌 Lumen-Orca API Documentation

**Version**: 1.0.0
**Base URL**: `https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1`

Lumen-Orca provides a powerful API for embedding multi-agent orchestration into your coding tools, IDEs, CI/CD pipelines, and development workflows.

---

## 🎯 Use Cases

### Perfect for Integrating Into:
- 🔧 **IDEs & Code Editors**: VS Code, IntelliJ, Cursor, etc.
- 🤖 **AI Coding Assistants**: GitHub Copilot, Cody, Continue, etc.
- 🔄 **CI/CD Pipelines**: GitHub Actions, GitLab CI, Jenkins, etc.
- 📝 **Documentation Tools**: Auto-generate quality reports
- 🧪 **Testing Frameworks**: Enhanced test orchestration
- 📊 **Code Review Tools**: Automated quality checks
- 🏗️ **Build Tools**: Intelligent build optimization

---

## 🔑 Authentication

All API endpoints require authentication using Supabase JWT tokens.

### Get an Access Token

```javascript
// Using Supabase JS Client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://znkkpibjlifhqvtnghsd.supabase.co',
  'YOUR_ANON_KEY'
)

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'your-password'
})

const accessToken = data.session.access_token
```

### Use Token in API Calls

```bash
curl -X POST https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/llm-proxy \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentRole": "A1_spec", "prompt": "Analyze this code..."}'
```

---

## 📡 Core API Endpoints

### 1. LLM Proxy (Multi-Provider Routing)

Route LLM requests through multiple providers with automatic fallback.

**Endpoint**: `POST /llm-proxy`

**Request Body**:
```json
{
  "agentRole": "A1_spec",
  "prompt": "Analyze this code for potential bugs",
  "systemPrompt": "You are an expert code reviewer",
  "taskId": "task-123"
}
```

**Response**:
```json
{
  "result": "Based on my analysis, I found 3 potential issues...",
  "usage": {
    "provider": "lovable-ai",
    "model": "google/gemini-2.5-flash",
    "tokensInput": 250,
    "tokensOutput": 500,
    "estimatedCost": 0.0075,
    "latencyMs": 1234
  }
}
```

**Features**:
- ✅ Automatic provider fallback if primary fails
- ✅ Cost tracking per request
- ✅ Health monitoring and circuit breaking
- ✅ Budget enforcement (stops at 100%)
- ✅ Rate limiting (60 req/min per user)

**Supported Providers**:
- `lovable-ai` - Default, cost-effective
- `openai` - GPT models
- `anthropic` - Claude models
- `google` - Gemini models

**Example Integration**:
```typescript
// TypeScript SDK
class LumenOrcaClient {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async analyzeCode(code: string, agentRole: string = 'A1_spec') {
    const { data, error } = await this.supabase.functions.invoke('llm-proxy', {
      body: {
        agentRole,
        prompt: `Analyze this code:\n\n${code}`,
        systemPrompt: 'You are an expert code analyzer'
      }
    })

    if (error) throw error
    return data
  }
}

// Usage
const client = new LumenOrcaClient(SUPABASE_URL, SUPABASE_KEY)
const analysis = await client.analyzeCode(codeSnippet, 'A1_spec')
console.log(analysis.result)
```

---

### 2. Health Check

Check system health, provider status, and database connectivity.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T21:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "latency_ms": 45
    },
    "providers": {
      "status": "ok",
      "healthy": 4,
      "total": 4,
      "details": [
        {
          "provider": "lovable-ai",
          "status": "healthy",
          "last_success_at": "2025-11-10T20:59:30Z",
          "consecutive_failures": 0
        }
      ]
    }
  },
  "uptime_seconds": 86400
}
```

**Use Cases**:
- Pre-flight checks before operations
- Monitoring dashboards
- Circuit breaker implementations
- Status pages

---

### 3. Track Activity

Log custom activity and usage events.

**Endpoint**: `POST /track-activity`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "event": "code_analysis_complete",
  "metadata": {
    "linesOfCode": 150,
    "issues": 3,
    "duration": 2500
  }
}
```

**Response**:
```json
{
  "success": true,
  "eventId": "evt-abc123"
}
```

---

### 4. User Info

Get or update user profile information.

**Endpoint**: `GET /user-info`

**Response**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "created_at": "2025-11-01T12:00:00Z",
  "profile": {
    "displayName": "John Developer",
    "agentPresets": [
      {
        "name": "Fast Mode",
        "agents": { "A1": 5, "A2": 5, "A6": 9 }
      }
    ]
  }
}
```

---

## 🛠️ SDKs & Integration Examples

### JavaScript/TypeScript SDK

```typescript
// lumen-orca-sdk.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface LumenOrcaConfig {
  supabaseUrl: string
  supabaseKey: string
}

export interface AnalysisRequest {
  code: string
  agentRole?: string
  taskId?: string
}

export interface AnalysisResult {
  result: string
  usage: {
    provider: string
    model: string
    tokensInput: number
    tokensOutput: number
    estimatedCost: number
    latencyMs: number
  }
}

export class LumenOrca {
  private supabase: SupabaseClient

  constructor(config: LumenOrcaConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    const { data, error } = await this.supabase.functions.invoke('llm-proxy', {
      body: {
        agentRole: request.agentRole || 'A1_spec',
        prompt: `Analyze this code:\n\n${request.code}`,
        taskId: request.taskId
      }
    })

    if (error) throw new Error(`Analysis failed: ${error.message}`)
    return data as AnalysisResult
  }

  async checkHealth(): Promise<any> {
    const response = await fetch(
      `${this.supabase.supabaseUrl}/functions/v1/health`
    )
    return response.json()
  }

  async getProviderHealth(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('provider_health')
      .select('*')

    if (error) throw error
    return data
  }

  async getBudgetStatus(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('budget_settings')
      .select('*')

    if (error) throw error
    return data
  }
}

// Usage Example
const lumen = new LumenOrca({
  supabaseUrl: 'https://znkkpibjlifhqvtnghsd.supabase.co',
  supabaseKey: 'YOUR_KEY'
})

const result = await lumen.analyzeCode({
  code: 'function add(a, b) { return a + b }',
  agentRole: 'A1_spec'
})

console.log(result.result)
console.log(`Cost: $${result.usage.estimatedCost}`)
```

### Python SDK

```python
# lumen_orca_sdk.py
import requests
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class LumenOrcaConfig:
    supabase_url: str
    supabase_key: str
    access_token: str

class LumenOrca:
    def __init__(self, config: LumenOrcaConfig):
        self.config = config
        self.base_url = f"{config.supabase_url}/functions/v1"
        self.headers = {
            "Authorization": f"Bearer {config.access_token}",
            "Content-Type": "application/json",
            "apikey": config.supabase_key
        }

    def analyze_code(
        self,
        code: str,
        agent_role: str = "A1_spec",
        task_id: Optional[str] = None
    ) -> Dict:
        """Analyze code using specified agent."""
        response = requests.post(
            f"{self.base_url}/llm-proxy",
            headers=self.headers,
            json={
                "agentRole": agent_role,
                "prompt": f"Analyze this code:\n\n{code}",
                "taskId": task_id
            }
        )
        response.raise_for_status()
        return response.json()

    def check_health(self) -> Dict:
        """Check system health."""
        response = requests.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

# Usage Example
lumen = LumenOrca(
    LumenOrcaConfig(
        supabase_url="https://znkkpibjlifhqvtnghsd.supabase.co",
        supabase_key="YOUR_KEY",
        access_token="YOUR_ACCESS_TOKEN"
    )
)

result = lumen.analyze_code("def add(a, b): return a + b")
print(result["result"])
print(f"Cost: ${result['usage']['estimatedCost']}")
```

### VS Code Extension Example

```typescript
// extension.ts
import * as vscode from 'vscode'
import { LumenOrca } from './lumen-orca-sdk'

export function activate(context: vscode.ExtensionContext) {
  const lumen = new LumenOrca({
    supabaseUrl: vscode.workspace.getConfiguration('lumenOrca').get('supabaseUrl'),
    supabaseKey: vscode.workspace.getConfiguration('lumenOrca').get('apiKey')
  })

  // Command: Analyze current file
  const analyzeCommand = vscode.commands.registerCommand(
    'lumenOrca.analyzeFile',
    async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return

      const code = editor.document.getText()
      const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: 'Lumen-Orca: Analyzing code...',
        cancellable: false
      }

      await vscode.window.withProgress(progressOptions, async () => {
        try {
          const result = await lumen.analyzeCode({
            code,
            agentRole: 'A1_spec'
          })

          // Show results in panel
          const panel = vscode.window.createWebviewPanel(
            'lumenOrcaResults',
            'Lumen-Orca Analysis',
            vscode.ViewColumn.Two,
            {}
          )

          panel.webview.html = getResultsHtml(result)
        } catch (error) {
          vscode.window.showErrorMessage(`Analysis failed: ${error}`)
        }
      })
    }
  )

  context.subscriptions.push(analyzeCommand)
}

function getResultsHtml(result: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .result { background: #f4f4f4; padding: 15px; border-radius: 5px; }
          .usage { margin-top: 15px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Code Analysis Results</h1>
        <div class="result">${result.result}</div>
        <div class="usage">
          Provider: ${result.usage.provider} |
          Cost: $${result.usage.estimatedCost.toFixed(4)} |
          Latency: ${result.usage.latencyMs}ms
        </div>
      </body>
    </html>
  `
}
```

### GitHub Action Example

```yaml
# .github/workflows/lumen-orca-check.yml
name: Lumen-Orca Quality Check

on:
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Analyze with Lumen-Orca
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          ACCESS_TOKEN: ${{ secrets.LUMEN_ACCESS_TOKEN }}
        run: |
          # Get changed files
          FILES=$(git diff --name-only origin/main HEAD | grep '\.ts$\|\.js$')

          # Analyze each file
          for file in $FILES; do
            echo "Analyzing $file..."

            CODE=$(cat $file)

            # Call Lumen-Orca API
            RESULT=$(curl -X POST \
              "$SUPABASE_URL/functions/v1/llm-proxy" \
              -H "Authorization: Bearer $ACCESS_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{
                \"agentRole\": \"A1_spec\",
                \"prompt\": \"Analyze this code:\n\n$CODE\"
              }")

            echo "Results: $RESULT"
          done

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: '✅ Lumen-Orca analysis complete! Check workflow logs for details.'
            })
```

---

## 🔌 Direct Database Access

For advanced integrations, you can query the database directly using Supabase client.

### Get Provider Health

```typescript
const { data: providers } = await supabase
  .from('provider_health')
  .select('*')

console.log(providers)
// [{provider: 'openai', status: 'healthy', ...}, ...]
```

### Get Usage Logs

```typescript
const { data: logs } = await supabase
  .from('llm_usage_logs')
  .select('*')
  .eq('agent_role', 'A1_spec')
  .order('created_at', { ascending: false })
  .limit(10)

console.log(logs)
```

### Get Budget Status

```typescript
const { data: budgets } = await supabase
  .from('budget_settings')
  .select('*')

budgets.forEach(budget => {
  const percentUsed = (budget.current_spend / budget.monthly_budget) * 100
  console.log(`${budget.provider}: ${percentUsed.toFixed(1)}% used`)
})
```

---

## 📊 Rate Limiting

All API endpoints enforce rate limiting to prevent abuse.

**Limits**:
- **LLM Proxy**: 60 requests per minute per user
- **Health Check**: No limit (public endpoint)
- **Track Activity**: 120 requests per minute per user
- **User Info**: 30 requests per minute per user

**Headers**:
```
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-11-10T21:05:00Z
Retry-After: 30
```

**429 Response**:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

**Best Practices**:
- Implement exponential backoff
- Cache responses when possible
- Use webhooks instead of polling
- Monitor rate limit headers

---

## 🔐 Security Best Practices

### API Key Management

```typescript
// ❌ DON'T: Hardcode keys
const apiKey = 'eyJhbGci...'

// ✅ DO: Use environment variables
const apiKey = process.env.SUPABASE_KEY

// ✅ DO: Use secret management
const apiKey = await secretManager.get('SUPABASE_KEY')
```

### Token Refresh

```typescript
// Automatically refresh expired tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed automatically')
  }
})
```

### Row-Level Security

All database queries automatically enforce RLS policies:
- Users can only see their own data
- Admins can see all data
- Service role bypasses RLS (use carefully)

---

## 🚀 Advanced Use Cases

### 1. Custom Code Review Bot

```typescript
// review-bot.ts
import { Octokit } from '@octokit/rest'
import { LumenOrca } from './lumen-orca-sdk'

class CodeReviewBot {
  private github: Octokit
  private lumen: LumenOrca

  async reviewPullRequest(owner: string, repo: string, prNumber: number) {
    // Get PR files
    const { data: files } = await this.github.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    })

    const reviews = []

    // Analyze each file
    for (const file of files) {
      if (file.patch) {
        const result = await this.lumen.analyzeCode({
          code: file.patch,
          agentRole: 'A9_security'
        })

        reviews.push({
          path: file.filename,
          body: result.result,
          position: 1
        })
      }
    }

    // Post review
    await this.github.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body: 'Lumen-Orca automated review complete!',
      event: 'COMMENT',
      comments: reviews
    })
  }
}
```

### 2. IDE Inline Diagnostics

```typescript
// ide-diagnostics.ts
import { LumenOrca } from './lumen-orca-sdk'

class InlineDiagnostics {
  private lumen: LumenOrca

  async getDiagnostics(code: string, filepath: string) {
    const result = await this.lumen.analyzeCode({
      code,
      agentRole: 'A1_spec'
    })

    // Parse issues from result
    const issues = this.parseIssues(result.result)

    // Return in LSP diagnostic format
    return issues.map(issue => ({
      range: {
        start: { line: issue.line, character: issue.column },
        end: { line: issue.line, character: issue.column + issue.length }
      },
      severity: issue.severity, // Error, Warning, Info
      message: issue.message,
      source: 'lumen-orca'
    }))
  }

  private parseIssues(result: string) {
    // Parse LLM response into structured issues
    // Implementation depends on your prompt design
    return []
  }
}
```

### 3. CI/CD Quality Gate

```typescript
// quality-gate.ts
import { LumenOrca } from './lumen-orca-sdk'

class QualityGate {
  private lumen: LumenOrca

  async checkQuality(codebase: string[]): Promise<boolean> {
    let totalScore = 0

    for (const file of codebase) {
      const result = await this.lumen.analyzeCode({
        code: file,
        agentRole: 'A6_qa_harness'
      })

      const score = this.calculateQualityScore(result.result)
      totalScore += score
    }

    const averageScore = totalScore / codebase.length

    // Pass if average score >= 80%
    const passed = averageScore >= 0.80

    console.log(`Quality Gate: ${passed ? 'PASSED' : 'FAILED'}`)
    console.log(`Average Score: ${(averageScore * 100).toFixed(1)}%`)

    return passed
  }

  private calculateQualityScore(analysis: string): number {
    // Parse analysis and calculate score
    // Implementation depends on your grading system
    return 0.85
  }
}
```

---

## 📈 Monitoring & Observability

### Track API Usage

```typescript
// Create custom monitoring
class LumenMonitor {
  private lumen: LumenOrca

  async getUsageStats(startDate: Date, endDate: Date) {
    const { data: logs } = await this.lumen.supabase
      .from('llm_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    return {
      totalRequests: logs.length,
      totalCost: logs.reduce((sum, log) => sum + log.estimated_cost, 0),
      averageLatency: logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length,
      byProvider: this.groupBy(logs, 'provider'),
      byAgent: this.groupBy(logs, 'agent_role')
    }
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((result, item) => {
      (result[item[key]] = result[item[key]] || []).push(item)
      return result
    }, {})
  }
}
```

---

## 🐛 Error Handling

```typescript
import { LumenOrca } from './lumen-orca-sdk'

class RobustClient {
  private lumen: LumenOrca
  private maxRetries = 3

  async analyzeWithRetry(code: string, retries = 0): Promise<any> {
    try {
      return await this.lumen.analyzeCode({ code })
    } catch (error: any) {
      // Handle rate limiting
      if (error.message.includes('Rate limit') && retries < this.maxRetries) {
        const retryAfter = parseInt(error.retryAfter || '60')
        console.log(`Rate limited. Retrying in ${retryAfter}s...`)
        await this.sleep(retryAfter * 1000)
        return this.analyzeWithRetry(code, retries + 1)
      }

      // Handle provider failures
      if (error.message.includes('provider') && retries < this.maxRetries) {
        console.log(`Provider failed. Retrying...`)
        await this.sleep(2000)
        return this.analyzeWithRetry(code, retries + 1)
      }

      // Handle budget exceeded
      if (error.message.includes('budget')) {
        throw new Error('Monthly budget exceeded. Please increase budget or wait for reset.')
      }

      throw error
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

---

## 📞 Support & Resources

### Documentation
- 📖 **User Guide**: `docs/USER_GUIDE.md`
- 🏗️ **Architecture**: `docs/blueprints/lumen_master_blueprint.md`
- 🚀 **Launch Checklist**: `LAUNCH_CHECKLIST.md`

### Community
- 💬 **GitHub Discussions**: https://github.com/hwinnwin/Lumen-Orca/discussions
- 🐛 **Issues**: https://github.com/hwinnwin/Lumen-Orca/issues

### Status
- 🟢 **System Health**: `https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health`
- 📊 **Supabase Status**: https://status.supabase.com/

---

## 🎉 Start Building!

You now have everything you need to integrate Lumen-Orca into your coding tools!

**Next Steps**:
1. Get your API credentials from the dashboard
2. Install the SDK or use direct API calls
3. Start with the health check endpoint
4. Build your first integration
5. Share your integration with the community!

**Questions?** Open an issue or discussion on GitHub.

**Happy coding!** 🚀

---

*Last Updated: 2025-11-10 | Version 1.0.0*
*API Base URL: https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1*
