import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { logAuditEvent } from "./audit-logger";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export async function signInWithGoogle() {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  // Log audit event
  if (error) {
    await logAuditEvent({
      eventType: 'login_failed',
      eventStatus: 'failure',
      userEmail: email,
      eventDetails: { error: error.message, method: 'email' },
    });
  } else if (data.user) {
    await logAuditEvent({
      eventType: 'login_success',
      eventStatus: 'success',
      userId: data.user.id,
      userEmail: data.user.email,
      eventDetails: { method: 'email' },
    });
  }
  
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
      },
    },
  });
  
  // Log audit event
  if (error) {
    await logAuditEvent({
      eventType: 'signup_failed',
      eventStatus: 'failure',
      userEmail: email,
      eventDetails: { error: error.message },
    });
  } else if (data.user) {
    await logAuditEvent({
      eventType: 'signup_success',
      eventStatus: 'success',
      userId: data.user.id,
      userEmail: data.user.email,
      eventDetails: { full_name: fullName },
    });
  }
  
  return { data, error };
}

export async function signOut() {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase.auth.signOut();
  
  // Log audit event
  if (!error && user) {
    await logAuditEvent({
      eventType: 'logout',
      eventStatus: 'success',
      userId: user.id,
      userEmail: user.email,
    });
  }
  
  return { error };
}

export async function updateLastSeen(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId);
  
  return { error };
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return data?.map(r => r.role) || [];
}

export function hasRole(roles: string[], requiredRole: string): boolean {
  return roles.includes(requiredRole);
}
