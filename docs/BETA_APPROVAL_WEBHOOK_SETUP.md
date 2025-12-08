# Beta Approval Email Webhook Setup

This document explains how the automatic beta approval email system works and how to set it up in your Supabase project.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Maintenance](#maintenance)

---

## Overview

When a beta invite is approved (either via the admin panel or email action links), the system automatically sends a welcome email to the approved user. This is implemented using **Supabase Database Webhooks**, which trigger whenever the `beta_invites` table is updated.

### What the User Receives

When approved, users receive a beautifully formatted HTML email containing:
- 🎉 Congratulations message
- **"Create Your Account"** button linking to `/signup`
- List of features they can now access
- Support information
- Branded with the app name from translations

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     Approval Flow                               │
└─────────────────────────────────────────────────────────────────┘

1. Admin approves beta invite
   ├─ Via Admin Panel UI (frontend calls RPC function)
   └─ Via Email Link (API calls RPC function)
                    │
                    ▼
2. Database: beta_invites.approved = true
                    │
                    ▼
3. Supabase Webhook triggers on UPDATE
                    │
                    ▼
4. Webhook calls: POST /api/send-approval-email
   - Validates webhook secret
   - Checks if this is an approval event
   - Gets translated app name
   - Sends HTML email via Resend
                    │
                    ▼
5. User receives approval email with signup link
```

---

## Prerequisites

Before setting up the webhook, ensure you have:

- ✅ Supabase project created
- ✅ `beta_invites` table set up with `approved` column
- ✅ Resend API key configured (`RESEND_API_KEY`)
- ✅ Email sending working (test with beta signup emails)
- ✅ Your app deployed and publicly accessible (webhooks need a public URL)

---

## Setup Instructions

### Step 1: Generate a Webhook Secret

First, generate a secure random secret for webhook authentication:

```bash
# On macOS/Linux
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated string (e.g., `a1b2c3d4e5f6...`).

### Step 2: Add Environment Variable

Add the webhook secret to your environment variables:

**Local Development** (`.env.local`):
```env
SUPABASE_WEBHOOK_SECRET=your_generated_secret_here
```

**Production** (Vercel/your hosting provider):
Add `SUPABASE_WEBHOOK_SECRET` as an environment variable with the same value.

### Step 3: Deploy Your Application

The webhook endpoint needs to be publicly accessible. Deploy your app or use a tool like ngrok for local testing:

```bash
# For local testing with ngrok
ngrok http 3000
```

This gives you a public URL like `https://abc123.ngrok.io`.

### Step 4: Configure Supabase Webhook

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database Webhooks**
   - Click on "Database" in the left sidebar
   - Click on "Webhooks" tab

3. **Create New Webhook**
   - Click "Create a new hook" or "Enable Webhooks" button

4. **Configure Webhook Settings**

   Fill in the following details:

   **Name:** `beta_invite_approved`

   **Table:** `beta_invites`

   **Events:** Check ✅ **Update** (uncheck Insert and Delete)

   **Type:** Select **HTTP Request**

   **HTTP Request Details:**
   - **Method:** `POST`
   - **URL:** `https://your-domain.com/api/send-approval-email`
     - For local testing: `https://abc123.ngrok.io/api/send-approval-email`
     - For production: `https://raceplanner.com/api/send-approval-email`

   **HTTP Headers:**
   Click "Add header" and add:
   - **Key:** `x-webhook-secret`
   - **Value:** `your_generated_secret_here` (the same secret from Step 1)

   **Filters (Optional but Recommended):**
   To only trigger when an invite is approved (not on every update), add a filter:
   - Click "Add condition"
   - **Column:** `approved`
   - **Operator:** `=`
   - **Value:** `true`

   Note: The API endpoint has additional validation to ensure it only sends emails when `old.approved = false` and `new.approved = true`, so this filter is optional but reduces unnecessary calls.

5. **Test Configuration**
   - Click "Send test" to verify connectivity (optional)
   - Click "Save" or "Create webhook"

### Step 5: Verify Setup

The webhook is now active! Test it by approving a beta invite:

1. Create a test beta invite in your admin panel
2. Approve it (via admin panel or email link)
3. Check:
   - User should receive the approval email
   - Check your application logs for: `✅ Approval email sent successfully to [email]`
   - Check Supabase webhook logs: Database → Webhooks → Click on your webhook → View logs

---

## Testing

### Local Testing with ngrok

If you're testing locally:

1. Start your Next.js app:
   ```bash
   npm run dev
   ```

2. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```

3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

4. Update your Supabase webhook URL to:
   ```
   https://abc123.ngrok.io/api/send-approval-email
   ```

5. Approve a test beta invite and verify the email is sent

### Test Checklist

- [ ] Webhook appears in Supabase Dashboard → Database → Webhooks
- [ ] Webhook secret is correctly configured in environment variables
- [ ] Application is deployed and accessible
- [ ] Approving a beta invite triggers the webhook
- [ ] User receives approval email with correct content
- [ ] Email includes working "Create Your Account" button
- [ ] App name is correctly translated in email
- [ ] Webhook logs show successful deliveries

---

## Troubleshooting

### Email Not Sent After Approval

**Check 1: Webhook Active?**
- Go to Supabase Dashboard → Database → Webhooks
- Verify webhook is enabled (toggle should be on)
- Check webhook logs for errors

**Check 2: Webhook Secret Correct?**
- Verify `SUPABASE_WEBHOOK_SECRET` matches in:
  - Your environment variables
  - Supabase webhook headers
- Redeploy after changing environment variables

**Check 3: Application Logs**
Check your application logs for:
- `✅ Beta invite approved for [email], sending approval email...` - webhook received
- `✅ Approval email sent successfully` - email sent
- `❌ Invalid webhook secret` - secret mismatch
- `❌ Error sending approval email` - Resend API issue

**Check 4: Resend API**
- Verify `RESEND_API_KEY` is set correctly
- Check Resend Dashboard for email delivery status
- Ensure sender email is verified in Resend

**Check 5: Webhook URL**
- Verify the webhook URL is publicly accessible
- Test manually:
  ```bash
  curl -X POST https://your-domain.com/api/send-approval-email \
    -H "Content-Type: application/json" \
    -H "x-webhook-secret: your_secret" \
    -d '{"type":"UPDATE","table":"beta_invites","record":{"id":"123","email":"test@example.com","approved":true},"old_record":{"approved":false}}'
  ```

### Duplicate Emails Sent

If users receive multiple approval emails:

**Cause:** Webhook firing multiple times for the same approval

**Solution:**
- The API endpoint validates that `old.approved = false` and `new.approved = true`
- This should prevent duplicates, but if it still happens:
  - Check webhook logs for multiple triggers
  - Ensure only one webhook is configured for this table
  - Add a `sent_approval_email` boolean column to `beta_invites` and check it in the API

### Webhook Shows "Failed" Status

**Possible Causes:**
1. **URL not accessible** - Verify app is deployed and running
2. **Invalid secret** - Check header configuration
3. **Application error** - Check your application error logs
4. **Timeout** - API taking too long (>30 seconds)

**View Error Details:**
- Supabase Dashboard → Database → Webhooks → [Your webhook] → Logs
- Click on failed webhook to see response status and body

---

## Security

### Webhook Secret Validation

The webhook endpoint validates all requests using the `x-webhook-secret` header:

```typescript
const webhookSecret = request.headers.get('x-webhook-secret');
if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
  return 401 Unauthorized
}
```

**Security Best Practices:**
- ✅ Use a strong, randomly generated secret (32+ characters)
- ✅ Store secret in environment variables, never commit to git
- ✅ Use different secrets for development and production
- ✅ Rotate secrets periodically
- ✅ Use HTTPS URLs only (ngrok provides HTTPS for local testing)

### Event Validation

The endpoint performs additional validation:

```typescript
// Only process approval events
if (
  payload.type !== 'UPDATE' ||
  payload.old_record.approved === true ||
  payload.record.approved !== true
) {
  return; // Silently ignore
}
```

This ensures emails are only sent when an invite transitions from `not approved` → `approved`.

---

## Maintenance

### Monitoring

**What to Monitor:**
1. **Webhook Success Rate**
   - Supabase Dashboard → Database → Webhooks → View logs
   - Look for failed deliveries

2. **Email Delivery**
   - Resend Dashboard → Logs
   - Monitor bounce rates and delivery issues

3. **Application Logs**
   - Search for: `send-approval-email webhook`
   - Monitor error rates

### Webhook Logs Retention

Supabase keeps webhook logs for a limited time. For long-term monitoring:
- Implement application-level logging
- Use monitoring tools (Sentry, LogRocket, etc.)
- Set up alerts for webhook failures

### Updating the Email Template

To modify the approval email content:

1. Edit `/frontend/src/app/api/send-approval-email/route.ts`
2. Update the HTML in the `resend.emails.send()` call
3. Test with a sample approval
4. Deploy changes

**Tips:**
- Keep mobile responsive (use tables for layout)
- Test in multiple email clients
- Use inline CSS (better compatibility)
- Include plain text alternative if needed

### Cleanup Old Tokens

The email action tokens (for approve/deny links) are stored in the database. To clean up expired tokens, run periodically:

```sql
SELECT cleanup_expired_email_tokens();
```

Set up a cron job or use Supabase's pg_cron extension to automate this.

---

## Related Files

- **API Endpoint:** `/frontend/src/app/api/send-approval-email/route.ts`
- **Email Action API:** `/frontend/src/app/api/beta-invite-action/route.ts`
- **Database Migration:** `/database/migrations/add_email_action_tokens.sql`
- **Confirmation Page:** `/frontend/src/app/beta-invite-action/page.tsx`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_WEBHOOK_SECRET` | ✅ Yes | Secret for validating webhook requests |
| `RESEND_API_KEY` | ✅ Yes | Resend API key for sending emails |
| `EMAIL_FROM` | ⚠️ Recommended | Sender email (e.g., `noreply@yourdomain.com`) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | Your site URL for signup links |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | For creating email action tokens |

---

## Support

If you encounter issues not covered in this guide:

1. Check application logs
2. Check Supabase webhook logs
3. Check Resend email delivery logs
4. Review the API endpoint code for any custom modifications

---

## Changelog

### 2024-12-08
- Initial setup documentation
- Added webhook-based approval email system
- Implemented security with secret validation
- Created comprehensive troubleshooting guide
