import { supabase } from "@/integrations/supabase/client";

export type AuditEventType = 
  | 'login_success'
  | 'login_failed'
  | 'signup_success'
  | 'signup_failed'
  | 'logout'
  | 'mfa_enrolled'
  | 'mfa_unenrolled'
  | 'mfa_verify_success'
  | 'mfa_verify_failed'
  | 'role_assigned'
  | 'role_removed'
  | 'rate_limit_blocked'
  | 'rate_limit_attempt'
  | 'agent_task_started'
  | 'agent_task_completed'
  | 'agent_task_failed'
  | 'agent_task_blocked'
  | 'llm_call_success'
  | 'llm_call_failed'
  | 'code_execution_started'
  | 'code_execution_completed'
  | 'code_execution_failed'
  | 'code_execution_timeout'
  | 'orchestrator_started'
  | 'orchestrator_completed'
  | 'orchestrator_failed'
  | 'system_error';

export type AuditEventStatus = 'success' | 'failure' | 'blocked';

interface AuditLogData {
  eventType: AuditEventType;
  eventStatus: AuditEventStatus;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  eventDetails?: Record<string, any>;
}

/**
 * Get client IP address (best effort)
 */
function getClientIp(): string | undefined {
  // This is a best-effort approach for client-side
  // In production, you'd want to get this from server-side headers
  return undefined;
}

/**
 * Get user agent string
 */
function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs' as any)
      .insert({
        event_type: data.eventType,
        event_status: data.eventStatus,
        user_id: data.userId || null,
        user_email: data.userEmail || null,
        ip_address: data.ipAddress || getClientIp(),
        user_agent: data.userAgent || getUserAgent(),
        event_details: data.eventDetails || null,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit logging exception:', err);
  }
}

/**
 * Export audit logs as CSV
 */
export async function exportAuditLogsAsCSV(filters?: {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  userId?: string;
}): Promise<void> {
  try {
    let query = supabase
      .from('audit_logs' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No audit logs found for the selected filters');
    }

    // Convert to CSV
    const headers = [
      'ID',
      'Event Type',
      'Event Status',
      'User ID',
      'User Email',
      'IP Address',
      'User Agent',
      'Created At',
      'Event Details'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map((log: any) => [
        log.id,
        log.event_type,
        log.event_status,
        log.user_id || '',
        log.user_email || '',
        log.ip_address || '',
        `"${(log.user_agent || '').replace(/"/g, '""')}"`,
        log.created_at,
        `"${JSON.stringify(log.event_details || {}).replace(/"/g, '""')}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    throw error;
  }
}
