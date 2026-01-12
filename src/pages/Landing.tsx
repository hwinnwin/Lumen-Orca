import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
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
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LaunchPad</span>
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
              Done-For-You Business Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              We Build Your Entire
              <span className="text-primary block mt-2">Online Business</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop struggling with tech, marketing, and operations. We handle everything—from
              website to AI automation to growth strategy. You focus on your expertise.
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
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>100% Done For You</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Ongoing Support</span>
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
            <Badge variant="secondary" className="mb-4">Our Solution</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need, Built For You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We deliver a complete, revenue-ready business platform. Not templates.
              Not courses. A real business, built and launched.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Custom Website & Platform",
                description: "Professional, conversion-optimized website built on enterprise-grade infrastructure.",
              },
              {
                icon: Bot,
                title: "AI Automation Suite",
                description: "Custom AI agents that handle customer service, content, operations, and more.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level security with 99.9999% uptime guarantee. Your business never sleeps.",
              },
              {
                icon: BarChart3,
                title: "Analytics & Insights",
                description: "Real-time dashboards showing every metric that matters for your business.",
              },
              {
                icon: Users,
                title: "User Management",
                description: "Full authentication, roles, permissions—manage your team and customers effortlessly.",
              },
              {
                icon: TrendingUp,
                title: "Growth Strategy",
                description: "Ongoing coaching and optimization to scale your revenue month over month.",
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
            <Badge variant="secondary" className="mb-4">Our Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Vision to Launch in 30 Days
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our proven 4-phase process takes you from idea to revenue-generating business.
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
              <h3 className="text-xl font-semibold mb-4">Support & Growth</h3>
              {[
                "1-on-1 strategy sessions",
                "Dedicated success manager",
                "Weekly check-in calls",
                "Priority support channel",
                "Monthly performance reviews",
                "Ongoing optimization",
                "Training & documentation",
                "Community access",
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
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-10 pb-10 text-center">
              <HeartHandshake className="h-12 w-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Launch Your Business?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Book a free 30-minute strategy call. We'll map out exactly how to bring your
                business online—no pressure, no obligation.
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
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LaunchPad</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 LaunchPad. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
