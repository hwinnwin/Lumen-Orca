export default function TermsPage() {
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

        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
          Last updated: March 3, 2025
        </p>

        <div style={{ lineHeight: 1.8, fontSize: 15, color: 'var(--text-secondary)' }}>
          <Section title="1. Acceptance of Terms">
            By accessing or using HWinnWin Social Command Center ("SCC") at scc.hwinnwin.com, you
            agree to be bound by these Terms of Service. If you do not agree, do not use the service.
          </Section>

          <Section title="2. Description of Service">
            <p>SCC is a social media management platform that allows you to:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Compose and schedule posts to multiple social media platforms</li>
              <li>Generate AI-assisted content including captions, hashtags, and carousel images</li>
              <li>Track engagement analytics for published content</li>
              <li>Manage connections to social media accounts (Instagram, Facebook, LinkedIn, TikTok,
              YouTube, X/Twitter)</li>
            </ul>
          </Section>

          <Section title="3. Account Registration">
            <p>You must create an account to use SCC. You agree to:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </Section>

          <Section title="4. Social Media Platform Connections">
            <p>When you connect third-party social media accounts to SCC:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>You authorize SCC to access and publish content on your behalf via official platform
              APIs</li>
              <li>You remain responsible for all content published through SCC to your accounts</li>
              <li>You must comply with each platform's own terms of service and community guidelines</li>
              <li>You may disconnect any platform at any time, which immediately revokes SCC's access</li>
            </ul>
          </Section>

          <Section title="5. Content and Conduct">
            <p>You are solely responsible for content you create, schedule, and publish through SCC.
            You agree not to use SCC to:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Post content that is illegal, harmful, threatening, abusive, defamatory, or otherwise
              objectionable</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Distribute spam, malware, or engage in phishing</li>
              <li>Circumvent rate limits or abuse third-party platform APIs</li>
            </ul>
          </Section>

          <Section title="6. AI-Generated Content">
            <p>SCC uses artificial intelligence (Anthropic Claude and Replicate) to assist with content
            generation. You acknowledge that:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>AI-generated content is provided as suggestions and may require review and editing</li>
              <li>You are responsible for reviewing all AI-generated content before publishing</li>
              <li>AI outputs may occasionally be inaccurate, inappropriate, or biased</li>
              <li>You retain ownership of content you create using AI assistance, subject to the AI
              providers' terms</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>You retain all rights to the content you create and publish through SCC. By using SCC,
            you grant us a limited license to store, process, and transmit your content solely for the
            purpose of providing the service.</p>
          </Section>

          <Section title="8. Service Availability">
            <p>We strive to keep SCC available at all times but do not guarantee uninterrupted service.
            We may temporarily suspend access for maintenance, updates, or security reasons. We are not
            liable for any failure to publish content due to service interruptions, third-party API
            outages, or rate limiting.</p>
          </Section>

          <Section title="9. Rate Limits and API Usage">
            <p>Social media platforms impose API rate limits. SCC implements its own rate limiting to
            protect your accounts and stay within platform guidelines. You acknowledge that publishing
            frequency may be limited by these constraints.</p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>SCC is provided "as is" without warranties of any kind. To the maximum extent permitted
            by law, HWinnWin shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages arising from your use of the service, including but not limited to:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Failed or delayed content publishing</li>
              <li>Loss of social media account access</li>
              <li>Inaccurate analytics data</li>
              <li>AI-generated content that causes harm</li>
            </ul>
          </Section>

          <Section title="11. Termination">
            <p>We may suspend or terminate your account if you violate these terms. You may delete your
            account at any time. Upon termination, your data will be handled in accordance with our{' '}
            <a href="/privacy" style={{ color: 'var(--accent-primary)' }}>Privacy Policy</a>.</p>
          </Section>

          <Section title="12. Changes to Terms">
            <p>We may update these Terms of Service from time to time. Continued use of SCC after
            changes constitutes acceptance of the updated terms. Material changes will be communicated
            via email or in-app notification.</p>
          </Section>

          <Section title="13. Governing Law">
            <p>These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law provisions.</p>
          </Section>

          <Section title="14. Contact Us">
            <p>If you have questions about these Terms of Service, please contact us at:</p>
            <p style={{ marginTop: 8 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Email:</strong>{' '}
              <a href="mailto:legal@hwinnwin.com" style={{ color: 'var(--accent-primary)' }}>
                legal@hwinnwin.com
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
