import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, LayoutDashboard, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4 max-w-2xl">
        {/* 404 Error Code */}
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-primary glow-primary">
            404
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent glow-primary" />
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          <p className="text-sm text-muted-foreground/70 font-mono">
            Attempted route: <span className="text-primary">{location.pathname}</span>
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild variant="default" size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/dashboard">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link to="/guide">
              <BookOpen className="w-4 h-4" />
              User Guide
            </Link>
          </Button>
        </div>

        {/* Back Button */}
        <div className="pt-4">
          <Button
            variant="link"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2 text-muted-foreground hover:text-primary transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
