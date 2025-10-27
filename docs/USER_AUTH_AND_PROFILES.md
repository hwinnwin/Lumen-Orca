# Lumen User Authentication & Profiles

## Overview

The Lumen system uses Supabase authentication with support for Google OAuth and email/password sign-in. User profiles and role-based access control (RBAC) ensure secure, personalized access to the orchestration dashboard.

## Authentication Methods

### 1. Google Sign-In (Recommended)

**Setup Requirements:**
1. Navigate to your Lovable Cloud backend
2. Go to **Users** → **Auth Settings** → **Google Settings**
3. Enable Google provider
4. Enter your Google OAuth credentials (Client ID & Secret)

**Getting Google OAuth Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Create OAuth 2.0 Client ID
5. Add authorized JavaScript origins: `https://znkkpibjlifhqvtnghsd.supabase.co`
6. Add authorized redirect URIs: `https://znkkpibjlifhqvtnghsd.supabase.co/auth/v1/callback`

### 2. Email/Password Sign-In

Email authentication is enabled by default. For testing, you can disable email confirmation:

1. Open Lovable Cloud backend
2. Navigate to **Users** → **Auth Settings**
3. Toggle **Confirm email** OFF

**Note:** In production, always keep email confirmation enabled.

## User Roles

Lumen implements three-tier RBAC:

| Role | Access Level | Capabilities |
|------|--------------|-------------|
| **Admin** | Full system access | - Manage all users and roles<br>- View raw numeric metrics<br>- Configure LLM providers<br>- Modify system settings |
| **Developer** | Configuration access | - Configure LLM providers<br>- View graded metrics (AAA/AA/A)<br>- Monitor orchestration<br>- Access evidence bundles |
| **Viewer** | Read-only access | - View dashboards<br>- See graded metrics<br>- Monitor agent status<br>- No configuration changes |

## User Profile Management

### Viewing Your Profile

1. Click your avatar in the sidebar
2. Select **Profile** from the dropdown
3. View your role, last activity, and account details

### Editing Your Profile

1. Navigate to **Profile** page
2. Update your **Full Name**
3. Click **Update Profile**

**Note:** Email cannot be changed directly. Contact an admin to update email addresses.

## Admin Features

### Assigning Roles

**Via SQL (Admin Only):**

```sql
-- Grant admin role
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT DO NOTHING;

-- Grant developer role
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'developer')
ON CONFLICT DO NOTHING;

-- Remove a role
DELETE FROM user_roles
WHERE user_id = 'user-uuid-here' AND role = 'admin';
```

### Viewing All Users

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.last_seen,
  array_agg(ur.role) as roles
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
GROUP BY p.id, p.email, p.full_name, p.last_seen
ORDER BY p.created_at DESC;
```

## Security Best Practices

### Row-Level Security (RLS)

All user data is protected by RLS policies:

- **Profiles**: Users can only view/edit their own profile
- **Roles**: Users see only their own roles; admins see all
- **Settings**: Configuration changes require appropriate role

### Session Management

- Sessions persist for 24 hours by default
- Automatic token refresh keeps users logged in
- Last activity timestamp updates on each interaction

### Password Requirements

- Minimum 6 characters
- Email must be valid format
- Passwords are hashed and never stored in plaintext

## Troubleshooting

### "Requested path is invalid" Error

This occurs when redirect URLs are misconfigured:

1. Open Lovable Cloud backend
2. Go to **Users** → **Auth Settings**
3. Ensure **Site URL** matches your app URL
4. Add your domain to **Redirect URLs**

<lov-actions>
  <lov-open-backend>View Backend</lov-open-backend>
</lov-actions>

### Google Sign-In Not Working

**Checklist:**
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret configured correctly
- [ ] Authorized JavaScript origins include Supabase domain
- [ ] Redirect URIs include `/auth/v1/callback`

### User Not Auto-Created in Profiles Table

Check that the `on_auth_user_created` trigger exists:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If missing, run the migration to recreate it.

## API Integration

### Checking User Role in Code

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { isAdmin, isDeveloper, roles } = useAuth();
  
  if (isAdmin) {
    // Show admin-only features
  }
  
  if (isDeveloper) {
    // Show developer features
  }
}
```

### Protecting API Endpoints

```typescript
// In edge functions
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return new Response('Unauthorized', { status: 401 });
}

// Check role
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);

const isAdmin = roles?.some(r => r.role === 'admin');

if (!isAdmin) {
  return new Response('Forbidden', { status: 403 });
}
```

## Environment Variables

No manual environment variable configuration required. Lovable Cloud automatically manages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- Auth redirect URLs
- Session configuration

## Migration Reference

All auth-related migrations are tracked in:
- User profiles: `supabase/migrations/[timestamp]_create_profiles.sql`
- Role system: `supabase/migrations/[timestamp]_create_user_roles.sql`
- Triggers: `supabase/migrations/[timestamp]_auth_triggers.sql`

## Support

For additional help:
1. Check [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
2. Review [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)
3. Contact your system administrator for role assignments

---

**Last Updated:** 2025-10-27  
**System Version:** 1.0.0-alpha  
**Auth Status:** ✅ Production Ready
