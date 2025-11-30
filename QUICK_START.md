# Quick Start Guide

Get up and running with Race Planner in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free tier works great)

## Step 1: Clone and Install (2 minutes)

```bash
# If you haven't already, navigate to the project directory
cd raceplanner

# Install all dependencies
npm install
```

## Step 2: Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - Name: `raceplanner`
   - Database Password: (generate a strong one)
   - Region: (choose closest to you)
4. Wait 2 minutes for provisioning

## Step 3: Configure Database (2 minutes)

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. You should see "Success. No rows returned"

## Step 4: Get Your API Keys (1 minute)

1. In Supabase dashboard, go to Settings > API
2. Copy these values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

## Step 5: Configure Environment (1 minute)

```bash
# Copy the example env file 
cp .env.example .env

# Edit .env with your favorite editor
nano .env  # or vim, code, etc.
```

Paste your Supabase values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Step 6: Run the App (1 minute)

```bash
# Start both frontend and backend
npm run dev
```

You should see:
```
> frontend dev server running on http://localhost:3000
> backend dev server running on http://localhost:3001
```

## Step 7: Test It Out!

1. Open http://localhost:3000 in your browser
2. Click "Get Started" or "Sign Up"
3. Create an account with your email
4. You'll be redirected to the dashboard
5. See the sample race "Tour de Test"
6. Enter your start time and estimated duration
7. Click "Calculate" to see your finish time and required speed!

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env` file is in the root directory
- Check that variable names match exactly
- Restart the dev server after changing `.env`

### "Error fetching races"
- Verify you ran the SQL migration in Supabase
- Check Supabase dashboard > Table Editor > races table exists
- Verify your API keys are correct

### Port already in use
```bash
# Kill the process using the port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

### Authentication not working
- Go to Supabase dashboard > Authentication > Settings
- Check "Enable email confirmations" is OFF for development
- Verify "Site URL" includes http://localhost:3000

## Next Steps

- [ ] Add more races to the database
- [ ] Customize the styling
- [ ] Add your own features
- [ ] Deploy to Vercel (see DEPLOYMENT.md)
- [ ] Share on social media!

## Need Help?

- Check the main README.md
- Review DATABASE_SETUP.md for database issues
- Check Supabase docs: https://supabase.com/docs
- Open an issue on GitHub

## Building in Public?

Don't forget to:
- Tweet about your progress
- Share screenshots
- Document your learnings
- Keep your .env file private!

Happy building! 🚴
