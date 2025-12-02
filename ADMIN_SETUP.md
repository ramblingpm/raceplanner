# Admin Panel Setup Guide

This guide explains how to set up and use the secure admin panel for managing beta invites and other administrative tasks.

## Overview

The admin panel provides a secure web interface for superusers to manage the application. It uses Supabase authentication and Row Level Security (RLS) policies to ensure only authorized users can access administrative functions.

## Security Features

- ✅ **Database-level security**: RLS policies enforce access control at the database level
- ✅ **No hardcoded credentials**: Admin emails are stored in the database, not in code
- ✅ **Client-side and server-side protection**: Both UI and API enforce admin checks
- ✅ **Audit trail**: All invite actions are logged with timestamps

## Initial Setup

### 1. Apply the Database Migration

First, apply the new migration to add admin access control for beta invites:

```bash
# If using Supabase CLI
supabase db push

# Or apply directly in Supabase SQL Editor
# Run the contents of: supabase/migrations/008_add_admin_beta_invites_access.sql
```

This migration:
- Enables RLS on the `beta_invites` table
- Creates policies for admin CRUD operations
- Adds helper functions for managing invites securely
- Maintains public read access for signup invite checking

### 2. Add Your First Admin User

After signing up for an account through the normal signup flow, add yourself as an admin:

#### Option A: Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this query (replace with your user ID):

```sql
-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Then add yourself as an admin
INSERT INTO admin_users (user_id)
VALUES ('your-user-id-from-above');
```

#### Option B: Using psql

```bash
# Connect to your database
psql $DATABASE_URL

# Find your user ID and add as admin
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
INSERT INTO admin_users (user_id) VALUES ('your-user-id');
```

### 3. Verify Access

1. Sign in to your account
2. Click on your user menu (top right)
3. You should now see an "Admin Panel" link
4. Click it to access the admin interface at `/admin`

## Using the Admin Panel

### Dashboard Overview

The admin dashboard (`/admin`) provides:
- **Stats overview**: Total, used, and pending invites
- **Quick actions**: Direct links to management pages
- **Navigation**: Sidebar with all admin sections

### Managing Beta Invites

Navigate to `/admin/beta-invites` to:

#### Add a New Invite

1. Click "Add Invite" button
2. Fill in the form:
   - **Email** (required): The email address to invite
   - **Invited By** (optional): Your email or name for tracking
   - **Notes** (optional): Any context about this invite
3. Click "Create Invite"

The invite is immediately available for the user to sign up.

#### View All Invites

The invites table shows:
- Email address
- Status (Used/Pending)
- Who invited them
- Notes
- Creation date
- Actions (Delete)

#### Delete an Invite

Click "Delete" next to any invite and confirm. This removes the invite from the database.

**Note**: Deleting a used invite won't delete the user's account.

## Adding Additional Admins

To add more admin users:

```sql
-- Add another admin (get their user_id first)
INSERT INTO admin_users (user_id)
VALUES ('another-user-id');

-- View all current admins
SELECT au.user_id, u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id;

-- Remove an admin
DELETE FROM admin_users WHERE user_id = 'user-id-to-remove';
```

## Security Best Practices

### DO:
- ✅ Add admins only through direct database queries
- ✅ Keep admin user IDs in the database only
- ✅ Regularly audit the `admin_users` table
- ✅ Use strong passwords for admin accounts
- ✅ Enable 2FA on admin Supabase accounts

### DON'T:
- ❌ Never commit admin emails or user IDs to git
- ❌ Never expose admin credentials in environment variables
- ❌ Never create a "backdoor" admin check in code
- ❌ Never share admin database access credentials

## Troubleshooting

### "Access denied" error when accessing admin

**Cause**: Your user account is not in the `admin_users` table.

**Solution**: Follow step 2 above to add your user ID to `admin_users`.

### Admin link not showing in user menu

**Cause**: The client-side admin check hasn't completed yet, or you're not an admin.

**Solution**:
1. Refresh the page
2. Verify you're in the `admin_users` table
3. Check browser console for errors

### "Failed to load beta invites" error

**Cause**: RLS policies aren't applied or you're not an admin.

**Solution**:
1. Ensure migration 008 is applied
2. Verify your user_id is in `admin_users`
3. Check Supabase logs for detailed error messages

## API Functions Reference

The following database functions are available for admin operations:

### `get_beta_invites()`
Returns all beta invites. Admin only.

```sql
SELECT * FROM get_beta_invites();
```

### `create_beta_invite(invite_email, invited_by_email, invite_notes)`
Creates a new beta invite. Admin only. Email is automatically lowercased.

```sql
SELECT create_beta_invite(
  'user@example.com',
  'admin@example.com',
  'VIP user'
);
```

### `delete_beta_invite(invite_id)`
Deletes a beta invite. Admin only. Returns true if deleted.

```sql
SELECT delete_beta_invite('uuid-of-invite');
```

## Future Admin Features

The admin panel is designed to be extensible. Planned features include:

- User management (view, suspend, delete users)
- Race management (create, edit, delete races)
- Feed zone management (admin UI for race markers)
- Analytics dashboard
- System health monitoring
- Audit logs viewer

## Files Reference

### Backend/Database
- `supabase/migrations/008_add_admin_beta_invites_access.sql` - Admin RLS policies
- `supabase/migrations/005_restrict_race_insert_to_admin.sql` - Admin users table

### Frontend
- `frontend/src/lib/admin.ts` - Admin helper functions
- `frontend/src/components/AdminRoute.tsx` - Admin route protection
- `frontend/src/components/UserMenu.tsx` - Admin link in menu
- `frontend/src/app/admin/layout.tsx` - Admin layout
- `frontend/src/app/admin/page.tsx` - Admin dashboard
- `frontend/src/app/admin/beta-invites/page.tsx` - Beta invite management

## Support

For issues or questions:
1. Check Supabase logs for detailed error messages
2. Verify RLS policies are active: `SELECT * FROM pg_policies WHERE tablename = 'beta_invites';`
3. Test admin function access directly in SQL Editor
