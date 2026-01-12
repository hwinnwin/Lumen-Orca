import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Shield,
  Zap,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Building2,
  Globe,
  Bot,
  BarChart3,
  Clock,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Song</span>
            <span className="text-xs text-muted-foreground">by Lumyn</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Services
            </a>
            <a href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Process
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Results
            </a>
            <Link to="/pricing">
              <Button variant="outline" size="sm">Pricing</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1">
              Your Business, Xong. Your Success, Our Song.
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              We Build It. We Run It.
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent block mt-2">You Own It.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete business—built, managed, and supported forever. Full tech team. Infinite support.
              You just run your business. <span className="font-semibold text-foreground">Money-back guaranteed.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/book-consultation">
                <Button size="lg" className="text-lg px-8 py-6">
                  Book Free Strategy Call
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Packages
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Full Tech Team Included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Infinite Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>90-Day Money-Back</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Starting a Business Shouldn't Be This Hard
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              You have the expertise and the vision. But building an online business requires
              dozens of skills you don't have time to learn.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Tech Overwhelm",
                description: "Websites, apps, integrations, hosting, security—it never ends. One wrong move and everything breaks.",
              },
              {
                title: "Marketing Maze",
                description: "SEO, ads, funnels, email sequences, social media—you need a PhD just to get found online.",
              },
              {
                title: "Time Drain",
                description: "You spend 80% of your time on business operations instead of doing what you're actually good at.",
              },
            ].map((problem, i) => (
              <Card key={i} className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{problem.title}</h3>
                  <p className="text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="services" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Full Managed Service</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              We Handle Everything, <span className="text-violet-500">Forever</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Not just a build—a full tech team on retainer. We build it, host it, secure it,
              update it, and support it. You just focus on your customers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Custom Platform Built For You",
                description: "We design and build your entire platform from scratch. No templates. Fully customized to your business.",
              },
              {
                icon: Bot,
                title: "AI That Works For You",
                description: "Custom AI agents for customer support, content, operations—we build them, we maintain them.",
              },
              {
                icon: Shield,
                title: "We Handle All The Tech",
                description: "Servers, security, updates, backups—that's our job. You never touch a line of code.",
              },
              {
                icon: BarChart3,
                title: "New Features On Demand",
                description: "Need something new? We build it. Your platform evolves as your business grows.",
              },
              {
                icon: Users,
                title: "Full Backend Support",
                description: "Database, APIs, integrations—we manage it all. Infinite customization, zero headaches.",
              },
              {
                icon: TrendingUp,
                title: "Ongoing Development",
                description: "Monthly retainer = continuous improvements. We're your permanent tech team.",
              },
            ].map((feature, i) => (
              <Card key={i} className="group hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">The Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Idea to Income in 30 Days
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four phases. One month. Your business, xong.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Discovery",
                description: "Deep dive into your vision, audience, and goals. We map out your entire business model.",
                duration: "Week 1",
              },
              {
                step: "02",
                title: "Design & Build",
                description: "Our team builds your platform, integrations, and AI automations from scratch.",
                duration: "Weeks 2-3",
              },
              {
                step: "03",
                title: "Launch",
                description: "We go live together. Full support, testing, and optimization for a smooth launch.",
                duration: "Week 4",
              },
              {
                step: "04",
                title: "Scale",
                description: "Ongoing support, strategy calls, and continuous improvements to grow your revenue.",
                duration: "Ongoing",
              },
            ].map((phase, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary/20 mb-2">{phase.step}</div>
                  <h3 className="font-semibold text-lg mb-2">{phase.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{phase.description}</p>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {phase.duration}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Success Stories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real Results From Real Clients
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "Business Coach",
                result: "$127K in first 90 days",
                quote: "I was drowning in tech. They built everything—now I just coach. Revenue tripled.",
                avatar: "SC",
              },
              {
                name: "Marcus Johnson",
                role: "Course Creator",
                result: "10,000+ students enrolled",
                quote: "From zero online presence to a thriving education business. They handled it all.",
                avatar: "MJ",
              },
              {
                name: "Elena Rodriguez",
                role: "Consulting Agency",
                result: "50% time savings with AI",
                quote: "The AI automations alone saved me 20 hours a week. Best investment I've made.",
                avatar: "ER",
              },
            ].map((testimonial, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">Result</div>
                    <div className="font-semibold text-primary">{testimonial.result}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Your Package</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Included
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Platform & Technology</h3>
              {[
                "Custom-designed website (not a template)",
                "Mobile-responsive on all devices",
                "Enterprise hosting & security",
                "Custom domain setup",
                "SSL certificate & CDN",
                "User authentication system",
                "Admin dashboard",
                "Analytics & reporting",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">AI & Automation</h3>
              {[
                "Custom AI agents for your business",
                "Automated customer support",
                "Content generation workflows",
                "Email automation sequences",
                "Multi-LLM system (GPT, Claude, Gemini)",
                "Task automation & scheduling",
                "Intelligent routing & escalation",
                "Performance monitoring",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Infinite Support</h3>
              {[
                "You report it, we fix it",
                "Unlimited support requests",
                "All bug fixes included",
                "Feature requests? We build them",
                "You're our eyes and ears",
                "We're your tech team",
                "Dedicated success manager",
                "Weekly strategy calls",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Business Setup</h3>
              {[
                "Business model consulting",
                "Pricing strategy",
                "Offer positioning",
                "Brand identity guidance",
                "Customer journey mapping",
                "Sales funnel design",
                "Launch strategy",
                "Growth roadmap",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-0">
            <CardContent className="pt-10 pb-10 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Business, Xong.
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                We build it. We run it. You manage your business, we handle everything else.
                Full tech team. Infinite support. Monthly retainer. Done.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/book-consultation">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                    Book Free Strategy Call
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    See Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Song</span>
              <span className="text-xs text-muted-foreground">by Lumyn</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
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

export default Landing;
