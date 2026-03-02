import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for demo mode
    const isDemoMode = localStorage.getItem('lumen-demo-mode') === 'true';
    
    if (!loading && !user && !isDemoMode) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access in demo mode even without authentication
  const isDemoMode = localStorage.getItem('lumen-demo-mode') === 'true';
  if (!user && !isDemoMode) {
    return null;
  }

  return <>{children}</>;
};
