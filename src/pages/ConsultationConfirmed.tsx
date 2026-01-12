import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Rocket,
  CheckCircle2,
  Calendar,
  Mail,
  ArrowRight,
  Clock,
  Video,
  FileText,
} from "lucide-react";

const ConsultationConfirmed = () => {
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="mb-8">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              You're All Set!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your strategy call has been booked. Check your email for the calendar invite.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-6">What Happens Next</h2>
              <div className="space-y-6 text-left">
                {[
                  {
                    icon: Mail,
                    title: "Check Your Email",
                    description: "You'll receive a confirmation email with your calendar invite and a link to join the call.",
                  },
                  {
                    icon: FileText,
                    title: "Complete the Questionnaire",
                    description: "We'll send you a brief questionnaire to help us prepare for your call. Fill it out for a more productive session.",
                  },
                  {
                    icon: Video,
                    title: "Join Your Call",
                    description: "At your scheduled time, click the link in your calendar invite to join the video call.",
                  },
                  {
                    icon: Clock,
                    title: "30 Minutes of Pure Value",
                    description: "We'll dive deep into your goals, challenges, and create a roadmap for your business.",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 mb-8">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-4">Prepare for Success</h2>
              <p className="text-sm text-muted-foreground mb-4">
                To make the most of our time together, consider:
              </p>
              <ul className="text-sm text-left space-y-2">
                {[
                  "Your biggest business goal for the next 12 months",
                  "What's currently stopping you from achieving it",
                  "Your available budget and timeline",
                  "Any specific questions you want answered",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/home">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg">
                Explore Packages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationConfirmed;
