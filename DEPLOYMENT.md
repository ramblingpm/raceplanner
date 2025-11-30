# Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project set up with migrations applied

### Steps

1. **Apply Database Migrations**
   Before deploying, ensure all migrations are applied to your Supabase database:

   Go to Supabase Dashboard → SQL Editor and run each migration in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_label_to_calculations.sql`
   - `supabase/migrations/003_add_planned_stop_duration.sql`

2. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

4. **Verify Build Settings** (should be auto-configured)
   - Framework Preset: Next.js
   - Root Directory: `./` (project root)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/.next`
   - Install Command: `npm install --prefix frontend`

5. **Add Environment Variables**
   In Vercel project settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   To find these:
   - Go to Supabase Dashboard → Settings → API
   - Copy Project URL and anon/public key

6. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - You'll get a URL like `https://raceplanner.vercel.app`

7. **Configure Supabase Authentication URLs**
   After deployment, update Supabase settings:

   Go to Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs** (add these):
     - `https://your-project.vercel.app/**`
     - `https://your-project.vercel.app/reset-password`

   This enables password reset emails and OAuth redirects to work correctly.

### Automatic Deployments

Once connected, Vercel will automatically deploy:
- **Production**: Every push to the `main` branch
- **Preview**: Every pull request

## Backend Deployment Options

### Option 1: Vercel Serverless Functions (Recommended for MVP)

The backend can be deployed as Vercel serverless functions:

1. Create `frontend/api` directory
2. Move backend routes to serverless functions
3. Deploy with the frontend

### Option 2: Railway

1. Sign up at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Select the `backend` directory
4. Add environment variables
5. Deploy

### Option 3: Render

1. Sign up at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Root Directory: `backend`
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. Add environment variables
8. Deploy

## Environment Variables Checklist

### Frontend (Vercel)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend (if separate deployment)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DATABASE_URL` (optional if using Supabase SDK)
- ✅ `PORT` (set by hosting provider)

## Domain Setup

### Custom Domain on Vercel

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

## Post-Deployment Checklist

- [ ] Test signup/login flow
- [ ] Verify race data loads correctly
- [ ] Test calculator functionality
- [ ] Check mobile responsiveness
- [ ] Verify logout works
- [ ] Test on different browsers
- [ ] Check console for errors
- [ ] Set up error monitoring (optional: Sentry)
- [ ] Set up analytics (optional: Vercel Analytics)

## Rollback Strategy

If something goes wrong:

1. **Vercel**: Click on previous deployment and promote it
2. **GitHub**: Revert the commit and push
3. **Database**: Always test migrations on a dev instance first

## Monitoring

- **Vercel Analytics**: Enabled by default
- **Supabase Dashboard**: Monitor database performance
- **Error Tracking**: Consider adding Sentry

## Security Notes

- ✅ Never commit `.env` files
- ✅ Use Row Level Security in Supabase
- ✅ Keep service role key secret (backend only)
- ✅ Use HTTPS (automatic with Vercel)
- ✅ Enable email confirmation in Supabase Auth settings
