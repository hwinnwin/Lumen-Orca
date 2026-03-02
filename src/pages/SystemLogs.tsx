import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { exportAuditLogsAsCSV } from '@/lib/audit-logger';

interface AuditLog {
  id: string;
  event_type: string;
  event_status: string;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_details: Record<string, any> | null;
  created_at: string;
}

export default function SystemLogs() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Check authentication and admin status
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      toast.error('Access denied: Admin privileges required');
      navigate('/');
      return;
    }
  }, [user, isAdmin, navigate]);

  // Load logs
  useEffect(() => {
    if (user && isAdmin) {
      loadLogs();
    }
  }, [user, isAdmin, eventTypeFilter, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs((data || []) as unknown as AuditLog[]);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAuditLogsAsCSV({
        eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined
      });
      toast.success('System logs exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setEventTypeFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400">Success</Badge>;
      case 'failure':
        return <Badge variant="destructive">Failure</Badge>;
      case 'blocked':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventCategory = (eventType: string): string => {
    if (eventType.includes('agent_task') || eventType.includes('orchestrator')) return 'Agent';
    if (eventType.includes('llm_call')) return 'LLM';
    if (eventType.includes('code_execution')) return 'Execution';
    if (eventType.includes('login') || eventType.includes('signup') || eventType.includes('mfa')) return 'Auth';
    if (eventType.includes('rate_limit')) return 'Security';
    return 'System';
  };

  const getCategoryBadge = (eventType: string) => {
    const category = getEventCategory(eventType);
    const colors = {
      Agent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      LLM: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      Execution: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      Auth: 'bg-green-500/10 text-green-600 dark:text-green-400',
      Security: 'bg-red-500/10 text-red-600 dark:text-red-400',
      System: 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    };
    
    return <Badge variant="outline" className={colors[category as keyof typeof colors]}>{category}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.event_type.toLowerCase().includes(search) ||
      log.user_email?.toLowerCase().includes(search) ||
      JSON.stringify(log.event_details).toLowerCase().includes(search)
    );
  });

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-muted-foreground">
          Comprehensive audit trail for all agent executions, LLM calls, and system events
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter and search system logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Category</label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="agent_task_started">Agent Task Started</SelectItem>
                  <SelectItem value="agent_task_completed">Agent Task Completed</SelectItem>
                  <SelectItem value="agent_task_failed">Agent Task Failed</SelectItem>
                  <SelectItem value="llm_call_success">LLM Call Success</SelectItem>
                  <SelectItem value="llm_call_failed">LLM Call Failed</SelectItem>
                  <SelectItem value="code_execution_started">Code Execution Started</SelectItem>
                  <SelectItem value="code_execution_completed">Code Execution Completed</SelectItem>
                  <SelectItem value="code_execution_failed">Code Execution Failed</SelectItem>
                  <SelectItem value="code_execution_timeout">Code Execution Timeout</SelectItem>
                  <SelectItem value="orchestrator_started">Orchestrator Started</SelectItem>
                  <SelectItem value="orchestrator_completed">Orchestrator Completed</SelectItem>
                  <SelectItem value="orchestrator_failed">Orchestrator Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button onClick={handleExport} disabled={exporting} size="sm">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>Most recent 500 events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(log.event_type)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.event_status)}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground">
                            {(log.event_details as any)?.taskId || (log.event_details as any)?.agentRole || 'View details'}
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(log.event_details, null, 2)}
                          </pre>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
