import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  XCircle,
  ArrowLeft,
  Phone,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

const PaymentCancelled = () => {
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
          <div className="mb-8">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Payment Cancelled
            </h1>
            <p className="text-lg text-muted-foreground">
              No worries—your card wasn't charged. We're here when you're ready.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-4">Have Questions?</h2>
              <p className="text-muted-foreground mb-6">
                Big decisions take time. If you have any questions or concerns,
                we'd love to chat—no pressure.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <Link to="/book-consultation" className="block">
                  <Card className="h-full hover:border-violet-500 transition-colors cursor-pointer">
                    <CardContent className="pt-6 text-center">
                      <Phone className="h-8 w-8 text-violet-500 mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Book a Call</h3>
                      <p className="text-sm text-muted-foreground">
                        Free 30-min strategy session
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                <a href="mailto:hello@lumyn.global" className="block">
                  <Card className="h-full hover:border-violet-500 transition-colors cursor-pointer">
                    <CardContent className="pt-6 text-center">
                      <MessageSquare className="h-8 w-8 text-violet-500 mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Email Us</h3>
                      <p className="text-sm text-muted-foreground">
                        hello@lumyn.global
                      </p>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <HelpCircle className="h-6 w-6 text-violet-500 shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-semibold mb-1">Remember Our Guarantee</h3>
                  <p className="text-sm text-muted-foreground">
                    We offer a full money-back guarantee during the discovery phase.
                    If you're not 100% confident in the direction, you get every penny back.
                    Zero risk.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pricing
              </Button>
            </Link>
            <Link to="/home">
              <Button size="lg">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
