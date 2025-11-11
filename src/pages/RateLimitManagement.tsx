import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Trash2 } from "lucide-react";

interface RateLimitConfig {
  id: string;
  endpoint: string;
  max_attempts: number;
  window_minutes: number;
  block_duration_minutes: number;
}

interface RateLimitAttempt {
  id: string;
  ip_address: string;
  endpoint: string;
  attempts: number;
  last_attempt_at: string;
  blocked_until: string | null;
}

export default function RateLimitManagement() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [attempts, setAttempts] = useState<RateLimitAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      } else {
        loadData();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configResult, attemptsResult] = await Promise.all([
        supabase.from('rate_limit_config').select('*').order('endpoint'),
        supabase.from('rate_limit_attempts').select('*').order('last_attempt_at', { ascending: false }).limit(50),
      ]);

      if (configResult.data) setConfigs(configResult.data);
      if (attemptsResult.data) setAttempts(attemptsResult.data);
    } catch (error) {
      console.error('Error loading rate limit data:', error);
      toast({
        title: "Error",
        description: "Failed to load rate limit data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (config: RateLimitConfig) => {
    try {
      const { error } = await supabase
        .from('rate_limit_config')
        .update({
          max_attempts: config.max_attempts,
          window_minutes: config.window_minutes,
          block_duration_minutes: config.block_duration_minutes,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rate limit configuration updated",
      });
      setEditingConfig(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  const unblockIp = async (attemptId: string, ipAddress: string) => {
    try {
      const { error } = await supabase
        .from('rate_limit_attempts')
        .delete()
        .eq('id', attemptId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Unblocked IP: ${ipAddress}`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock IP",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Rate Limit Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure rate limiting thresholds and manage blocked IPs.
        </p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertTitle>Brute Force Protection Active</AlertTitle>
        <AlertDescription>
          Rate limiting is protecting your authentication endpoints from brute force attacks.
          Adjust thresholds below to balance security and user experience.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rate Limit Configuration</CardTitle>
          <CardDescription>
            Manage threshold settings for different endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Max Attempts</TableHead>
                <TableHead>Time Window (min)</TableHead>
                <TableHead>Block Duration (min)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{config.endpoint}</TableCell>
                  <TableCell>
                    {editingConfig === config.id ? (
                      <Input
                        type="number"
                        value={config.max_attempts}
                        onChange={(e) => {
                          setConfigs(configs.map(c => 
                            c.id === config.id ? { ...c, max_attempts: parseInt(e.target.value) } : c
                          ));
                        }}
                        className="w-20"
                      />
                    ) : (
                      config.max_attempts
                    )}
                  </TableCell>
                  <TableCell>
                    {editingConfig === config.id ? (
                      <Input
                        type="number"
                        value={config.window_minutes}
                        onChange={(e) => {
                          setConfigs(configs.map(c => 
                            c.id === config.id ? { ...c, window_minutes: parseInt(e.target.value) } : c
                          ));
                        }}
                        className="w-20"
                      />
                    ) : (
                      config.window_minutes
                    )}
                  </TableCell>
                  <TableCell>
                    {editingConfig === config.id ? (
                      <Input
                        type="number"
                        value={config.block_duration_minutes}
                        onChange={(e) => {
                          setConfigs(configs.map(c => 
                            c.id === config.id ? { ...c, block_duration_minutes: parseInt(e.target.value) } : c
                          ));
                        }}
                        className="w-20"
                      />
                    ) : (
                      config.block_duration_minutes
                    )}
                  </TableCell>
                  <TableCell>
                    {editingConfig === config.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateConfig(config)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingConfig(null);
                          loadData();
                        }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setEditingConfig(config.id)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Rate Limit Attempts</CardTitle>
          <CardDescription>
            View and manage blocked IP addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Last Attempt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No rate limit attempts recorded
                  </TableCell>
                </TableRow>
              ) : (
                attempts.map((attempt) => {
                  const isBlocked = attempt.blocked_until && new Date(attempt.blocked_until) > new Date();
                  return (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-mono">{attempt.ip_address}</TableCell>
                      <TableCell>{attempt.endpoint}</TableCell>
                      <TableCell>{attempt.attempts}</TableCell>
                      <TableCell>{new Date(attempt.last_attempt_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {isBlocked ? (
                          <span className="text-destructive font-semibold">
                            Blocked until {new Date(attempt.blocked_until!).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Active</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unblockIp(attempt.id, attempt.ip_address)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
