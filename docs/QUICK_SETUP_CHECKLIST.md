# Beta Approval Email - Quick Setup Checklist

**⏱️ Estimated Time:** 10 minutes

Use this checklist for a quick setup. For detailed documentation, see [BETA_APPROVAL_WEBHOOK_SETUP.md](./BETA_APPROVAL_WEBHOOK_SETUP.md).

---

## Pre-Deployment Checklist

- [ ] **Generate webhook secret**
  ```bash
  openssl rand -hex 32
  ```

- [ ] **Add to `.env.local`**
  ```env
  SUPABASE_WEBHOOK_SECRET=your_generated_secret
  ```

- [ ] **Verify required env vars are set:**
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `NEXT_PUBLIC_SITE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Deploy application** (webhook needs public URL)

---

## Supabase Setup Checklist

1. **Open Supabase Dashboard**
   - Go to your project
   - Database → Webhooks

2. **Create Webhook**
   - Name: `beta_invite_approved`
   - Table: `beta_invites`
   - Events: ✅ Update only
   - Type: HTTP Request
   - Method: POST
   - URL: `https://your-domain.com/api/send-approval-email`

3. **Add Header**
   - Key: `x-webhook-secret`
   - Value: `[your secret from step 1]`

4. **Save webhook**

---

## Testing Checklist

- [ ] Webhook appears in Supabase Dashboard
- [ ] Create test beta invite
- [ ] Approve the test invite
- [ ] User receives approval email
- [ ] Email contains signup link
- [ ] Check Supabase webhook logs (should show success)
- [ ] Check application logs for success message

---

## Production Checklist

- [ ] Add `SUPABASE_WEBHOOK_SECRET` to production env vars
- [ ] Update webhook URL to production domain
- [ ] Test approval in production
- [ ] Monitor webhook logs for first few approvals
- [ ] Set up monitoring/alerts for webhook failures

---

## Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| No email received | Check Supabase webhook logs for errors |
| "Unauthorized" error | Verify webhook secret matches in both places |
| Webhook fails | Ensure app is deployed and URL is accessible |
| Email bounces | Verify sender email in Resend Dashboard |

For detailed troubleshooting, see the [full documentation](./BETA_APPROVAL_WEBHOOK_SETUP.md#troubleshooting).

---

## Need Help?

See the full setup guide: [BETA_APPROVAL_WEBHOOK_SETUP.md](./BETA_APPROVAL_WEBHOOK_SETUP.md)
