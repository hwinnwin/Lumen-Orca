import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rocket,
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
} from "lucide-react";

const ROICalculator = () => {
  const [currentRevenue, setCurrentRevenue] = useState(5000);
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [hourlyValue, setHourlyValue] = useState(150);
  const [expectedGrowth, setExpectedGrowth] = useState(50);
  const [selectedPackage, setSelectedPackage] = useState("Professional");

  const packages = {
    Starter: { price: 25000, aiAgents: 1, automationHours: 10 },
    Professional: { price: 50000, aiAgents: 5, automationHours: 25 },
    Enterprise: { price: 100000, aiAgents: 999, automationHours: 40 },
  };

  const calculations = useMemo(() => {
    const pkg = packages[selectedPackage as keyof typeof packages];

    // Time savings from automation
    const weeklyHoursSaved = Math.min(hoursPerWeek * 0.6, pkg.automationHours);
    const yearlyHoursSaved = weeklyHoursSaved * 52;
    const timeSavingsValue = yearlyHoursSaved * hourlyValue;

    // Revenue growth from better systems
    const monthlyRevenueIncrease = currentRevenue * (expectedGrowth / 100);
    const yearlyRevenueIncrease = monthlyRevenueIncrease * 12;

    // Total first year value
    const firstYearValue = timeSavingsValue + yearlyRevenueIncrease;

    // ROI
    const roi = ((firstYearValue - pkg.price) / pkg.price) * 100;

    // Payback period in months
    const monthlyValue = firstYearValue / 12;
    const paybackMonths = pkg.price / monthlyValue;

    // 3-year projection
    const threeYearValue = firstYearValue * 3.5; // Compound growth

    return {
      weeklyHoursSaved,
      yearlyHoursSaved,
      timeSavingsValue,
      monthlyRevenueIncrease,
      yearlyRevenueIncrease,
      firstYearValue,
      roi,
      paybackMonths,
      threeYearValue,
      investment: pkg.price,
    };
  }, [currentRevenue, hoursPerWeek, hourlyValue, expectedGrowth, selectedPackage]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LaunchPad</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link to="/book-consultation">
              <Button size="sm">Book a Call</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Calculator className="h-3 w-3 mr-1" />
              ROI Calculator
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Calculate Your Return on Investment
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how much value our done-for-you business platform can generate for you.
              Adjust the inputs to match your situation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Current Situation</CardTitle>
                  <CardDescription>Tell us about your business today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Revenue */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Current Monthly Revenue</Label>
                      <span className="font-semibold">${currentRevenue.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[currentRevenue]}
                      onValueChange={(v) => setCurrentRevenue(v[0])}
                      min={0}
                      max={100000}
                      step={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>$100K+</span>
                    </div>
                  </div>

                  {/* Hours on Operations */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Hours/Week on Tech & Operations</Label>
                      <span className="font-semibold">{hoursPerWeek} hours</span>
                    </div>
                    <Slider
                      value={[hoursPerWeek]}
                      onValueChange={(v) => setHoursPerWeek(v[0])}
                      min={5}
                      max={60}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 hrs</span>
                      <span>60 hrs</span>
                    </div>
                  </div>

                  {/* Hourly Value */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Value of Your Time ($/hour)</Label>
                      <span className="font-semibold">${hourlyValue}</span>
                    </div>
                    <Slider
                      value={[hourlyValue]}
                      onValueChange={(v) => setHourlyValue(v[0])}
                      min={50}
                      max={500}
                      step={25}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$50</span>
                      <span>$500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Expectations</CardTitle>
                  <CardDescription>How much do you expect to grow?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Expected Growth */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Expected Monthly Revenue Increase</Label>
                      <span className="font-semibold">{expectedGrowth}%</span>
                    </div>
                    <Slider
                      value={[expectedGrowth]}
                      onValueChange={(v) => setExpectedGrowth(v[0])}
                      min={10}
                      max={200}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10%</span>
                      <span>200%+</span>
                    </div>
                  </div>

                  {/* Package Selection */}
                  <div className="space-y-2">
                    <Label>Select Package</Label>
                    <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Starter">Starter ($25,000)</SelectItem>
                        <SelectItem value="Professional">Professional ($50,000)</SelectItem>
                        <SelectItem value="Enterprise">Enterprise ($100,000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {/* Main ROI Card */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-2">Your First Year ROI</div>
                    <div className="text-6xl font-bold mb-2">
                      {calculations.roi > 0 ? "+" : ""}{Math.round(calculations.roi)}%
                    </div>
                    <div className="text-sm opacity-80">
                      ${Math.round(calculations.firstYearValue).toLocaleString()} value on ${calculations.investment.toLocaleString()} investment
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Time Saved</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(calculations.yearlyHoursSaved)} hrs/year
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Worth ${Math.round(calculations.timeSavingsValue).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Revenue Growth</span>
                    </div>
                    <div className="text-2xl font-bold">
                      +${Math.round(calculations.monthlyRevenueIncrease).toLocaleString()}/mo
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${Math.round(calculations.yearlyRevenueIncrease).toLocaleString()}/year
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Payback Period</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(calculations.paybackMonths)} months
                    </div>
                    <div className="text-sm text-muted-foreground">
                      To recover investment
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="font-semibold">3-Year Value</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ${Math.round(calculations.threeYearValue).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Projected returns
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* What You Get */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's Included in {selectedPackage}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      `Custom-built website & platform`,
                      `${packages[selectedPackage as keyof typeof packages].aiAgents === 999 ? "Unlimited" : packages[selectedPackage as keyof typeof packages].aiAgents} AI agent${packages[selectedPackage as keyof typeof packages].aiAgents > 1 ? "s" : ""} for automation`,
                      `Up to ${packages[selectedPackage as keyof typeof packages].automationHours} hours/week of tasks automated`,
                      selectedPackage === "Enterprise" ? "White-label platform" : "Full user management",
                      selectedPackage !== "Starter" ? "Dedicated success manager" : "Email support",
                      `${selectedPackage === "Starter" ? "60 days" : selectedPackage === "Professional" ? "6 months" : "12 months"} of support`,
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    Ready to See These Returns?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Book a free strategy call to discuss your specific situation
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/book-consultation">
                      <Button size="lg">
                        Book Free Strategy Call
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/pricing">
                      <Button size="lg" variant="outline">
                        View All Packages
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              * These calculations are estimates based on your inputs and typical client results.
              Actual results may vary based on your specific situation, industry, and execution.
              We'll discuss realistic expectations during your strategy call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
