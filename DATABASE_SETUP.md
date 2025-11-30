# Database Setup Guide

## Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in your project details
   - Wait for the database to be provisioned

2. **Get Your Credentials**
   - Go to Settings > API
   - Copy the following:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key (for backend only, keep this secure!)

3. **Update Environment Variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the Database Migration**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run the SQL

   Alternatively, if you have the Supabase CLI installed:
   ```bash
   supabase db push
   ```

## Database Schema

### Tables

#### `races`
Stores information about cycling races.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Race name |
| distance_km | DECIMAL | Race distance in kilometres |
| route_geometry | JSONB | GeoJSON LineString for the route |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `race_calculations`
Stores user race calculations and results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| race_id | UUID | Reference to races table |
| user_id | UUID | Reference to auth.users (Supabase Auth) |
| planned_start_time | TIMESTAMP | When the user plans to start |
| estimated_duration_seconds | INTEGER | Estimated race duration in seconds |
| calculated_finish_time | TIMESTAMP | Calculated finish time |
| required_speed_kmh | DECIMAL | Required average speed in km/h |
| created_at | TIMESTAMP | Creation timestamp |

### Row Level Security (RLS)

- **Races**: Public read access, authenticated users can create
- **Race Calculations**: Users can only access their own calculations

### Sample Data

The migration includes a sample race "Tour de Test" (42.2 km) for testing purposes.

## Local Development

For local development, you can either:
1. Use your Supabase cloud project (recommended for simplicity)
2. Run Supabase locally with Docker (requires Supabase CLI)

### Option 2: Local Supabase (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in the project
supabase init

# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset
```

The local instance will run on `http://localhost:54321`
