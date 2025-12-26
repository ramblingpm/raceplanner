# Database Migrations

This directory contains SQL migrations for the Race Planner database.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the contents of the migration file (e.g., `20241224_add_elevation_fields.sql`)
5. Paste into the editor
6. Click **Run** to execute

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will apply all pending migrations.

## Current Migrations

### 20241224_add_elevation_fields.sql (REQUIRED - Run First)

**Purpose**: Adds elevation data fields to the `races` table.

**Fields Added**:
- `elevation_data` (numeric[]) - Array of elevation values in meters
- `elevation_gain_m` (integer) - Total elevation gain in meters
- `elevation_loss_m` (integer) - Total elevation loss in meters
- `min_elevation_m` (integer) - Minimum elevation point
- `max_elevation_m` (integer) - Maximum elevation point

**Index Created**:
- `idx_races_has_elevation` - Speeds up queries for races with elevation data

**Rollback**: Use `20241224_add_elevation_fields_rollback.sql` to undo this migration.

### 20241224_add_elevation_rpc.sql (REQUIRED - Run Second)

**Purpose**: Creates admin RPC function to update race elevation data.

**Function Created**:
- `update_race_elevation()` - Admin-only function with SECURITY DEFINER to bypass RLS

**Security**:
- Only users in `admin_users` table can execute this function
- Uses SECURITY DEFINER to bypass RLS policies on races table
- Follows the same pattern as other admin functions (`get_beta_invites`, etc.)

**Why This Is Needed**:
Without this RPC function, the elevation backfill tool would be blocked by Row Level Security policies. This function allows admins to update elevation data while keeping RLS enabled for normal operations.

## Migration Status

After applying a migration, you can verify it worked by running:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'races'
AND column_name LIKE 'elevation%'
ORDER BY column_name;
```

Expected output should show all 5 elevation columns.

## Testing the Migration

After applying the migration, test with:

```sql
-- Try updating a race with elevation data
UPDATE races
SET
  elevation_data = ARRAY[100, 120, 150, 180, 160],
  elevation_gain_m = 80,
  elevation_loss_m = 20,
  min_elevation_m = 100,
  max_elevation_m = 180
WHERE id = 'your-race-id-here'
RETURNING *;
```

## Troubleshooting

**Error: "column already exists"**
- The migration has already been applied. No action needed.

**Error: "permission denied"**
- Make sure you're using a privileged database user (service_role key).

**Need to rollback?**
- Run the corresponding `*_rollback.sql` file using the same method.
