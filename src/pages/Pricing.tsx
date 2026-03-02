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
      question: "How does the milestone guarantee work?",
      answer: "We guarantee delivery of agreed milestones by agreed dates. If we fail to deliver a milestone on time, you're entitled to a pro-rata refund for undelivered work. This is objective and rule-based—no ambiguity. You must meet your operating requirements (respond to leads, attend calls, provide assets) for the guarantee to apply.",
    },
    {
      question: "What is the Cash Waterfall?",
      answer: "Revenue flows through a structured waterfall: (1) Tax/GST set-aside, (2) Operating costs, (3) Growth budget floor, (4) Your operator draw, (5) Our recoupment until investment cleared, (6) Then the 66.7/33.3 profit split. This keeps the business funded while we both get paid.",
    },
    {
      question: "Why do you keep 66.7% equity?",
      answer: "Because we're not a vendor—we're co-owners. We build, operate, AND grow the business with you. Our stake means we only profit when you profit. We're financially committed to making this work, not just collecting fees and walking away.",
    },
    {
      question: "What are my operating requirements?",
      answer: "You commit to: 10+ hours/week, responding to leads within agreed SLA, attending weekly ops calls, providing assets within 72 hours, funding agreed ad budget (if applicable), and following the operating playbook. You're the operator—we handle tech, you handle execution.",
    },
    {
      question: "What exactly do I get for $25K down?",
      answer: "A complete revenue-ready system: lead capture, CRM pipeline, AI agents, booking flow, payment processing, and a full tech team on retainer. We build it in 30 days, then operate and optimize it with you ongoing. The $25K is your skin in the game.",
    },
    {
      question: "How does recoupment work?",
      answer: "After the business starts generating revenue, we recoup our remaining investment ($50K for Solo, more for higher tiers) from cash flow before the profit split kicks in. The waterfall ensures the business stays funded during this period.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. You may cancel at any point. Fees earned for delivered milestones are not refundable. Refunds are pro-rated to undelivered work only. No lock-in, no hidden penalties—just clear terms.",
    },
    {
      question: "Can I buy out your equity later?",
      answer: "Yes. Once the business hits defined revenue milestones, you have the option to buy out our stake at a pre-agreed multiple. Terms are in the agreement upfront—no surprises.",
    },
    {
      question: "Do I need technical skills?",
      answer: "Zero. You're our eyes and ears—you tell us what's working, what needs fixing, what customers are saying. We handle all technical execution. Your job is to operate and communicate. Our job is to build and support.",
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
            <span className="text-xl font-bold">Lumen Orca</span>
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
          <Badge variant="secondary" className="mb-4">$25K USD Down • Milestone Guarantee</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Build. Operate. <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">Transfer.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We build your revenue machine, operate it with you, then you keep 33.3% equity.
            Milestone-based guarantee. Cash waterfall model. You're an operator, not a passenger.
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
                    Milestone guarantee
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Client Requirements */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">Operating Requirements</Badge>
            <h2 className="text-2xl font-bold mb-2">You're an Operator, Not a Passenger</h2>
            <p className="text-muted-foreground">
              This is a partnership. We handle tech. You handle execution. Here's what we need from you:
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { req: "10+ hours/week availability", desc: "Or a dedicated team member" },
              { req: "Respond to leads within SLA", desc: "Or use our AI agents" },
              { req: "Attend weekly ops calls", desc: "30-60 minutes per week" },
              { req: "Provide assets within 72 hours", desc: "Content, branding, access" },
              { req: "Fund agreed ad budget", desc: "If paid traffic is part of the model" },
              { req: "Follow the operating playbook", desc: "SOPs exist for a reason" },
              { req: "No cowboy pricing/offer changes", desc: "Joint approval required" },
              { req: "Close sales or use our closer", desc: "Revenue requires conversion" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{item.req}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            If you can't commit to these, this isn't the right fit. We say no to protect both sides.
          </p>
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
              <span className="text-xl font-bold">Lumen Orca</span>
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
