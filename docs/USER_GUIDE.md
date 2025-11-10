# 📖 Lumen-Orca User Guide

**Welcome to Lumen-Orca!** This guide will help you understand and use the multi-agent orchestration system.

---

## 🎯 What is Lumen-Orca?

Lumen-Orca is an **intelligent orchestration dashboard** that coordinates multiple AI agents to achieve extremely high reliability (99.9999% - "six nines") in software development tasks. Think of it as a mission control center for autonomous AI agents working together.

### Key Features
- 🤖 **Multi-Agent Orchestration**: Coordinate 11 specialized AI agents (A0-A10)
- 📊 **Real-Time Monitoring**: Track agent health, performance, and reliability metrics
- 💰 **Cost Management**: Monitor and control LLM provider usage and budgets
- 🔐 **Secure Authentication**: Email/password and Google OAuth login
- 📈 **Quality Metrics**: Track coverage, mutation scores, and reliability
- 🎨 **Modern UI**: Beautiful, responsive dashboard built with React

---

## 🚀 Getting Started

### 1. Access Lumen-Orca

**Production URL**: https://lumenorca.app/

The application is hosted on Lovable Cloud with Supabase backend infrastructure.

### 2. Create an Account

#### Option A: Email/Password
1. Visit https://lumenorca.app/auth
2. Click **"Sign Up"**
3. Enter your email address
4. Create a secure password
5. Click **"Create Account"**
6. Check your email for verification link
7. Click the link to verify your account

#### Option B: Google OAuth
1. Visit https://lumenorca.app/auth
2. Click **"Sign in with Google"**
3. Select your Google account
4. Grant permissions
5. You'll be automatically redirected to the dashboard

### 3. First Login

After creating your account:
1. You'll be redirected to the **Dashboard** at https://lumenorca.app/dashboard
2. The dashboard shows your orchestration metrics and agent status
3. Explore the navigation menu to access different features

---

## 🎛️ Dashboard Overview

The main dashboard (`/dashboard`) is your command center. Here's what you'll see:

### 📊 Metrics Panel (Top)
Displays key quality metrics with letter grades (AAA/AA/A):

- **Coverage**: Code coverage percentage
- **Mutation Score**: Mutation testing effectiveness
- **Determinism**: Test consistency
- **Flake Rate**: Test reliability
- **F_total**: Overall reliability score (target: ≤ 10⁻⁶)

**Grading System**:
- 🟢 **AAA**: Excellent (90-100%)
- 🟡 **AA**: Good (80-89%)
- 🟠 **A**: Acceptable (70-79%)
- 🔴 **Below A**: Needs improvement

### 🤖 Agent Status Grid (Middle)
Shows the status of all 11 agents:

| Agent | Role | Description |
|-------|------|-------------|
| **A0** | Orchestrator | Coordinates all other agents |
| **A1** | Spec Architect | Analyzes requirements |
| **A2** | Task Planner | Decomposes work into tasks |
| **A3** | Contract Guardian | Validates data schemas |
| **A4** | Code Generator A | Primary code generation |
| **A5** | Code Generator B | Alternative implementation |
| **A6** | QA Harness | Runs tests and validates |
| **A7** | Evidence Collector | Generates quality reports |
| **A8** | Performance Analyst | Checks performance |
| **A9** | Security Scanner | Scans for vulnerabilities |
| **A10** | Incident Responder | Handles failures |

**Status Indicators**:
- 🟢 **Idle**: Agent ready for tasks
- 🔵 **Active**: Agent currently working
- 🟢 **Completed**: Task finished successfully
- 🔴 **Failed**: Task failed (check logs)

### 📈 Orchestration Graph (Bottom)
Visual DAG (Directed Acyclic Graph) showing:
- Task dependencies
- Execution flow
- Current progress
- Completed vs. pending tasks

---

## 🎮 How to Use Lumen-Orca

### Use Case 1: Monitor Agent Orchestrations

1. **Start Orchestration**:
   - Click **"Start Orchestration"** on the dashboard
   - Or navigate to `/agents` and select an agent workflow

2. **Watch Progress**:
   - Agent status grid updates in real-time
   - Progress bars show task completion
   - Click on any agent to see detailed logs

3. **View Results**:
   - Check metrics panel for updated scores
   - Review evidence bundle when complete
   - Download reports for audit trail

### Use Case 2: Configure LLM Providers

Navigate to **Settings** (`/settings`) or **Telemetry** (`/telemetry`):

#### View Provider Health
- **Status**: Healthy 🟢 / Degraded 🟡 / Down 🔴
- **Latency**: Average response time
- **Success Rate**: Request success percentage
- **Last Success**: Timestamp of last successful request

#### Configure Provider Settings
1. Go to **Settings** → **LLM Configurations**
2. Select a provider (Lovable AI, OpenAI, Anthropic, Google)
3. Configure:
   - **Model**: Choose model (e.g., gpt-5, claude-sonnet-4)
   - **Max Tokens**: Token limit per request
   - **Temperature**: Creativity level (0.0-1.0)
   - **Fallback Provider**: Backup if primary fails
4. Click **"Save Configuration"**

#### Set Budgets
1. Go to **Telemetry** → **Budget Settings**
2. For each provider:
   - **Monthly Budget**: Maximum spend per month ($)
   - **Alert Threshold**: When to get alerts (default 80%)
   - **Current Spend**: Shows usage this month
3. System automatically stops at 100% budget

### Use Case 3: Manage Your Profile

Navigate to **Profile** (`/profile`):

#### Update Profile Information
- Email address (verified)
- Display name
- Avatar (optional)
- Bio/description

#### Configure Agent Presets
Create custom agent configurations using numerology:
1. Click **"Create Preset"**
2. Enter a name (e.g., "Fast Testing")
3. Assign numbers (1-9) to agents based on priority
4. Save preset for quick loading

**Numerology Guide**:
- **9**: Highest priority, maximum resources
- **7-8**: High priority, more resources
- **5-6**: Medium priority, balanced
- **3-4**: Lower priority, fewer resources
- **1-2**: Minimal priority, basic execution

### Use Case 4: View Evidence Bundles

Navigate to **Evidence** (`/evidence`):

Evidence bundles contain comprehensive quality reports:

#### What's in an Evidence Bundle?
- ✅ **Test Results**: Unit, property, mutation test outputs
- 📊 **Coverage Reports**: Line, branch, function coverage
- 🔐 **Security Scans**: Vulnerability findings
- ⚡ **Performance Metrics**: Execution times, resource usage
- 📋 **Contract Validation**: Schema compliance checks
- 🏷️ **SBOM**: Software Bill of Materials

#### How to Use Evidence
1. **View Online**: Click any bundle to see HTML report
2. **Download**: Click download button for offline viewing
3. **Share**: Use share link for collaboration
4. **Compare**: Select multiple bundles to compare metrics

### Use Case 5: Monitor Costs and Usage

Navigate to **Telemetry** (`/telemetry`):

#### Usage Logs Table
See all LLM requests:
- **Timestamp**: When request was made
- **Agent**: Which agent made the request
- **Provider**: Which LLM provider was used
- **Model**: Specific model (gpt-5, claude-sonnet-4, etc.)
- **Tokens**: Input + output token count
- **Cost**: Estimated cost for this request
- **Latency**: Response time in milliseconds

#### Filter and Export
- Filter by date range, agent, or provider
- Export to CSV for accounting
- View charts and trends over time

---

## 🔧 Advanced Features

### Custom Agent Workflows

1. Navigate to **Agents** (`/agents`)
2. Click **"Create Custom Workflow"**
3. Select agents to include
4. Define dependencies (which agents depend on others)
5. Set parameters for each agent
6. Save and run workflow

### Agent Presets

Pre-configured workflows for common tasks:

- **🏃 Fast Mode**: Prioritize speed over thoroughness
- **🔒 Security Focus**: Emphasize security scanning
- **🎯 Quality Max**: Maximum quality checks (slower)
- **💰 Cost Optimized**: Minimize LLM costs

Select from dropdown on dashboard to quickly switch modes.

### Monitoring and Alerts

#### Set Up Alerts (Future Feature)
- Email notifications for agent failures
- Slack/Discord webhooks for real-time updates
- Budget threshold warnings
- Performance degradation alerts

---

## 🎨 User Interface Guide

### Navigation Menu

**Main Navigation** (left sidebar or top menu):
- 🏠 **Dashboard**: Main metrics and orchestration view
- 🤖 **Agents**: Agent management and status
- 📋 **Contracts**: Data schema validation
- 📊 **Telemetry**: Usage logs and provider health
- 🗂️ **Evidence**: Quality reports and bundles
- ⚙️ **Settings**: Configuration and preferences
- 👤 **Profile**: User account and presets
- 📖 **User Guide**: This guide!
- 🎬 **Demo**: Interactive demonstration

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `D`: Go to Dashboard
- `A`: Go to Agents
- `E`: Go to Evidence
- `T`: Go to Telemetry
- `?`: Show help

### Dark Mode

Toggle dark mode:
- Click theme toggle in top-right corner
- Or use system preference (auto-detected)

---

## 🐛 Troubleshooting

### Authentication Issues

**Problem**: Can't log in
**Solution**:
1. Check email/password are correct
2. Verify email if newly registered
3. Try "Forgot Password" to reset
4. Clear browser cache and cookies
5. Try incognito/private mode

**Problem**: Google OAuth not working
**Solution**:
1. Ensure pop-ups are not blocked
2. Check you're using correct Google account
3. Try different browser
4. Contact support if persists

### Performance Issues

**Problem**: Dashboard loading slowly
**Solution**:
1. Check internet connection
2. Refresh page (F5 or Ctrl+R)
3. Clear browser cache
4. Check Supabase status: https://status.supabase.com/

**Problem**: Agent tasks stuck "In Progress"
**Solution**:
1. Wait 5 minutes (some tasks are slow)
2. Check provider health in Telemetry
3. Verify budget hasn't been exceeded
4. Try canceling and restarting orchestration

### Provider Errors

**Problem**: All providers showing "Down"
**Solution**:
1. Check provider status pages:
   - OpenAI: https://status.openai.com/
   - Anthropic: https://status.anthropic.com/
2. Verify API keys are configured (admins only)
3. Check budget limits haven't been hit
4. Wait for automatic failover to backup provider

**Problem**: Budget exceeded
**Solution**:
1. Go to Telemetry → Budget Settings
2. Review current spend vs. monthly budget
3. Increase budget limit if appropriate
4. Wait for monthly reset (shown in settings)
5. Contact admin to adjust limits

### Data Not Showing

**Problem**: Metrics not updating
**Solution**:
1. Refresh the page
2. Check if orchestration is actually running
3. Wait a few minutes for processing
4. Check browser console for errors (F12)

**Problem**: Evidence bundles missing
**Solution**:
1. Ensure orchestration completed successfully
2. Check if agent failures occurred
3. Evidence may take time to generate
4. Try re-running orchestration

---

## 📚 Concepts Explained

### What is "Six-Nines Reliability"?

**99.9999%** reliability means:
- Only 1 failure per 1,000,000 operations
- Equivalent to 31.5 seconds of downtime per year
- Calculated using the formula: F_total = 1 - Π(1 - Fᵢ)

Lumen-Orca achieves this through:
- Multiple redundant checks
- Fallback mechanisms
- Comprehensive testing
- Agent disagreement resolution

### What is Multi-Agent Orchestration?

Instead of one AI doing everything, Lumen-Orca uses **11 specialized agents** that:
1. Each focus on specific tasks (requirements, code, testing, security)
2. Work in parallel where possible
3. Verify each other's work (checks and balances)
4. Automatically retry on failures
5. Escalate to humans only when necessary

**Analogy**: Like a surgical team where each member has a specific role (surgeon, anesthesiologist, nurse) working together for best outcomes.

### What are Evidence Bundles?

Comprehensive reports that prove work was done correctly:
- All test results (unit, integration, mutation)
- Coverage reports showing what code was tested
- Security scans showing no vulnerabilities
- Performance benchmarks
- Data contract validation
- Software Bill of Materials (SBOM)

**Why?** For audit trails, compliance, and trust in autonomous systems.

### What is a DAG (Directed Acyclic Graph)?

The workflow visualization showing:
- **Nodes**: Individual tasks or agents
- **Edges**: Dependencies (arrows from one task to another)
- **Acyclic**: No circular dependencies (prevents infinite loops)

**Example**:
```
A1 (Spec) → A2 (Plan) → A3 (Contract)
                ↓
              A4 (Code) → A6 (Test) → A7 (Evidence)
                ↓
              A5 (Code Alt)
```

---

## 🎓 Best Practices

### For Daily Use

1. **Check Dashboard Daily**
   - Review agent health before starting work
   - Monitor budget usage
   - Check for any failed orchestrations

2. **Use Presets for Common Tasks**
   - Create and save presets for recurring workflows
   - Share presets with team members
   - Document what each preset does

3. **Review Evidence Bundles**
   - Don't just trust metrics - look at evidence
   - Check for unexpected failures or warnings
   - Keep bundles for compliance/audit

4. **Monitor Costs**
   - Set conservative budget limits initially
   - Review usage patterns weekly
   - Optimize by choosing cheaper providers when quality is similar

### For Teams

1. **Establish Naming Conventions**
   - Consistent names for presets
   - Clear orchestration descriptions
   - Organized evidence bundle tags

2. **Set Up Shared Presets**
   - Team-wide quality settings
   - Agreed-upon agent priorities
   - Consistent configurations

3. **Regular Reviews**
   - Weekly check-ins on metrics trends
   - Monthly cost reviews
   - Quarterly optimization sessions

4. **Document Incidents**
   - Note any unusual failures
   - Share solutions that worked
   - Update presets based on learnings

---

## 🔐 Security & Privacy

### Your Data is Secure

- ✅ **Encrypted**: All data encrypted in transit (HTTPS) and at rest
- ✅ **Row-Level Security**: You can only see your own data
- ✅ **Authentication**: Secure JWT tokens with auto-refresh
- ✅ **No PII Logging**: Personal information not logged in LLM requests
- ✅ **Regular Backups**: Automatic database backups (Supabase)

### Permissions

**User Roles**:
- **Viewer**: Read-only access to dashboard and evidence
- **Operator**: Can run orchestrations and modify settings
- **Admin**: Full access including user management and budgets

### API Keys

- Never share your session tokens
- API keys for LLM providers are managed by admins only
- Tokens expire after inactivity
- Use strong passwords and 2FA when available

---

## 💡 Tips & Tricks

### Productivity Tips

1. **Use Keyboard Shortcuts**: Navigate faster with hotkeys
2. **Bookmark Key Pages**: Save direct links to frequently used pages
3. **Set Up Notifications**: Get alerts for important events (when available)
4. **Customize Dashboard**: Arrange widgets to suit your workflow

### Cost Optimization

1. **Use Cheaper Models**: For non-critical tasks, use lite/flash models
2. **Set Conservative Budgets**: Prevents surprise bills
3. **Review Usage Patterns**: Identify expensive operations
4. **Use Caching**: Enable response caching when appropriate

### Quality Improvement

1. **Aim for AAA Grades**: Strive for 90%+ on all metrics
2. **Investigate Failures**: Don't ignore red indicators
3. **Compare Evidence**: Look at trends over time
4. **Iterate Configurations**: Fine-tune agent settings

---

## 📞 Getting Help

### Documentation

- 📖 **User Guide**: This document
- 🏗️ **Architecture**: `docs/blueprints/lumen_master_blueprint.md`
- 🚀 **Launch Checklist**: `LAUNCH_CHECKLIST.md`
- 🆘 **Incident Response**: `docs/INCIDENT_RESPONSE.md`
- ✅ **Production Readiness**: `docs/PRODUCTION_READINESS.md`

### Support Channels

**For Users**:
- In-app help: Click `?` icon in top-right
- User guide: Navigate to `/guide`
- Demo: Navigate to `/demo` for interactive tutorial

**For Developers**:
- GitHub Issues: https://github.com/hwinnwin/Lumen-Orca/issues
- GitHub Discussions: https://github.com/hwinnwin/Lumen-Orca/discussions
- Email support: support@lumenorca.app (if configured)

**Emergency**:
- Check status: Health endpoint shows system status
- Supabase status: https://status.supabase.com/
- Provider status: Check individual provider status pages

### FAQ

**Q: Is there a mobile app?**
A: Not yet, but the web app is fully responsive and works on mobile browsers.

**Q: Can I use Lumen-Orca offline?**
A: No, it requires internet connection to communicate with LLM providers.

**Q: How much does it cost?**
A: Lumen-Orca itself is free. You pay only for LLM API usage from providers.

**Q: Can I self-host Lumen-Orca?**
A: Yes! See development setup instructions in `README.md`.

**Q: What browsers are supported?**
A: Modern browsers: Chrome, Firefox, Safari, Edge (latest versions).

**Q: Can I export my data?**
A: Yes! Export usage logs as CSV, download evidence bundles as HTML.

**Q: Is there an API?**
A: Currently internal only. Public API planned for future release.

---

## 🗺️ Roadmap & Future Features

### Coming Soon (Phase II)

- ✨ **Real Agent Execution**: Fully autonomous agent operations
- 🔄 **Continuous Learning**: Agents learn from past executions
- 📧 **Email Notifications**: Alerts for failures and budget warnings
- 🔗 **GitHub Integration**: Direct PR creation and reviews
- 📱 **Mobile App**: Native iOS and Android apps
- 🎙️ **Voice Commands**: Control orchestrations by voice
- 🤝 **Team Collaboration**: Shared workspaces and presets
- 📊 **Advanced Analytics**: Deeper insights and predictions

### Long-Term Vision

- 🌍 **Multi-Language Support**: UI in multiple languages
- 🔌 **Plugin System**: Extend with custom agents
- 🏢 **Enterprise Features**: SSO, audit logs, compliance reports
- 🤖 **Custom Agents**: Train your own specialized agents
- 🎨 **Theme Marketplace**: Community-created themes

---

## 📝 Changelog

### Version 1.0.0 (2025-11-10) - Production Launch 🚀

**New Features**:
- ✅ Complete dashboard with real-time metrics
- ✅ Multi-provider LLM system (4 providers)
- ✅ User authentication (email + Google OAuth)
- ✅ Evidence bundle generation and viewing
- ✅ Budget tracking and cost management
- ✅ Provider health monitoring
- ✅ Agent status visualization
- ✅ Security headers and rate limiting
- ✅ Error boundary for graceful failures
- ✅ Comprehensive documentation

**Infrastructure**:
- ✅ Supabase backend (PostgreSQL + Auth + Edge Functions)
- ✅ Lovable Cloud deployment
- ✅ GitHub Actions CI/CD
- ✅ Health check endpoint
- ✅ Rate limiting (60 req/min)

**Documentation**:
- ✅ User Guide (this document)
- ✅ Production Readiness assessment
- ✅ Incident Response plan
- ✅ Launch Checklist
- ✅ Architecture blueprints

---

## 🎉 Welcome to Lumen-Orca!

You're now ready to use the world's first six-nines multi-agent orchestration system.

**Start exploring**:
1. Visit the [Dashboard](https://lumenorca.app/dashboard)
2. Try the [Demo](https://lumenorca.app/demo)
3. Create your first orchestration
4. Monitor your agents in action

**Questions?** Visit `/guide` in the app or check the FAQ above.

**Happy orchestrating!** 🚀

---

*Last Updated: 2025-11-10 | Version 1.0.0*
