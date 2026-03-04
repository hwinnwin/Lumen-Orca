export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'Sora', sans-serif",
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a
          href="/"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontSize: 14,
            marginBottom: 24,
            display: 'inline-block',
          }}
        >
          &larr; Back to App
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
          Last updated: March 3, 2025
        </p>

        <div style={{ lineHeight: 1.8, fontSize: 15, color: 'var(--text-secondary)' }}>
          <Section title="1. Introduction">
            HWinnWin Social Command Center ("SCC", "we", "our", or "us") is a social media management
            platform operated by HWinnWin. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our application at scc.hwinnwin.com.
          </Section>

          <Section title="2. Information We Collect">
            <p><strong style={{ color: 'var(--text-primary)' }}>Account Information:</strong> When you
            create an account, we collect your name, email address, and password (stored securely as a
            hash).</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Social Media Connections:</strong> When
            you connect social media accounts (Instagram, Facebook, LinkedIn, TikTok, YouTube, X/Twitter),
            we store OAuth access tokens and refresh tokens to publish content on your behalf. We do not
            store your social media passwords.</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Content:</strong> Posts, media files,
            captions, and scheduling data you create within SCC.</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Analytics Data:</strong> Engagement
            metrics (views, likes, comments, shares) fetched from connected platforms for posts published
            through SCC.</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Usage Data:</strong> Log data such as
            IP address, browser type, and pages visited for security and service improvement.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul style={{ paddingLeft: 20 }}>
              <li>To publish and schedule content to your connected social media accounts</li>
              <li>To display analytics and engagement metrics for your published posts</li>
              <li>To generate AI-assisted content (captions, hashtags, carousel slides) using your prompts</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To improve and maintain the service</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Services">
            <p>SCC integrates with the following third-party services:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong style={{ color: 'var(--text-primary)' }}>Social Media Platforms</strong> (Meta/Instagram,
              Facebook, LinkedIn, TikTok, YouTube, X/Twitter) — for OAuth authentication and content publishing
              via their official APIs</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Anthropic (Claude)</strong> — for
              AI-powered content generation. Your prompts are sent to Anthropic's API; refer to{' '}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent-primary)' }}>Anthropic's Privacy Policy</a></li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Replicate</strong> — for AI image
              generation. Image prompts are sent to Replicate's API; refer to{' '}
              <a href="https://replicate.com/privacy" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent-primary)' }}>Replicate's Privacy Policy</a></li>
            </ul>
            <p>We only share the minimum data necessary for each service to function. We do not sell
            your data to any third party.</p>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>Your data is stored on secure servers. OAuth tokens are encrypted at rest. Passwords are
            hashed using industry-standard algorithms (bcrypt). We use HTTPS for all data transmission.</p>
            <p>Media files you upload are stored either in cloud storage (AWS S3) or on our application
            servers, depending on deployment configuration.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your data for as long as your account is active. You may delete your account
            at any time, which will remove your personal data, content, and connected platform tokens.
            Some data may be retained in backups for up to 30 days after deletion.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data and account</li>
              <li>Disconnect any social media platform at any time, which revokes our access tokens</li>
              <li>Export your content data</li>
            </ul>
          </Section>

          <Section title="8. Cookies">
            <p>SCC uses essential cookies and local storage for authentication (JWT tokens) and user
            preferences (theme settings). We do not use third-party tracking cookies or advertising
            cookies.</p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>SCC is not intended for use by individuals under the age of 13. We do not knowingly
            collect personal information from children under 13.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <p style={{ marginTop: 8 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Email:</strong>{' '}
              <a href="mailto:privacy@hwinnwin.com" style={{ color: 'var(--accent-primary)' }}>
                privacy@hwinnwin.com
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
