import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  CheckCircle2,
  PartyPopper,
  Calendar,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        setIsLoading(false);
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#8b5cf6', '#d946ef', '#22c55e'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#8b5cf6', '#d946ef', '#22c55e'],
      });
    }, 250);

    setTimeout(() => setIsLoading(false), 1500);

    return () => clearInterval(interval);
  }, []);

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
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-violet-500 mb-4" />
              <p className="text-muted-foreground">Processing your payment...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <PartyPopper className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Welcome to the Family!
                </h1>
                <p className="text-xl text-muted-foreground">
                  Your payment was successful. Let's build something amazing together.
                </p>
              </div>

              <Card className="mb-8 text-left">
                <CardContent className="pt-6">
                  <h2 className="font-semibold text-lg mb-6 text-center">What Happens Next</h2>
                  <div className="space-y-6">
                    {[
                      {
                        icon: Mail,
                        title: "Check Your Email",
                        description: "You'll receive a confirmation email with your receipt and partnership agreement within the next few minutes.",
                        time: "Now",
                      },
                      {
                        icon: Calendar,
                        title: "Welcome Call",
                        description: "Our team will reach out within 24 hours to schedule your kickoff call. This is where the magic begins.",
                        time: "Within 24 hours",
                      },
                      {
                        icon: Sparkles,
                        title: "Discovery Phase",
                        description: "During Week 1, we'll dive deep into your vision, map out your business model, and define exactly what we're building.",
                        time: "Week 1",
                      },
                      {
                        icon: CheckCircle2,
                        title: "Your Business, Xong",
                        description: "In 30 days, your complete online business will be live and ready to generate revenue.",
                        time: "Day 30",
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <step.icon className="h-5 w-5 text-violet-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{step.title}</h3>
                            <span className="text-xs text-muted-foreground">{step.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-0 mb-8">
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-semibold text-lg mb-2">Your Partnership Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="opacity-80">Your Equity</div>
                      <div className="font-semibold text-lg">33.3%</div>
                    </div>
                    <div>
                      <div className="opacity-80">Down Payment</div>
                      <div className="font-semibold text-lg">$25,000 Paid</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/portal">
                  <Button size="lg" className="bg-gradient-to-r from-violet-600 to-fuchsia-600">
                    Go to Client Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/home">
                  <Button size="lg" variant="outline">
                    Back to Home
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground mt-8">
                Questions? Email us at <a href="mailto:hello@lumyn.global" className="text-violet-500 hover:underline">hello@lumyn.global</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
