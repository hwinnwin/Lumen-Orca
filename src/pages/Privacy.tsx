import { Link } from "react-router-dom";
import { Sparkles, Shield, Eye, Database, Lock, UserCheck, Mail, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Lumen Orca</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Shield className="h-4 w-4" />
            Your Privacy Matters
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 15, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">

          {/* Introduction */}
          <Card>
            <CardContent className="p-8">
              <p className="text-muted-foreground leading-relaxed">
                Lumyn Global ("we," "our," or "us") operates the Lumen Orca platform and hwinnwin.com website.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you visit our website or use our services. Please read this policy carefully. By using our services,
                you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Information We Collect</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you register for an account, book a consultation, or purchase a service, we may collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 ml-4">
                    <li>Name and email address</li>
                    <li>Business name and contact information</li>
                    <li>Payment and billing information</li>
                    <li>Social media account details (when you connect accounts for management)</li>
                    <li>Communication preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you access our platform, we automatically collect certain information including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 ml-4">
                    <li>IP address and browser type</li>
                    <li>Device information and operating system</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Usage patterns and feature interactions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Social Media Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you connect your social media accounts to our platform, we access data permitted by
                    the respective platform's API, including post performance metrics, audience demographics,
                    and engagement analytics. We only access data necessary to provide our services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide, operate, and maintain our services</li>
                <li>Process transactions and send related information</li>
                <li>Manage your social media content and campaigns</li>
                <li>Generate analytics, reports, and performance insights</li>
                <li>Send administrative information, updates, and marketing communications</li>
                <li>Respond to inquiries and provide customer support</li>
                <li>Improve our platform, services, and user experience</li>
                <li>Detect and prevent fraud or unauthorized access</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          {/* AI and Automated Processing */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">AI and Automated Processing</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Our platform uses artificial intelligence and automated systems (the ORCA pipeline) to assist
                with content creation, scheduling, and analytics. When using these features:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>AI-generated content is created based on your inputs and preferences</li>
                <li>Your data is processed by third-party AI providers (such as language model APIs) to deliver our services</li>
                <li>We do not use your personal content to train AI models</li>
                <li>You retain ownership of all content created through our platform</li>
                <li>AI processing is subject to the same data protection standards as all other data handling</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Data Sharing and Disclosure</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your data with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting, payment processing, analytics, AI services)</li>
                <li><strong>Social Media Platforms:</strong> When you authorize us to publish content or retrieve analytics on your behalf</li>
                <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                All third-party service providers are bound by contractual obligations to keep your information
                confidential and to use it only for the purposes for which we disclose it to them.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Data Security</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Row-level security (RLS) policies on our database</li>
                <li>Multi-factor authentication options</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and role-based permissions</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                While we strive to protect your personal information, no method of transmission over the
                Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Your Rights</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request that we delete your personal data</li>
                <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to the processing of your personal data</li>
                <li><strong>Restriction:</strong> Request that we restrict the processing of your data</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                To exercise any of these rights, please contact us at the email address provided below.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our platform and
                hold certain information. Cookies are files with a small amount of data which may include
                an anonymous unique identifier. You can instruct your browser to refuse all cookies or to
                indicate when a cookie is being sent. However, if you do not accept cookies, you may not
                be able to use some portions of our platform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for authentication and session management, and optional analytics
                cookies to understand how our platform is used and improve our services.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes
                for which it was collected, including to satisfy legal, accounting, or reporting requirements.
                When you delete your account, we will delete or anonymize your personal data within 30 days,
                except where we are required to retain it for legal or regulatory purposes.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect
                personal information from children. If you become aware that a child has provided us with
                personal information, please contact us and we will take steps to delete such information.
              </p>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by
                posting the new Privacy Policy on this page and updating the "Last updated" date. You are
                advised to review this Privacy Policy periodically for any changes. Changes are effective
                when they are posted on this page.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Contact Us</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="text-muted-foreground space-y-1 ml-4">
                <p><strong>Email:</strong> privacy@hwinnwin.com</p>
                <p><strong>Website:</strong> hwinnwin.com</p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center pt-8">
            <Link to="/home">
              <Button variant="outline" size="lg">Back to Home</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link to="/home" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Lumen Orca</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
              <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Lumyn Global. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
