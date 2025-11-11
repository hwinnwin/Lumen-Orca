import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { exportAuditLogsAsCSV } from "@/lib/audit-logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  event_type: string;
  event_status: string;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  event_details: Record<string, any> | null;
}

export default function AuditLogs() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    userEmail: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadLogs();
    }
  }, [user, isAdmin, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.userEmail) {
        query = query.ilike('user_email', `%${filters.userEmail}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as unknown as AuditLog[]);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAuditLogsAsCSV({
        startDate: filters.startDate,
        endDate: filters.endDate,
        eventType: filters.eventType,
      });
      toast.success('Audit logs exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      success: "default",
      failure: "destructive",
      blocked: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          Track all authentication and security events across the system.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and export audit logs for compliance reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={filters.eventType} onValueChange={(value) => setFilters({ ...filters, eventType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  <SelectItem value="login_success">Login Success</SelectItem>
                  <SelectItem value="login_failed">Login Failed</SelectItem>
                  <SelectItem value="signup_success">Signup Success</SelectItem>
                  <SelectItem value="signup_failed">Signup Failed</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="mfa_enrolled">MFA Enrolled</SelectItem>
                  <SelectItem value="mfa_unenrolled">MFA Unenrolled</SelectItem>
                  <SelectItem value="mfa_verify_success">MFA Verify Success</SelectItem>
                  <SelectItem value="mfa_verify_failed">MFA Verify Failed</SelectItem>
                  <SelectItem value="role_assigned">Role Assigned</SelectItem>
                  <SelectItem value="role_removed">Role Removed</SelectItem>
                  <SelectItem value="rate_limit_blocked">Rate Limit Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">User Email</label>
              <Input
                placeholder="Search by email"
                value={filters.userEmail}
                onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
              />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setFilters({ eventType: '', startDate: '', endDate: '', userEmail: '' })} variant="outline">
              Clear Filters
            </Button>
            <Button onClick={handleExport} disabled={exporting || logs.length === 0}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events ({logs.length})</CardTitle>
          <CardDescription>Showing the most recent 100 audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>{log.event_type.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{getStatusBadge(log.event_status)}</TableCell>
                      <TableCell>{log.user_email || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip_address || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs">
                        {log.event_details ? JSON.stringify(log.event_details) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
