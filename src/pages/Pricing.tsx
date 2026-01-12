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
        "3 months of support",
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
      price: 100000,
      downPayment: 25000,
      monthlyPayment: 6250,
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
        "Custom workflows",
        "Advanced analytics",
        "30-day launch timeline",
        "6 months of support",
        "Weekly strategy calls",
        "Dedicated success manager",
        "Priority support channel",
      ],
      notIncluded: [
        "White-label platform",
        "API access",
      ],
    },
    {
      name: "Empire",
      description: "Full-scale platform with white-label and unlimited everything",
      price: 250000,
      downPayment: 25000,
      monthlyPayment: 9375,
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
        "12 months of support",
        "Unlimited strategy calls",
        "24/7 priority support",
        "Quarterly business reviews",
        "Revenue share option available",
      ],
      notIncluded: [],
    },
  ];

  const faqs = [
    {
      question: "What exactly do I get for my investment?",
      answer: "You get a complete, custom-built online business platform. This includes a professional website, AI automation systems, user management, analytics, and all the infrastructure needed to run your business online. We build it, launch it, and support you through growth.",
    },
    {
      question: "How long does it take to launch?",
      answer: "Our standard launch timeline is 30 days from project kickoff. During week 1 we do discovery and planning, weeks 2-3 are build and development, and week 4 is testing and launch. Enterprise projects may take 45-60 days depending on complexity.",
    },
    {
      question: "What if I don't have a business idea yet?",
      answer: "That's okay! Our discovery process includes business model consulting. We'll help you identify the right business model based on your skills, experience, and goals. Many of our most successful clients started with just a vague idea.",
    },
    {
      question: "Do I need technical skills?",
      answer: "Absolutely not. We handle all the technical work. You'll receive training on how to use your platform, but you won't need to code, design, or manage servers. That's what we're here for.",
    },
    {
      question: "What's included in the ongoing support?",
      answer: "Support includes regular strategy calls, technical support, bug fixes, minor updates, and ongoing optimization. We're invested in your success—when you grow, we grow.",
    },
    {
      question: "Can I pay in installments?",
      answer: "Yes! All packages offer a payment plan option. You pay a down payment to start, then monthly payments over 6 months. This makes it accessible while ensuring commitment from both sides.",
    },
    {
      question: "What if I'm not satisfied?",
      answer: "We offer a satisfaction guarantee through the discovery phase. If after our initial discovery call and planning session you don't feel confident in the direction, we'll refund your deposit. Once development begins, we work closely with you to ensure the final product exceeds expectations.",
    },
    {
      question: "Do you offer ongoing services after launch?",
      answer: "Yes! After your initial support period, you can continue with a monthly retainer for ongoing development, optimization, and growth support. Many clients choose to stay on for continued scaling.",
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
          <Badge variant="secondary" className="mb-4">$25K to Start</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Business, <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">Xong</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One down payment. One complete business. Ongoing support to scale.
            Choose your level and let's make it happen.
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
                        + ${pkg.monthlyPayment.toLocaleString()}/mo × {pkg.monthlyTerms} months
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
                  <Link to="/book-consultation" className="w-full">
                    <Button
                      className="w-full"
                      size="lg"
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      Book Strategy Call
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="text-xs text-center text-muted-foreground">
                    30-minute call • No obligation
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
