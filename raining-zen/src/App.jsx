import { useState } from 'react'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'market', label: 'Market' },
  { id: 'product', label: 'Product' },
  { id: 'tech', label: 'Technology' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'team', label: 'Team & Budget' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'gtm', label: 'Go-To-Market' },
]

function App() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="min-h-screen bg-zen-dark">
      {/* Header */}
      <header className="bg-zen-surface border-b border-zen-green/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌧️ ☯️ 🐂</span>
              <div>
                <h1 className="text-2xl font-bold text-zen-text">RAINING ZEN</h1>
                <p className="text-sm text-zen-gold">White-Label Poker Platform</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zen-text/60">Powered by</p>
              <p className="text-sm font-semibold text-zen-gold">69 Protocol™</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-zen-green text-white'
                    : 'text-zen-text/70 hover:text-zen-text hover:bg-zen-surface'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'overview' && <Overview />}
        {activeSection === 'market' && <Market />}
        {activeSection === 'product' && <Product />}
        {activeSection === 'tech' && <Technology />}
        {activeSection === 'roadmap' && <Roadmap />}
        {activeSection === 'team' && <TeamBudget />}
        {activeSection === 'revenue' && <Revenue />}
        {activeSection === 'gtm' && <GoToMarket />}
      </main>

      {/* Footer */}
      <footer className="bg-zen-surface border-t border-zen-green/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zen-gold italic mb-2">"Never take, always give back more"</p>
          <p className="text-zen-text/60 text-sm">HwinNwin Enterprises | Lumen Systems Division</p>
          <p className="text-zen-text/40 text-xs mt-2">December 2024</p>
        </div>
      </footer>
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-zen-surface rounded-xl border border-zen-green/20 p-6 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-zen-text mb-2">{children}</h2>
      {subtitle && <p className="text-zen-text/60">{subtitle}</p>}
    </div>
  )
}

function Overview() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="Flow like rain. Play like an emperor.">Executive Summary</SectionTitle>

      {/* Hero */}
      <Card className="bg-gradient-to-br from-zen-green/20 to-zen-surface">
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">🌧️ ☯️ 🐂</span>
          <h3 className="text-2xl font-bold text-zen-gold mb-4">White-Label Poker Platform</h3>
          <p className="text-zen-text/80 max-w-2xl mx-auto">
            Enable entrepreneurs, gaming enthusiasts, and club operators to launch their own
            branded poker applications without building technology from scratch.
          </p>
        </div>
      </Card>

      {/* Value Props */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🎨', title: 'Fully Branded', desc: 'Custom themes, logos, and identities' },
          { icon: '♠️', title: 'Complete Engine', desc: "Hold'em, Omaha, Tournaments" },
          { icon: '⚡', title: 'Real-Time', desc: 'WebSocket multiplayer infrastructure' },
          { icon: '📊', title: 'Admin Dashboard', desc: 'Club management & analytics' },
        ].map((item, i) => (
          <Card key={i}>
            <span className="text-3xl mb-3 block">{item.icon}</span>
            <h4 className="font-semibold text-zen-text mb-1">{item.title}</h4>
            <p className="text-sm text-zen-text/60">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* 69 Protocol */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="text-4xl">🔒</div>
          <div>
            <h3 className="text-xl font-bold text-zen-gold mb-2">69 Protocol™</h3>
            <p className="text-zen-text/80 mb-4">
              Our commitment to fairness, reliability, and integrity. Every game, every shuffle, every transaction.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-zen-dark/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-zen-green">99.9999%</p>
                <p className="text-xs text-zen-text/60">Uptime Target</p>
              </div>
              <div className="bg-zen-dark/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-zen-green">Provably Fair</p>
                <p className="text-xs text-zen-text/60">Cryptographic Shuffle</p>
              </div>
              <div className="bg-zen-dark/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-zen-green">AES-256</p>
                <p className="text-xs text-zen-text/60">Data Encryption</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* First Client */}
      <Card className="border-zen-gold/30">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🐂</div>
          <div>
            <h3 className="text-xl font-bold text-zen-gold">First Client: Johnny</h3>
            <p className="text-zen-text/60 mb-2">The "Ox Emperor"</p>
            <p className="text-zen-text/80">
              Proof-of-concept deployment demonstrating full white-label capabilities.
              His "Raining Zen" branded app validates the model for broader market rollout.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Market() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="$92 billion global online poker market">Market Analysis</SectionTitle>

      {/* Market Size */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">The Opportunity</h3>
        <p className="text-zen-text/80 mb-4">
          The social/private poker market has exploded since 2020. Apps like XPoker, PokerBros, PPPoker,
          and ClubGG have proven the model: players want private, social games with their friends and
          communities—not anonymous casino experiences.
        </p>
        <div className="bg-zen-dark/50 rounded-lg p-4">
          <p className="text-3xl font-bold text-zen-gold">$92 Billion</p>
          <p className="text-sm text-zen-text/60">Global online poker market (2024)</p>
        </div>
      </Card>

      {/* Target Segments */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Target Customer Segments</h3>
        <div className="space-y-4">
          {[
            { segment: 'Home Game Hosts', desc: 'Run regular games with friends. Want professional feel with own branding.', tier: 'Starter' },
            { segment: 'Club Operators', desc: 'Manage multiple tables and player pools. Need admin tools, analytics, and rake management.', tier: 'Pro' },
            { segment: 'Poker Agents', desc: 'Professional operators running multiple clubs. Need white-label solution to differentiate.', tier: 'Enterprise' },
            { segment: 'Streamers/Influencers', desc: 'Content creators wanting branded poker for audience. High visibility, marketing value.', tier: 'Pro/Enterprise' },
            { segment: 'Corporate/Events', desc: 'Companies wanting branded poker for team events, charity tournaments, client entertainment.', tier: 'Custom' },
          ].map((item, i) => (
            <div key={i} className="flex items-start justify-between p-4 bg-zen-dark/30 rounded-lg">
              <div>
                <h4 className="font-semibold text-zen-text">{item.segment}</h4>
                <p className="text-sm text-zen-text/60">{item.desc}</p>
              </div>
              <span className="px-3 py-1 bg-zen-green/20 text-zen-green text-xs font-medium rounded-full">
                {item.tier}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Competition */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Competitive Landscape</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zen-green/20">
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Platform</th>
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Strengths</th>
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Weaknesses</th>
                <th className="text-left py-3 px-4 text-zen-gold font-medium">Our Advantage</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'XPoker', str: 'Established, smooth UX', weak: 'Generic branding only', adv: 'Full white-label customization' },
                { name: 'PokerBros', str: 'Large player base', weak: 'No ownership, just clubs', adv: 'Own your platform entirely' },
                { name: 'PPPoker', str: 'Agent network, scale', weak: 'Complex, overwhelming', adv: 'Simple, zen experience' },
                { name: 'Custom Dev', str: 'Total control', weak: '$100K+, 12+ months', adv: 'Ready in weeks, fraction of cost' },
              ].map((item, i) => (
                <tr key={i} className="border-b border-zen-green/10">
                  <td className="py-3 px-4 font-medium text-zen-text">{item.name}</td>
                  <td className="py-3 px-4 text-zen-text/70">{item.str}</td>
                  <td className="py-3 px-4 text-red-400/70">{item.weak}</td>
                  <td className="py-3 px-4 text-zen-green">{item.adv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Product() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="Complete poker platform features">Product Specification</SectionTitle>

      {/* Core Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-bold text-zen-text mb-4 flex items-center gap-2">
            <span className="text-2xl">♠️</span> Poker Engine
          </h3>
          <ul className="space-y-2 text-zen-text/80">
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Texas Hold'em (NL, PL, Fixed)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Omaha & Omaha Hi-Lo
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Cryptographic shuffling (provably fair)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Hand history & replay
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Side pots & all-in equity
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Run-it-twice option
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-zen-text mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Real-Time Multiplayer
          </h3>
          <ul className="space-y-2 text-zen-text/80">
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> WebSocket architecture
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> 2-9 players per table
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Multiple concurrent tables
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Reconnection & state recovery
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Spectator mode
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Chat & emoji reactions
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-zen-text mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Tournament System
          </h3>
          <ul className="space-y-2 text-zen-text/80">
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Sit-and-go tournaments
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Multi-table tournaments (MTT)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Custom blind structures
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Rebuy & add-on support
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Prize pool distribution
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Leaderboards & seasons
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-zen-text mb-4 flex items-center gap-2">
            <span className="text-2xl">🎨</span> White-Label System
          </h3>
          <ul className="space-y-2 text-zen-text/80">
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Custom app name & logo
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Full color scheme customization
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Custom table felt designs
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Card back designs
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Custom sounds & music
            </li>
            <li className="flex items-center gap-2">
              <span className="text-zen-green">✓</span> Avatar customization
            </li>
          </ul>
        </Card>
      </div>

      {/* Admin Dashboard */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span> Admin Dashboard
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Player Management', items: ['Add, remove, suspend', 'Player profiles', 'KYC tracking'] },
            { title: 'Operations', items: ['Chip bank', 'Game scheduling', 'Rake config'] },
            { title: 'Analytics', items: ['Active players', 'Revenue metrics', 'Retention rates'] },
          ].map((group, i) => (
            <div key={i} className="bg-zen-dark/30 rounded-lg p-4">
              <h4 className="font-semibold text-zen-gold mb-2">{group.title}</h4>
              <ul className="space-y-1">
                {group.items.map((item, j) => (
                  <li key={j} className="text-sm text-zen-text/70">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Technology() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="Modern microservices architecture">Technical Architecture</SectionTitle>

      {/* Architecture Diagram */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">System Overview</h3>
        <div className="bg-zen-dark/50 rounded-lg p-6 font-mono text-sm text-center">
          <div className="text-zen-blue mb-2">[Mobile Apps]</div>
          <div className="text-zen-text/40">↕</div>
          <div className="text-zen-gold mb-2">[Load Balancer] ↔ [Game Servers]</div>
          <div className="text-zen-text/40">↓</div>
          <div className="text-zen-green mb-2">[API Gateway]</div>
          <div className="text-zen-text/40">↙ ↓ ↘</div>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="text-zen-text/70">[Auth]</span>
            <span className="text-zen-text/70">[Game]</span>
            <span className="text-zen-text/70">[Admin]</span>
          </div>
          <div className="text-zen-text/40 mt-2">↓ ↓ ↓</div>
          <div className="flex justify-center gap-4 flex-wrap text-zen-text/50">
            <span>[PostgreSQL]</span>
            <span>[Redis]</span>
            <span>[S3]</span>
          </div>
        </div>
      </Card>

      {/* Tech Stack */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Technology Stack</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zen-green/20">
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Layer</th>
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Technology</th>
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                { layer: 'Mobile Apps', tech: 'React Native', why: 'Cross-platform iOS/Android from single codebase' },
                { layer: 'Web App', tech: 'React + TypeScript', why: 'Component reuse with mobile, type safety' },
                { layer: 'Game Server', tech: 'Node.js + Socket.io', why: 'Real-time performance, JS ecosystem' },
                { layer: 'API Server', tech: 'Node.js + Express', why: 'REST APIs for admin, auth, data' },
                { layer: 'Database', tech: 'PostgreSQL + Redis', why: 'ACID compliance + fast caching' },
                { layer: 'Infrastructure', tech: 'AWS / Docker / K8s', why: 'Scalable, reliable, industry standard' },
                { layer: 'Poker Engine', tech: 'Custom TypeScript', why: 'Full control, optimized for our needs' },
              ].map((item, i) => (
                <tr key={i} className="border-b border-zen-green/10">
                  <td className="py-3 px-4 font-medium text-zen-text">{item.layer}</td>
                  <td className="py-3 px-4 text-zen-gold">{item.tech}</td>
                  <td className="py-3 px-4 text-zen-text/70">{item.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security */}
      <Card className="border-zen-gold/30">
        <h3 className="text-xl font-bold text-zen-gold mb-4">🔒 Security & Fair Play (69 Protocol)</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Cryptographic RNG', desc: 'Hardware-seeded random number generation for card shuffling' },
            { title: 'Provably Fair', desc: 'Hash-based verification allowing players to audit shuffles' },
            { title: 'Anti-Collusion', desc: 'IP monitoring, play pattern analysis, device fingerprinting' },
            { title: 'Data Encryption', desc: 'TLS 1.3 in transit, AES-256 at rest' },
          ].map((item, i) => (
            <div key={i} className="bg-zen-dark/30 rounded-lg p-4">
              <h4 className="font-semibold text-zen-text mb-1">{item.title}</h4>
              <p className="text-sm text-zen-text/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Roadmap() {
  const phases = [
    {
      num: 1,
      title: 'Core Engine',
      duration: 'Months 1-3',
      goal: 'Functional poker game with basic multiplayer',
      milestone: "Internal alpha with Johnny's group testing",
      items: ['Poker logic engine', 'WebSocket server', 'Basic React Native app', 'User authentication', 'Single-table cash games'],
    },
    {
      num: 2,
      title: 'White-Label System',
      duration: 'Months 4-5',
      goal: 'Customizable branding for different clients',
      milestone: '"Raining Zen" branded app for Johnny (beta)',
      items: ['Theme engine', 'Asset management', 'Multi-tenant architecture', 'Club management', 'Admin dashboard v1'],
    },
    {
      num: 3,
      title: 'Tournaments & Scale',
      duration: 'Months 6-7',
      goal: 'Full feature parity with competitors',
      milestone: 'Production-ready platform, app store launch',
      items: ['Tournament system (SNG, MTT)', 'Multi-table support', 'Advanced analytics', 'Rake management', 'iOS/Android deployment'],
    },
    {
      num: 4,
      title: 'Growth & Features',
      duration: 'Months 8+',
      goal: 'Market expansion and premium features',
      milestone: '$5K+ MRR, path to profitability',
      items: ['Additional game variants', 'Payment processing', 'Affiliate system', 'AI training mode', 'Streaming integration'],
    },
  ]

  return (
    <div className="space-y-8">
      <SectionTitle subtitle="4-phase development plan">Development Roadmap</SectionTitle>

      <div className="space-y-6">
        {phases.map((phase, i) => (
          <Card key={i} className={i === 0 ? 'border-zen-green' : ''}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zen-green flex items-center justify-center text-xl font-bold text-white">
                {phase.num}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-zen-text">Phase {phase.num}: {phase.title}</h3>
                  <span className="px-2 py-0.5 bg-zen-gold/20 text-zen-gold text-xs font-medium rounded">
                    {phase.duration}
                  </span>
                </div>
                <p className="text-zen-text/80 mb-2">{phase.goal}</p>
                <p className="text-sm text-zen-green mb-4">🎯 Milestone: {phase.milestone}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {phase.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-zen-text/70">
                      <span className="text-zen-green">○</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Success Metrics */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Success Metrics</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { month: 'Month 3', metric: 'Alpha Testing', value: "Johnny's group playing weekly" },
            { month: 'Month 6', metric: 'Beta Customers', value: '5+ paying customers' },
            { month: 'Month 9', metric: 'App Store Launch', value: '20+ customers' },
            { month: 'Month 12', metric: 'MRR Target', value: '$5,000+' },
          ].map((item, i) => (
            <div key={i} className="bg-zen-dark/30 rounded-lg p-4 text-center">
              <p className="text-xs text-zen-gold mb-1">{item.month}</p>
              <p className="text-lg font-bold text-zen-text mb-1">{item.metric}</p>
              <p className="text-sm text-zen-text/60">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function TeamBudget() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="Resources and investment">Team & Budget</SectionTitle>

      {/* Team */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Core Team Requirements</h3>
        <div className="space-y-4">
          {[
            { role: 'Technical Lead', resp: 'Architecture, code review, poker engine', opt: 'Senior hire OR experienced contractor' },
            { role: 'Full-Stack Dev', resp: 'React Native, Node.js, APIs', opt: '1-2 developers (offshore viable)' },
            { role: 'UI/UX Designer', resp: 'App design, themes, branding', opt: 'Contract/part-time initially' },
            { role: 'DevOps', resp: 'Infrastructure, CI/CD, scaling', opt: 'Part-time OR managed services' },
            { role: 'QA/Testing', resp: 'Game testing, edge cases', opt: "Johnny's crew + contract QA" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zen-dark/30 rounded-lg gap-2">
              <div>
                <h4 className="font-semibold text-zen-gold">{item.role}</h4>
                <p className="text-sm text-zen-text/70">{item.resp}</p>
              </div>
              <span className="text-sm text-zen-text/50">{item.opt}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Budget */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Budget Estimates (First Year)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zen-green/20">
                <th className="text-left py-3 px-4 text-zen-text/60 font-medium">Category</th>
                <th className="text-right py-3 px-4 text-zen-text/60 font-medium">Bootstrap</th>
                <th className="text-right py-3 px-4 text-zen-text/60 font-medium">Well-Funded</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Development (6 months)', low: '$40,000 - $60,000', high: '$120,000 - $180,000' },
                { cat: 'Infrastructure (annual)', low: '$3,000 - $6,000', high: '$12,000 - $24,000' },
                { cat: 'Design & Branding', low: '$2,000 - $5,000', high: '$10,000 - $20,000' },
                { cat: 'App Store Fees', low: '$200', high: '$200' },
              ].map((item, i) => (
                <tr key={i} className="border-b border-zen-green/10">
                  <td className="py-3 px-4 text-zen-text">{item.cat}</td>
                  <td className="py-3 px-4 text-right text-zen-text/70">{item.low}</td>
                  <td className="py-3 px-4 text-right text-zen-text/70">{item.high}</td>
                </tr>
              ))}
              <tr className="bg-zen-green/10">
                <td className="py-3 px-4 font-bold text-zen-text">TOTAL</td>
                <td className="py-3 px-4 text-right font-bold text-zen-gold">$45K - $70K</td>
                <td className="py-3 px-4 text-right font-bold text-zen-gold">$140K - $225K</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Revenue() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="SaaS subscription model">Revenue Model</SectionTitle>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            name: 'STARTER',
            price: '$99',
            features: ['Up to 50 players', '3 concurrent tables', 'Basic colors', 'SNG only', 'Email support'],
            highlight: false,
          },
          {
            name: 'PRO',
            price: '$299',
            features: ['Up to 500 players', '20 concurrent tables', 'Full theme', 'SNG + MTT', 'Priority support'],
            highlight: true,
          },
          {
            name: 'ENTERPRISE',
            price: '$999',
            features: ['Unlimited players', 'Unlimited tables', 'Custom app', 'Full suite', 'Dedicated support'],
            highlight: false,
          },
        ].map((tier, i) => (
          <Card key={i} className={tier.highlight ? 'border-zen-gold ring-2 ring-zen-gold/20' : ''}>
            {tier.highlight && (
              <span className="text-xs text-zen-gold font-semibold mb-2 block">MOST POPULAR</span>
            )}
            <h3 className="text-xl font-bold text-zen-text mb-2">{tier.name}</h3>
            <p className="text-3xl font-bold text-zen-gold mb-4">
              {tier.price}<span className="text-sm font-normal text-zen-text/50">/mo</span>
            </p>
            <ul className="space-y-2">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-zen-text/80">
                  <span className="text-zen-green">✓</span> {f}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Additional Revenue */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Additional Revenue Streams</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { stream: 'Custom Development', amount: '$5,000 - $50,000', desc: 'Bespoke features' },
            { stream: 'Premium Themes', amount: '$500 - $2,000', desc: 'Designer themes (one-time)' },
            { stream: 'Transaction Fees', amount: '1-3%', desc: 'Integrated payment processing' },
            { stream: 'Source License', amount: '$25,000+', desc: 'Full source code license' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zen-dark/30 rounded-lg">
              <div>
                <h4 className="font-semibold text-zen-text">{item.stream}</h4>
                <p className="text-sm text-zen-text/50">{item.desc}</p>
              </div>
              <span className="text-zen-gold font-bold">{item.amount}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Projections */}
      <Card>
        <h3 className="text-xl font-bold text-zen-text mb-4">Year 1 Revenue Projections</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-zen-dark/30 rounded-lg p-4">
            <h4 className="text-zen-text/60 mb-3">Conservative</h4>
            <ul className="space-y-2 text-sm text-zen-text/70 mb-4">
              <li>10 Starter × $99 × 12 = $11,880</li>
              <li>5 Pro × $299 × 12 = $17,940</li>
              <li>1 Enterprise × $999 × 12 = $11,988</li>
              <li>Custom dev = $15,000</li>
            </ul>
            <p className="text-2xl font-bold text-zen-text">~$57,000</p>
          </div>
          <div className="bg-zen-green/10 rounded-lg p-4">
            <h4 className="text-zen-gold mb-3">Optimistic</h4>
            <ul className="space-y-2 text-sm text-zen-text/70 mb-4">
              <li>25 Starter × $99 × 12 = $29,700</li>
              <li>15 Pro × $299 × 12 = $53,820</li>
              <li>5 Enterprise × $999 × 12 = $59,940</li>
              <li>Custom dev + themes = $40,000</li>
            </ul>
            <p className="text-2xl font-bold text-zen-gold">~$183,000</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function GoToMarket() {
  return (
    <div className="space-y-8">
      <SectionTitle subtitle="From proof-of-concept to scale">Go-To-Market Strategy</SectionTitle>

      {/* Phases */}
      <div className="space-y-4">
        {[
          {
            phase: 'Phase 1: Proof of Concept',
            time: 'Months 1-3',
            items: [
              'Launch Johnny\'s "Raining Zen" as flagship case study',
              'Document user feedback and iterate',
              'Create marketing materials from real usage',
              'Build testimonials and social proof',
            ],
          },
          {
            phase: 'Phase 2: Community Launch',
            time: 'Months 4-6',
            items: [
              'Target poker forums (2+2, Reddit r/poker)',
              'Partner with poker content creators',
              'Offer founding member discounts (lifetime pricing)',
              'Referral program: 20% commission for 12 months',
            ],
          },
          {
            phase: 'Phase 3: Scale',
            time: 'Months 7-12',
            items: [
              'Paid advertising to club operators',
              'Conference presence (poker expos, gaming shows)',
              'Strategic partnerships with poker training sites',
              'Agent/affiliate recruitment program',
            ],
          },
        ].map((item, i) => (
          <Card key={i}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zen-gold/20 flex items-center justify-center text-zen-gold font-bold">
                {i + 1}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-zen-text">{item.phase}</h3>
                  <span className="text-sm text-zen-text/50">{item.time}</span>
                </div>
                <ul className="space-y-1">
                  {item.items.map((it, j) => (
                    <li key={j} className="text-sm text-zen-text/70 flex items-start gap-2">
                      <span className="text-zen-green mt-1">•</span> {it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Differentiation */}
      <Card className="border-zen-gold/30">
        <h3 className="text-xl font-bold text-zen-gold mb-4">Competitive Differentiation</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'True White-Label', desc: 'Your brand, your app—not just a club within someone else\'s platform' },
            { title: '69 Protocol', desc: 'Unique brand identity around fairness, reliability, and integrity' },
            { title: 'Premium Experience', desc: 'Zen aesthetic differentiates from generic poker apps' },
            { title: 'Founder Access', desc: 'Direct relationship with HwinNwin team for custom needs' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-zen-gold text-xl">✦</span>
              <div>
                <h4 className="font-semibold text-zen-text">{item.title}</h4>
                <p className="text-sm text-zen-text/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-zen-green/20 to-zen-surface text-center py-8">
        <span className="text-5xl mb-4 block">🌧️ ☯️ 🐂</span>
        <h3 className="text-2xl font-bold text-zen-text mb-2">Ready to Build</h3>
        <p className="text-zen-text/70 mb-4">Flow like rain. Play like an emperor.</p>
        <p className="text-zen-gold font-semibold">Contact: tungsten@hwinwin.com</p>
      </Card>
    </div>
  )
}

export default App
