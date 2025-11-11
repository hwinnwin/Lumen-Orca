import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

export function MfaEnrollment() {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.factors && user.factors.length > 0) {
        setEnrolled(true);
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const enrollMfa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      if (data) {
        setSecret(data.totp.secret);
        
        // Generate QR code
        const qrCodeUrl = data.totp.qr_code;
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
        setQrCode(qrCodeDataUrl);

        toast({
          title: "MFA Enrollment Started",
          description: "Scan the QR code with your authenticator app.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data?.totp && factors.data.totp.length > 0) {
        const factorId = factors.data.totp[0].id;

        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: verifyCode,
        });

        if (error) throw error;

        setEnrolled(true);
        toast({
          title: "MFA Enabled Successfully",
          description: "Your account is now protected with two-factor authentication.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unenrollMfa = async () => {
    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data?.totp && factors.data.totp.length > 0) {
        const factorId = factors.data.totp[0].id;
        
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) throw error;

        setEnrolled(false);
        setQrCode("");
        setSecret("");
        setVerifyCode("");
        
        toast({
          title: "MFA Disabled",
          description: "Two-factor authentication has been removed from your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unenrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (enrolled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            MFA Enabled
          </CardTitle>
          <CardDescription>
            Your account is protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={unenrollMfa} 
            disabled={loading}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disable MFA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enable Multi-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your admin account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrCode ? (
          <Button onClick={enrollMfa} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start MFA Setup
          </Button>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col items-center gap-4">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              
              <div className="w-full">
                <Label>Or enter this secret key manually:</Label>
                <code className="block p-2 bg-muted rounded mt-2 text-sm break-all">
                  {secret}
                </code>
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="verify-code">Enter 6-digit verification code:</Label>
                <Input
                  id="verify-code"
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </div>

              <Button onClick={verifyAndEnable} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify and Enable MFA
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
