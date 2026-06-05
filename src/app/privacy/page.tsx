import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Vultstack collects, uses, and protects your data.',
  robots: { index: true, follow: true },
};

const UPDATED = 'June 5, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: '#0b0b0f',
        color: '#d8d8e0',
        minHeight: '100vh',
        padding: '48px 20px',
      }}
    >
      <article style={{ maxWidth: 760, margin: '0 auto', lineHeight: 1.7 }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 30, margin: '0 0 6px' }}>Privacy Policy</h1>
          <p style={{ color: '#8a8a99', margin: 0 }}>Last updated: {UPDATED}</p>
        </header>

        <Section title="Overview">
          <p>
            Vultstack (&ldquo;Vultstack,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) provides a
            customer-relationship and social-media management platform. This policy explains
            what information we collect, how we use it, how we protect it, and the choices you
            have. It applies to the Vultstack application at{' '}
            <Mono>crm.vultstack.com</Mono> and related services.
          </p>
        </Section>

        <Section title="Information we collect">
          <ul>
            <li>
              <strong>Account information.</strong> Your name, email address, and authentication
              details used to access Vultstack.
            </li>
            <li>
              <strong>Connected social accounts.</strong> When you connect a Facebook Page,
              Instagram Business account, or other social platform, we receive the account&rsquo;s
              identifier, name/handle, the linked Page identifier, and access tokens issued by
              that platform. These tokens are required to publish content on your behalf.
            </li>
            <li>
              <strong>Content you create.</strong> Posts, captions, scheduling details, media you
              upload, and publishing results.
            </li>
            <li>
              <strong>Operational data.</strong> Logs and timestamps needed to operate, secure,
              and troubleshoot the service.
            </li>
          </ul>
        </Section>

        <Section title="How we use information">
          <ul>
            <li>To authenticate you and provide the Vultstack application.</li>
            <li>
              To publish, schedule, and manage social content on the accounts you explicitly
              connect, using the permissions you grant.
            </li>
            <li>To display publishing status, engagement, and account information back to you.</li>
            <li>To maintain security, prevent abuse, and comply with legal obligations.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information, and we do not use your
            social account data for advertising or for any purpose other than operating the
            features you use.
          </p>
        </Section>

        <Section title="Meta Platform data (Facebook & Instagram)">
          <p>
            Our use of information received from the Meta Platform — including Facebook Pages and
            Instagram Business accounts — adheres to the{' '}
            <a
              href="https://developers.facebook.com/terms/"
              style={{ color: '#7fb4ff' }}
              rel="noopener noreferrer"
              target="_blank"
            >
              Meta Platform Terms
            </a>{' '}
            and Developer Policies. We request only the permissions needed to list your Pages and
            connected Instagram accounts and to publish content you author. Access tokens obtained
            through Meta are used solely to perform actions you initiate within Vultstack and are
            stored encrypted at rest.
          </p>
        </Section>

        <Section title="How we store and protect data">
          <ul>
            <li>Access tokens and secrets are encrypted at rest using strong encryption.</li>
            <li>
              Data is stored with our infrastructure providers (Supabase for the database and
              Vercel for application hosting) under their respective security and privacy terms.
            </li>
            <li>Access to production data is restricted to authorized personnel.</li>
          </ul>
        </Section>

        <Section title="Data sharing">
          <p>
            We share data only with the service providers that power Vultstack (such as our
            database and hosting providers), with the social platforms you connect when carrying
            out the actions you request, and where required by law. We do not sell or rent your
            data to third parties.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            We retain connected-account information and content for as long as your account is
            active or as needed to provide the service. When you disconnect a social account, the
            associated tokens and connection records are deleted or deactivated. You may request
            deletion of your data at any time (see below).
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>You can remove your data in any of these ways:</p>
          <ul>
            <li>
              <strong>In the app:</strong> open the Social Media section and disconnect the
              relevant account. This removes the stored connection and its access tokens.
            </li>
            <li>
              <strong>From Facebook/Instagram:</strong> remove the Vultstack app in your
              Facebook settings (Settings &rarr; Apps and Websites). Meta will notify us and we
              will automatically deactivate and delete the related connection data.
            </li>
            <li>
              <strong>By request:</strong> email{' '}
              <a href="mailto:support@vultstack.com" style={{ color: '#7fb4ff' }}>
                support@vultstack.com
              </a>{' '}
              and we will delete your personal data.
            </li>
          </ul>
          <p>
            Our automated data-deletion endpoint for Meta is available at{' '}
            <Mono>crm.vultstack.com/api/auth/social/facebook/data-deletion</Mono>. When a deletion
            request is received, the associated social connection records and access tokens are
            permanently removed.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on your location, you may have the right to access, correct, export, or
            delete your personal data, and to object to or restrict certain processing. To
            exercise these rights, contact us using the details below.
          </p>
        </Section>

        <Section title="Children's privacy">
          <p>
            Vultstack is a business tool not directed to children, and we do not knowingly collect
            personal information from anyone under 16.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be reflected by
            updating the &ldquo;Last updated&rdquo; date above.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about this policy or your data? Email{' '}
            <a href="mailto:support@vultstack.com" style={{ color: '#7fb4ff' }}>
              support@vultstack.com
            </a>
            .
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ color: '#fff', fontSize: 19, margin: '0 0 8px' }}>{title}</h2>
      {children}
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        background: '#15151c',
        border: '1px solid #26263a',
        borderRadius: 6,
        padding: '1px 6px',
        fontSize: 13,
        color: '#9fe6b3',
      }}
    >
      {children}
    </code>
  );
}
