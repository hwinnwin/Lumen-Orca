import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { MfaEnrollment } from "@/components/auth/MfaEnrollment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function MfaSetup() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      } else {
        setAuthorized(true);
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !authorized) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and authentication methods.
        </p>
      </div>

      <Alert className="mb-6">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Administrator Security</AlertTitle>
        <AlertDescription>
          As an administrator, we strongly recommend enabling multi-factor authentication
          to protect sensitive system access and data.
        </AlertDescription>
      </Alert>

      <MfaEnrollment />
    </div>
  );
}
