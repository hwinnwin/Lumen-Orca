import { Link } from "react-router-dom";
import { Sparkles, FileText, Scale, AlertTriangle, CreditCard, Ban, RefreshCw, Gavel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Terms = () => {
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
            <FileText className="h-4 w-4" />
            Legal Agreement
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
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
                These Terms of Service ("Terms") govern your access to and use of the Lumen Orca platform,
                hwinnwin.com website, and related services (collectively, the "Services") provided by
                Lumyn Global ("we," "our," or "us"). By accessing or using our Services, you agree to be
                bound by these Terms. If you do not agree to these Terms, do not use our Services.
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Eligibility and Account</h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  You must be at least 18 years old and have the legal authority to enter into these Terms.
                  If you are using the Services on behalf of a business or organization, you represent that
                  you have the authority to bind that entity to these Terms.
                </p>
                <p>
                  When you create an account, you must provide accurate and complete information. You are
                  responsible for maintaining the confidentiality of your account credentials and for all
                  activities that occur under your account. You agree to notify us immediately of any
                  unauthorized use of your account.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services Description */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Description of Services</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Lumen Orca provides AI-powered social media management services including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>AI-assisted content creation and scheduling</li>
                <li>Social media analytics and performance reporting</li>
                <li>Multi-platform social media account management</li>
                <li>Campaign planning and execution tools</li>
                <li>Consultation and strategy services</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any aspect of the Services at any
                time, with or without notice. We will make reasonable efforts to notify you of material
                changes to the Services.
              </p>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Payment Terms</h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Certain features of the Services require payment. By selecting a paid plan, you agree
                  to pay the applicable fees as described on our pricing page. All fees are in US dollars
                  unless otherwise stated.
                </p>
                <p>
                  <strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual
                  basis, depending on your selected plan. One-time service fees are billed at the time of
                  purchase.
                </p>
                <p>
                  <strong>Refunds:</strong> Refund eligibility is determined on a case-by-case basis.
                  If you are unsatisfied with our Services, please contact us within 14 days of purchase
                  to discuss a resolution.
                </p>
                <p>
                  <strong>Late Payment:</strong> If payment is not received by the due date, we may
                  suspend or terminate your access to paid features until payment is received.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Content and Intellectual Property */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Content and Intellectual Property</h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>Your Content:</strong> You retain ownership of all content you provide to or
                  create through the Services ("User Content"). By using the Services, you grant us a
                  limited, non-exclusive license to use, process, and display your User Content solely
                  for the purpose of providing the Services to you.
                </p>
                <p>
                  <strong>AI-Generated Content:</strong> Content generated by our AI tools is created for
                  your use. You are responsible for reviewing all AI-generated content before publishing
                  and ensuring it complies with applicable laws, platform policies, and your brand standards.
                </p>
                <p>
                  <strong>Our Property:</strong> The Services, including the platform, software, design,
                  and documentation, are owned by Lumyn Global and protected by intellectual property laws.
                  You may not copy, modify, distribute, or reverse-engineer any part of the Services without
                  our prior written consent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Acceptable Use</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">You agree not to use the Services to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Post or distribute harmful, fraudulent, deceptive, or misleading content</li>
                <li>Engage in spam, phishing, or unauthorized mass messaging</li>
                <li>Attempt to gain unauthorized access to the Services or other users' accounts</li>
                <li>Interfere with or disrupt the integrity or performance of the Services</li>
                <li>Use the Services to generate content that violates social media platform policies</li>
                <li>Resell or redistribute the Services without our written authorization</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account for violations of this policy.
              </p>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Third-Party Services</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Our Services integrate with third-party platforms (e.g., Facebook, Instagram, LinkedIn).
                Your use of these platforms is subject to their respective terms and privacy policies.
                We are not responsible for the availability, accuracy, or content of third-party services.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Changes to third-party APIs or policies may affect the functionality of our Services.
                We will make reasonable efforts to adapt to such changes but cannot guarantee uninterrupted
                integration with all third-party platforms.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, LUMYN GLOBAL SHALL NOT BE LIABLE FOR ANY
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                  LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED
                  TO YOUR USE OF THE SERVICES.
                </p>
                <p>
                  OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE
                  SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING
                  THE CLAIM.
                </p>
                <p>
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                  EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Termination</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  You may terminate your account at any time by contacting us or using the account
                  deletion feature in your settings. We may terminate or suspend your account at any
                  time for violations of these Terms or for any other reason at our discretion.
                </p>
                <p>
                  Upon termination, your right to use the Services will immediately cease. We will
                  make your data available for export for 30 days following termination, after which
                  it may be permanently deleted.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gavel className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Governing Law and Disputes</h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to conflict of law principles. Any disputes arising
                out of or relating to these Terms or the Services shall first be attempted to be
                resolved through good-faith negotiation. If negotiation is unsuccessful, disputes
                shall be resolved through binding arbitration in accordance with applicable rules.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will provide notice of
                material changes by posting the updated Terms on our website and updating the
                "Last updated" date. Your continued use of the Services after such changes constitutes
                your acceptance of the revised Terms. If you do not agree to the new Terms, you must
                stop using the Services.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="text-muted-foreground space-y-1 ml-4">
                <p><strong>Email:</strong> legal@hwinnwin.com</p>
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

export default Terms;
