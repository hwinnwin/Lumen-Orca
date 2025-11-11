import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkRateLimit, recordSuccessfulAuth } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit-logger";

interface MfaVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MfaVerification({ factorId, onSuccess, onCancel }: MfaVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const verifyMfa = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check rate limit before attempting MFA verification
      const rateLimitCheck = await checkRateLimit('mfa_verify', 'attempt');
      
      if (!rateLimitCheck.allowed) {
        toast({
          title: "Too Many Attempts",
          description: rateLimitCheck.message || "Please try again later",
          variant: "destructive",
        });
        
        // Log failed attempt
        if (user) {
          await logAuditEvent({
            eventType: 'mfa_verify_failed',
            eventStatus: 'blocked',
            userId: user.id,
            userEmail: user.email,
            eventDetails: { reason: 'rate_limit', factor_id: factorId },
          });
        }
        
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error) {
        // Log failed verification
        if (user) {
          await logAuditEvent({
            eventType: 'mfa_verify_failed',
            eventStatus: 'failure',
            userId: user.id,
            userEmail: user.email,
            eventDetails: { error: error.message, factor_id: factorId },
          });
        }
        throw error;
      }

      // Record successful MFA verification to reset rate limit
      await recordSuccessfulAuth('mfa_verify');

      // Log successful verification
      if (user) {
        await logAuditEvent({
          eventType: 'mfa_verify_success',
          eventStatus: 'success',
          userId: user.id,
          userEmail: user.email,
          eventDetails: { factor_id: factorId },
        });
      }

      toast({
        title: "Verification Successful",
        description: "You are now logged in.",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Authentication Code</Label>
          <Input
            id="mfa-code"
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                verifyMfa();
              }
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={verifyMfa} disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
          <Button onClick={onCancel} variant="outline" disabled={loading}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
