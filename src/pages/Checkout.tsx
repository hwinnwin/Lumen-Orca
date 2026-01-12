import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  CheckCircle2,
  Shield,
  Lock,
  CreditCard,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const packages = {
  solo: {
    name: "Solo",
    price: 50000,
    downPayment: 25000,
    monthlyPayment: 4167,
    monthlyTerms: 6,
    features: [
      "Full platform build (30 days)",
      "AI chatbot + lead capture",
      "Tech team on retainer",
      "33.3% equity yours",
    ],
  },
  growth: {
    name: "Growth",
    price: 250000,
    downPayment: 25000,
    monthlyPayment: 18750,
    monthlyTerms: 12,
    features: [
      "Everything in Solo",
      "5 custom AI agents",
      "Multi-LLM system",
      "33.3% equity yours",
    ],
  },
  empire: {
    name: "Empire",
    price: 1000000,
    downPayment: 25000,
    monthlyPayment: 40625,
    monthlyTerms: 24,
    features: [
      "Everything in Growth",
      "White-label platform",
      "Dedicated dev team",
      "33.3% equity yours",
    ],
  },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const packageId = searchParams.get("package") || "growth";
  const selectedPackage = packages[packageId as keyof typeof packages] || packages.growth;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsLoading(true);

    try {
      // Call Stripe checkout edge function
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          packageName: selectedPackage.name,
          amount: selectedPackage.downPayment,
          customerEmail: formData.email,
          customerName: formData.name,
          metadata: {
            phone: formData.phone,
            company: formData.company,
            totalPrice: selectedPackage.price,
            monthlyPayment: selectedPackage.monthlyPayment,
            monthlyTerms: selectedPackage.monthlyTerms,
          },
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Payment system is being set up. Please book a call instead.");
      // Fallback to consultation booking
      setTimeout(() => {
        navigate("/book-consultation");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Link to="/pricing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Complete Your Investment</h1>
                <p className="text-muted-foreground">
                  Secure your spot with a $25K down payment. Money-back guaranteed.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Information</CardTitle>
                  <CardDescription>We'll use this to set up your partnership</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 555-0100"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Money-Back Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <span>Powered by Stripe</span>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay $25,000 Down Payment
                    <Lock className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By proceeding, you agree to our Terms of Service and Partnership Agreement.
                Your card will be charged $25,000. Remaining balance of ${(selectedPackage.price - 25000).toLocaleString()}
                will be billed as ${selectedPackage.monthlyPayment.toLocaleString()}/month for {selectedPackage.monthlyTerms} months.
              </p>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:pl-8">
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                    <Badge variant="secondary">{selectedPackage.name} Package</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Package Features */}
                  <div className="space-y-3">
                    {selectedPackage.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Package Value</span>
                      <span>${selectedPackage.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Your Equity (33.3%)</span>
                      <span className="text-green-600">Included</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Due Today</span>
                      <span className="text-xl">$25,000</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Then ${selectedPackage.monthlyPayment.toLocaleString()}/mo</span>
                      <span>× {selectedPackage.monthlyTerms} months</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Guarantee */}
                  <div className="bg-green-500/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">90-Day Money-Back Guarantee</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Not happy within 90 days? Full refund, no questions asked.
                          We're that confident.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">What happens next:</div>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Payment confirmation email</li>
                      <li>Welcome call scheduled within 24 hours</li>
                      <li>Discovery phase begins (Week 1)</li>
                      <li>Your business launches in 30 days</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
