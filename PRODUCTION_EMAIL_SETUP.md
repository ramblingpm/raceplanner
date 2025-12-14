# Production Email Setup Guide

This guide will help you fix the email issues in production.

## Issues Identified

1. ❌ **Beta signup emails not working in production**
   - Missing `NEXT_PUBLIC_SITE_URL` environment variable
   - Email links default to `http://localhost:3000` in production

2. ❌ **Approval emails not being sent after admin approval**
   - Supabase webhook not configured or not triggering correctly
   - Webhook needs to call your production API endpoint

## Step-by-Step Production Setup

### Step 1: Get Your Production URL

First, you need to know your production domain. You mentioned you'll provide it.

**Example formats:**
- `https://raceplanner.com`
- `https://raceplanner.vercel.app`
- `https://your-custom-domain.com`

### Step 2: Configure Vercel Environment Variables

Go to your Vercel project dashboard and add/verify these environment variables:

**Navigation:** Vercel Dashboard → Your Project → Settings → Environment Variables

#### Required Environment Variables

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-production-domain.com` | ⚠️ **CRITICAL** - Currently missing! |
| `RESEND_API_KEY` | `re_your_production_key` | Should already be set |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Must be verified in Resend |
| `ADMIN_EMAIL` | `your-admin@email.com` | Should already be set |
| `SUPABASE_WEBHOOK_SECRET` | `your_webhook_secret` | Should already be set |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAAA...` | Production key (not test `1x000...`) |
| `TURNSTILE_SECRET_KEY` | `0x4AAAAAAA...` | Production secret (not test) |

#### How to Add/Update in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your Race Planner project
3. Click **Settings** → **Environment Variables**
4. For each variable:
   - Click **Add New**
   - Name: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://your-production-domain.com`
   - Environment: Check **Production**, **Preview**, and **Development**
   - Click **Save**

5. After adding/updating variables, **redeploy** your application:
   - Go to **Deployments** tab
   - Click the three dots (...) on the latest deployment
   - Click **Redeploy**
   - Check "Use existing Build Cache" = **OFF** (force fresh build)

### Step 3: Configure Supabase Database Webhook

This webhook sends the approval email when a beta invite is approved.

#### 3.1 Get Your Webhook Secret

From your `.env` file, copy the value of `SUPABASE_WEBHOOK_SECRET`:
```
51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c
```

#### 3.2 Create the Webhook in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your Race Planner project
3. Navigate to: **Database** → **Webhooks**
4. Click **Create a new webhook** or **Enable Webhooks** (if first time)

#### 3.3 Webhook Configuration

Fill in the webhook form with these exact values:

**Basic Settings:**
- **Name:** `beta-approval-email`
- **Table:** `beta_invites`
- **Events:** Check **only** `UPDATE` (uncheck INSERT and DELETE)

**HTTP Request:**
- **Type:** `HTTP Request`
- **Method:** `POST`
- **URL:** `https://YOUR-PRODUCTION-DOMAIN.com/api/send-approval-email`
  - Replace `YOUR-PRODUCTION-DOMAIN.com` with your actual domain
  - Example: `https://raceplanner.vercel.app/api/send-approval-email`

**HTTP Headers:**
Click **Add header** and enter:
- **Key:** `x-webhook-secret`
- **Value:** `51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c`

**HTTP Params:**
- Leave empty (no query parameters needed)

**Advanced Options:**
- **Timeout:** 5000ms (default is fine)
- **Retry Logic:** Enable (recommended)

5. Click **Create webhook**

### Step 4: Verify Resend Email Domain

Make sure your sending domain is verified in Resend:

1. Go to: https://resend.com/domains
2. Check if your domain (e.g., `raceplanner.com`) is verified
3. If not verified:
   - Add domain
   - Add DNS records as instructed
   - Wait for verification (usually a few minutes)

4. Update `EMAIL_FROM` in Vercel to use verified domain:
   - Example: `noreply@raceplanner.com`
   - Or: `team@raceplanner.com`

### Step 5: Test Production Emails

After completing the above steps, test the email flow:

#### Test 1: Beta Signup Email

1. Go to your production site: `https://your-domain.com/beta-signup`
2. Submit a beta signup request with a real email you can access
3. Check your inbox for two emails:
   - **User:** "Thank you for requesting beta access!"
   - **Admin:** "New Beta Access Request" (with Approve/Deny buttons)

4. Verify email links:
   - Approve button should link to: `https://your-domain.com/api/beta-invite-action?token=...`
   - Should **NOT** link to `http://localhost:3000`

#### Test 2: Approval Email

**Option A: Via Email Button**
1. Click the **Approve** button in the admin notification email
2. User should receive: "🎉 Your Race Planner Beta Access Has Been Approved!"
3. "Create Your Account" button should link to: `https://your-domain.com/signup`

**Option B: Via Admin Panel**
1. Go to: `https://your-domain.com/admin/beta-invites`
2. Log in as admin
3. Approve a beta invite
4. User should receive the approval email

### Step 6: Verify Webhook is Working

Check Supabase webhook logs:

1. Go to: Supabase Dashboard → **Database** → **Webhooks**
2. Click on your `beta-approval-email` webhook
3. Click the **Logs** tab
4. You should see:
   - Status: `200 OK` (success)
   - Response body: `{"success":true,"message":"Approval email sent successfully",...}`

If you see errors:
- `401 Unauthorized` → Webhook secret mismatch
- `500 Internal Server Error` → Check Vercel function logs
- Timeout → Check if production URL is correct

### Step 7: Check Vercel Function Logs

To debug production issues:

1. Go to: Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **Functions** tab
4. Look for:
   - `/api/beta-signup-email`
   - `/api/send-approval-email`
5. Check logs for errors or success messages

You should see logs like:
- `✅ Turnstile verification passed`
- `✅ Beta invite approved for user@example.com, sending approval email...`
- `✅ Approval email sent successfully to user@example.com`

## Troubleshooting

### Issue: Email links still point to localhost

**Solution:**
1. Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel (all environments)
2. Redeploy with build cache disabled
3. Clear browser cache
4. Test again

### Issue: Approval emails not being sent

**Solutions:**
1. Check Supabase webhook is enabled and configured
2. Verify webhook URL matches your production domain exactly
3. Check webhook secret matches in both Supabase and Vercel
4. Check Supabase webhook logs for errors
5. Verify webhook is listening for `UPDATE` events on `beta_invites` table

### Issue: Emails not being delivered

**Solutions:**
1. Check Resend dashboard for failed emails: https://resend.com/emails
2. Verify `EMAIL_FROM` domain is verified in Resend
3. Check spam folder
4. Verify `RESEND_API_KEY` is correct and active

### Issue: Turnstile verification failing

**Solutions:**
1. Make sure you're using production Turnstile keys, not test keys (`1x000...`)
2. Get real keys from: https://dash.cloudflare.com/turnstile
3. Update both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel

## Environment Variables Checklist

Use this checklist to verify all required variables are set:

- [ ] `NEXT_PUBLIC_SITE_URL` - **CRITICAL** - Must be production domain
- [ ] `RESEND_API_KEY` - Production API key
- [ ] `EMAIL_FROM` - Verified sender email
- [ ] `ADMIN_EMAIL` - Admin notification email
- [ ] `SUPABASE_WEBHOOK_SECRET` - Matches webhook header
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Production key
- [ ] `TURNSTILE_SECRET_KEY` - Production secret
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key

## Quick Reference

### Email Flow Diagram

```
User submits beta signup
        ↓
Frontend calls /api/beta-signup-email
        ↓
Sends 2 emails:
├─→ User: "Thank you for requesting access"
└─→ Admin: "New request" (with approve/deny buttons)
        ↓
Admin clicks Approve
        ↓
Database: beta_invites.approved = true
        ↓
Supabase webhook triggers
        ↓
POST /api/send-approval-email
        ↓
Sends approval email to user
        ↓
User creates account
```

### API Endpoints

| Endpoint | Purpose | Triggered By |
|----------|---------|--------------|
| `/api/beta-signup-email` | Send initial confirmation | Frontend form submission |
| `/api/send-approval-email` | Send approval notification | Supabase webhook |
| `/api/beta-invite-action` | Process approve/deny links | Admin clicks email button |

### Important URLs

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Resend Dashboard: https://resend.com/emails
- Cloudflare Turnstile: https://dash.cloudflare.com/turnstile

## Need Help?

If you encounter issues:

1. Check Vercel function logs for errors
2. Check Supabase webhook logs
3. Check Resend email logs
4. Verify all environment variables are set correctly
5. Try redeploying with fresh build cache

## Summary

The two main fixes needed:

1. ✅ Add `NEXT_PUBLIC_SITE_URL` to Vercel environment variables
2. ✅ Configure Supabase webhook to call `/api/send-approval-email`

Once these are done, your production emails should work exactly like they do locally!
