import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Crown,
  Building2,
  Star,
  Phone,
  HelpCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Pricing = () => {
  const packages = [
    {
      name: "Solo",
      description: "Perfect for solopreneurs launching their first online business",
      price: 50000,
      downPayment: 25000,
      monthlyPayment: 4167,
      monthlyTerms: 6,
      icon: Zap,
      popular: false,
      features: [
        "Custom website (up to 10 pages)",
        "Mobile-responsive design",
        "AI chatbot assistant",
        "Email automation (3 sequences)",
        "User authentication",
        "Admin dashboard",
        "Analytics & reporting",
        "SSL & enterprise security",
        "30-day launch timeline",
        "Unlimited bug fixes",
        "You report, we resolve",
        "2 strategy calls per month",
      ],
      notIncluded: [
        "Multiple AI agents",
        "Multi-LLM system",
        "Custom integrations",
        "Priority support",
      ],
    },
    {
      name: "Growth",
      description: "Scale with AI-powered automation and dedicated support",
      price: 250000,
      downPayment: 25000,
      monthlyPayment: 18750,
      monthlyTerms: 12,
      icon: Crown,
      popular: true,
      features: [
        "Everything in Solo, plus:",
        "Unlimited pages",
        "Advanced AI agents (5 custom)",
        "Multi-LLM system (GPT, Claude, Gemini)",
        "Full email automation suite",
        "CRM integration",
        "Payment processing (Stripe)",
        "Custom workflows & features on demand",
        "Advanced analytics",
        "30-day launch timeline",
        "Full tech team on retainer",
        "Unlimited support requests",
        "Weekly strategy calls",
        "Dedicated success manager",
      ],
      notIncluded: [
        "White-label platform",
        "API access",
      ],
    },
    {
      name: "Empire",
      description: "Full-scale platform with white-label and unlimited everything",
      price: 1000000,
      downPayment: 25000,
      monthlyPayment: 40625,
      monthlyTerms: 24,
      icon: Building2,
      popular: false,
      features: [
        "Everything in Growth, plus:",
        "White-label platform",
        "Unlimited AI agents",
        "Custom LLM fine-tuning",
        "Full API access",
        "Multi-tenant architecture",
        "Custom integrations (unlimited)",
        "Dedicated development team",
        "99.9999% uptime SLA",
        "Enterprise security audit",
        "24/7 priority support",
        "You request, we build",
        "Full backend customization",
        "Unlimited feature development",
        "Your own tech department",
      ],
      notIncluded: [],
    },
  ];

  const faqs = [
    {
      question: "Why do you keep 66.7% equity?",
      answer: "Because we're not just a vendor—we're your partner. We build, launch, AND grow your business alongside you. Our 66.7% stake means we're financially invested in your success. We don't profit unless you profit. This aligns our incentives completely.",
    },
    {
      question: "What's the money-back guarantee?",
      answer: "Not happy with your launched business? Request a full refund within 90 days of kickoff—no questions asked. We'll return 100% of your $25K. We're that confident in what we deliver.",
    },
    {
      question: "What exactly do I get for $25K?",
      answer: "A complete, revenue-ready online business: custom website, AI automation, user management, analytics, payment processing—everything. Plus a full tech team on retainer. You tell us what you need, we build it. You report issues, we fix them. It's like having your own tech department.",
    },
    {
      question: "How long does it take to launch?",
      answer: "30 days from kickoff. Week 1: discovery and planning. Weeks 2-3: build and development. Week 4: testing and launch. Your business will be live and taking customers within a month.",
    },
    {
      question: "What if I don't have a business idea yet?",
      answer: "Perfect—that's what discovery is for. We'll identify the right business model based on your skills, experience, and market opportunities. Many of our best businesses started as 'I'm not sure what to build.'",
    },
    {
      question: "Do I need technical skills?",
      answer: "Zero. You're our eyes and ears—you tell us what's working, what needs fixing, and what new features you want. We handle all the technical execution. Your job is to run your business and communicate what you need. Our job is to make it happen.",
    },
    {
      question: "How does the profit split work?",
      answer: "You keep 33.3% of all profits. We keep 66.7%. Distributions happen monthly. Full transparency—you'll have access to all financial dashboards and reports.",
    },
    {
      question: "Can I buy out your equity later?",
      answer: "Yes. Once the business reaches certain revenue milestones, you'll have the option to buy out our stake at a pre-agreed multiple. We want you to succeed—even if that means eventually going solo.",
    },
    {
      question: "What does the monthly retainer include?",
      answer: "Everything technical. Bug fixes, server maintenance, security updates, new feature development, platform customizations—unlimited requests. You're our eyes and ears: you spot issues or need something new, you tell us, we handle it. It's like having a full tech team on staff without the hiring headaches.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Song</span>
            <span className="text-xs text-muted-foreground">by Lumyn</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge variant="secondary" className="mb-4">$25K Down • Money-Back Guarantee</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Business, <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">Xong</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Done-for-you platform + full tech team on retainer. We build it, run it, and support it forever.
            You focus on customers. We handle everything else.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, i) => (
              <Card
                key={i}
                className={`relative ${pkg.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <pkg.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold">
                      ${pkg.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Investment
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-lg font-semibold">
                        ${pkg.downPayment.toLocaleString()} down
                      </div>
                      <div className="text-sm text-muted-foreground">
                        + ${pkg.monthlyPayment.toLocaleString()}/mo retainer × {pkg.monthlyTerms} months
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Includes full tech support & development
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {pkg.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {pkg.notIncluded.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3 opacity-50">
                        <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Link to={`/checkout?package=${pkg.name.toLowerCase()}`} className="w-full">
                    <Button
                      className={`w-full ${pkg.popular ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700' : ''}`}
                      size="lg"
                      variant={pkg.popular ? "default" : "default"}
                    >
                      Get Started - $25K Down
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/book-consultation" className="w-full">
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      Book Free Call First
                    </Button>
                  </Link>
                  <div className="text-xs text-center text-muted-foreground">
                    Money-back guaranteed
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare Packages</h2>
            <p className="text-muted-foreground">
              See exactly what's included at each level
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">Starter</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary">Professional</th>
                  <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Custom Website", starter: "10 pages", pro: "Unlimited", enterprise: "Unlimited" },
                  { feature: "AI Agents", starter: "1 basic", pro: "5 custom", enterprise: "Unlimited" },
                  { feature: "LLM Providers", starter: "1", pro: "3 (GPT, Claude, Gemini)", enterprise: "All + custom" },
                  { feature: "Email Sequences", starter: "3", pro: "Unlimited", enterprise: "Unlimited" },
                  { feature: "Integrations", starter: "Basic", pro: "Standard", enterprise: "Custom unlimited" },
                  { feature: "Support Duration", starter: "60 days", pro: "6 months", enterprise: "12 months" },
                  { feature: "Strategy Calls", starter: "2/month", pro: "Weekly", enterprise: "Unlimited" },
                  { feature: "Success Manager", starter: false, pro: true, enterprise: true },
                  { feature: "Priority Support", starter: false, pro: true, enterprise: "24/7" },
                  { feature: "White-label", starter: false, pro: false, enterprise: true },
                  { feature: "API Access", starter: false, pro: false, enterprise: true },
                  { feature: "Uptime SLA", starter: "99.9%", pro: "99.99%", enterprise: "99.9999%" },
                ].map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Still Have Questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Book a free strategy call. We'll answer all your questions and help you decide
            if this is right for you—no pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation">
              <Button size="lg" className="text-lg px-8 py-6">
                <Phone className="mr-2 h-5 w-5" />
                Book Free Strategy Call
              </Button>
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
              <span className="text-xl font-bold">Song</span>
              <span className="text-xs text-muted-foreground">by Lumyn</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/home" className="hover:text-foreground transition-colors">Home</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
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

export default Pricing;
