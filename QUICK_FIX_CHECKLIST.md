# Quick Fix Checklist for Production Emails

Use this checklist to quickly fix your production email issues.

## What You Need

1. Your production domain (e.g., `https://raceplanner.vercel.app`)
2. Access to Vercel Dashboard
3. Access to Supabase Dashboard
4. Your webhook secret: `51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c`

## Fix 1: Add Missing Environment Variable to Vercel

⏱️ Time: 2 minutes

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click your Race Planner project
3. [ ] Click **Settings** → **Environment Variables**
4. [ ] Click **Add New**
5. [ ] Add this variable:
   ```
   Name: NEXT_PUBLIC_SITE_URL
   Value: https://YOUR-PRODUCTION-DOMAIN.com
   Environments: ✓ Production ✓ Preview ✓ Development
   ```
6. [ ] Click **Save**

## Fix 2: Redeploy Your Application

⏱️ Time: 2 minutes

1. [ ] Go to **Deployments** tab in Vercel
2. [ ] Click three dots (...) on latest deployment
3. [ ] Click **Redeploy**
4. [ ] **Uncheck** "Use existing Build Cache"
5. [ ] Click **Redeploy**
6. [ ] Wait for deployment to complete (~2-3 minutes)

## Fix 3: Configure Supabase Webhook

⏱️ Time: 3 minutes

1. [ ] Go to https://supabase.com/dashboard
2. [ ] Select your Race Planner project
3. [ ] Click **Database** → **Webhooks**
4. [ ] Click **Create a new webhook**
5. [ ] Fill in:
   - Name: `beta-approval-email`
   - Table: `beta_invites`
   - Events: ✓ UPDATE only
   - Type: HTTP Request
   - Method: POST
   - URL: `https://YOUR-DOMAIN.com/api/send-approval-email`
6. [ ] Click **Add header**:
   - Key: `x-webhook-secret`
   - Value: `51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c`
7. [ ] Click **Create webhook**

## Fix 4: Test Production Emails

⏱️ Time: 2 minutes

1. [ ] Go to `https://YOUR-DOMAIN.com/beta-signup`
2. [ ] Submit a test beta signup with your email
3. [ ] Check your inbox for confirmation email
4. [ ] Check admin email for notification
5. [ ] Click **Approve** in admin email
6. [ ] Check if user receives approval email

## Verification

✅ All working if:
- Beta signup sends 2 emails (user + admin)
- Email links point to your production domain (not localhost)
- Clicking "Approve" sends approval email to user
- "Create Your Account" button points to production signup page

## Quick Troubleshooting

**Email links still point to localhost?**
- Did you redeploy after adding `NEXT_PUBLIC_SITE_URL`?
- Did you disable build cache during redeploy?

**Approval email not sent?**
- Check Supabase → Database → Webhooks → Logs
- Verify webhook URL matches your production domain exactly
- Verify webhook secret matches

**Emails not delivered?**
- Check https://resend.com/emails for delivery status
- Check spam folder

## Environment Variables to Verify

While you're in Vercel, also verify these are set:

- [ ] `NEXT_PUBLIC_SITE_URL` ← **YOU JUST ADDED THIS**
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `ADMIN_EMAIL`
- [ ] `SUPABASE_WEBHOOK_SECRET`

## Total Time: ~10 minutes

See `PRODUCTION_EMAIL_SETUP.md` for detailed troubleshooting.
