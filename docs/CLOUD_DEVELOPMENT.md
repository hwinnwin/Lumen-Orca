# Cloud Development Guide

Work on Lumen-Orca from anywhere - mobile, tablet, or any browser.

## Quick Start Options

### 1. GitHub Codespaces (Recommended)

The fastest way to start - works on mobile!

**One-Click Launch:**
```
https://github.com/codespaces/new?repo=hwinnwin/Lumen-Orca
```

**Or from GitHub:**
1. Go to the repository
2. Click the green "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on main"

**Mobile Access:**
- Download GitHub Mobile app
- Open your codespace from the app
- Full VS Code experience in browser

### 2. Gitpod

Alternative cloud IDE with generous free tier.

**One-Click Launch:**
```
https://gitpod.io/#https://github.com/hwinnwin/Lumen-Orca
```

**Features:**
- 50 hours/month free
- Prebuilt workspaces for fast start
- Works on any device with a browser

### 3. StackBlitz (Instant Start)

For quick edits and prototyping.

**One-Click Launch:**
```
https://stackblitz.com/github/hwinnwin/Lumen-Orca
```

## Development Workflow

### Starting the Dev Server

```bash
# In the cloud terminal:
pnpm dev
```

The preview will open automatically. On Codespaces, click the "Open in Browser" notification.

### Running Tests

```bash
pnpm test          # Run all tests
pnpm test:unit     # Unit tests only
pnpm test:e2e      # End-to-end tests
```

### Building for Production

```bash
pnpm build
```

## Team Collaboration

### Sharing Your Workspace

**Codespaces:**
1. Click "Share" in the bottom status bar
2. Choose "Share with repository collaborators"
3. Team members can join your live session

**Gitpod:**
1. Click your avatar → "Share Workspace"
2. Copy and share the link

### Parallel Development

Multiple team members can work simultaneously:

1. Each person creates their own codespace
2. Work on different features/branches
3. Push changes to GitHub
4. Create PRs for review

### Mobile Development Tips

1. **Use GitHub Mobile** for quick code reviews
2. **Codespaces mobile view** works well for small edits
3. **Voice typing** helps on mobile keyboards
4. **External keyboard** dramatically improves experience

## Environment Variables

Required environment variables for full functionality:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Setting in Codespaces:**
1. Go to repo Settings → Secrets and variables → Codespaces
2. Add your secrets
3. Secrets are automatically available in new codespaces

**Setting in Gitpod:**
1. Go to gitpod.io/user/variables
2. Add variables scoped to hwinnwin/Lumen-Orca

## Project Structure Quick Reference

```
Lumen-Orca/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── lib/               # Utilities and services
│   └── hooks/             # React hooks
├── packages/
│   ├── agents/            # A0-A11 agent implementations
│   ├── contracts/         # Type contracts
│   ├── qa/               # Quality assurance tools
│   └── evidence/         # Evidence bundle generation
├── supabase/
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
└── docs/                  # Documentation
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `docs/OPERATIONAL_STATUS.md` | Current system status |
| `packages/agents/src/A11_meta_learner.ts` | Self-improvement engine |
| `src/lib/prompt-optimizer.ts` | Prompt A/B testing |
| `src/lib/feedback-service.ts` | Human feedback collection |

## Troubleshooting

### Codespace Won't Start
- Check GitHub status page
- Try a different machine type (4-core recommended)

### Dependencies Fail to Install
- Run `pnpm install --prefer-offline`
- Clear cache: `pnpm store prune`

### Port Not Forwarding
- Check Ports tab in VS Code
- Manually forward port 5173

### Slow Performance
- Use 4-core codespace for better performance
- Close unused browser tabs
- Disable unnecessary extensions

## Cost Optimization

**Free Tiers:**
- GitHub Codespaces: 60 core-hours/month free
- Gitpod: 50 hours/month free

**Tips to Save Hours:**
- Stop codespaces when not in use
- Use 2-core for simple edits
- Use 4-core for builds and tests

---

**Need help?** Open an issue on GitHub or reach out to the team.
