# Vercel Deployment Checklist

## Pre-Deployment

- [ ] All database migrations applied to Supabase
- [ ] Code committed and pushed to GitHub
- [ ] `.env` file NOT committed (check `.gitignore`)
- [ ] Tests passing locally
- [ ] Frontend builds successfully (`cd frontend && npm run build`)

## Vercel Setup

- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Imported project to Vercel
- [ ] Verified `vercel.json` configuration is detected

## Environment Variables

Required in Vercel project settings:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (from Supabase Dashboard → Settings → API)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase Dashboard → Settings → API)

## Supabase Configuration

- [ ] Applied migration: `001_initial_schema.sql`
- [ ] Applied migration: `002_add_label_to_calculations.sql`
- [ ] Applied migration: `003_add_planned_stop_duration.sql`
- [ ] Configured Site URL in Supabase Auth settings
- [ ] Added redirect URLs for password reset:
  - [ ] `https://your-project.vercel.app/**`
  - [ ] `https://your-project.vercel.app/reset-password`

## Deploy

- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

## Post-Deployment Testing

- [ ] Visit deployed URL
- [ ] Test sign up flow
- [ ] Test login flow
- [ ] Test password reset flow
- [ ] Test race calculator
- [ ] Test creating a plan
- [ ] Test editing a plan
- [ ] Test copying a plan
- [ ] Test deleting a plan
- [ ] Test language switcher (English/Swedish)
- [ ] Test on mobile device
- [ ] Check browser console for errors
- [ ] Verify map loads correctly

## Optional

- [ ] Set up custom domain
- [ ] Enable Vercel Analytics
- [ ] Configure email notifications for failed deployments
- [ ] Set up preview deployments for pull requests

## Troubleshooting

If authentication doesn't work:
1. Check Supabase redirect URLs match your Vercel domain
2. Verify environment variables are set correctly
3. Check Supabase auth logs for errors

If build fails:
1. Check Vercel build logs
2. Ensure `vercel.json` is in root directory
3. Verify all dependencies are in `frontend/package.json`
4. Try building locally first

## Support

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Supabase Dashboard: https://app.supabase.com
