# Production Configuration for raceplanner.ramblingpm.com

## Exact Values for Copy-Paste

Your production domain: **https://raceplanner.ramblingpm.com**

---

## Step 1: Vercel Environment Variable

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Click **Add New** and enter:

```
Name: NEXT_PUBLIC_SITE_URL
Value: https://raceplanner.ramblingpm.com
Environments: ✓ Production ✓ Preview ✓ Development
```

**Copy-paste value:**
```
https://raceplanner.ramblingpm.com
```

---

## Step 2: Supabase Webhook Configuration

Go to: https://supabase.com/dashboard → Your Project → Database → Webhooks → Create webhook

### Exact Configuration:

**Name:**
```
beta-approval-email
```

**Table:**
```
beta_invites
```

**Events:**
- ✓ UPDATE
- ☐ INSERT
- ☐ DELETE

**Type:** HTTP Request

**Method:** POST

**URL (copy-paste this):**
```
https://raceplanner.ramblingpm.com/api/send-approval-email
```

**HTTP Headers:**

Click "Add header" and enter:

**Key:**
```
x-webhook-secret
```

**Value:**
```
51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c
```

**HTTP Params:** (leave empty)

---

## Step 3: Redeploy

After adding the environment variable:

1. Go to: Vercel Dashboard → Deployments
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. **UNCHECK** "Use existing Build Cache" ← Important!
5. Click **Redeploy**
6. Wait ~2-3 minutes for deployment to complete

---

## Step 4: Test Your Production Emails

### Test 1: Beta Signup

1. Go to: https://raceplanner.ramblingpm.com/beta-signup
2. Submit your email address
3. You should receive **2 emails**:
   - **User email:** "Thank you for requesting beta access!"
   - **Admin email:** "New Beta Access Request" (sent to: ramblingpm@ramblingpm.com)

4. **Verify links in the admin email:**
   - Approve button should link to: `https://raceplanner.ramblingpm.com/api/beta-invite-action?token=...`
   - Should **NOT** be `http://localhost:3000`

### Test 2: Approval Email

1. Click the **Approve** button in the admin email
2. User should receive: "🎉 Your Race Planner Beta Access Has Been Approved!"
3. **Verify "Create Your Account" button** links to:
   ```
   https://raceplanner.ramblingpm.com/signup
   ```

---

## Verification Checklist

After setup, verify:

- [ ] `NEXT_PUBLIC_SITE_URL` is set in Vercel to `https://raceplanner.ramblingpm.com`
- [ ] Application has been redeployed (without build cache)
- [ ] Supabase webhook is created and enabled
- [ ] Webhook URL is: `https://raceplanner.ramblingpm.com/api/send-approval-email`
- [ ] Webhook has header: `x-webhook-secret` with correct value
- [ ] Beta signup sends 2 emails
- [ ] All email links point to `https://raceplanner.ramblingpm.com` (not localhost)
- [ ] Clicking "Approve" in email sends approval email to user

---

## Check Webhook Logs

After approving a beta invite, check if webhook fired:

1. Go to: Supabase Dashboard → Database → Webhooks
2. Click on **beta-approval-email** webhook
3. Click **Logs** tab
4. Look for recent entries

**Success looks like:**
```
Status: 200 OK
Response: {"success":true,"message":"Approval email sent successfully","emailId":"..."}
```

**Common errors:**
- `401 Unauthorized` → Webhook secret mismatch (check header value)
- `404 Not Found` → Wrong URL (check domain and endpoint path)
- `500 Internal Server Error` → Check Vercel function logs

---

## Check Vercel Function Logs

If webhook shows errors:

1. Go to: Vercel Dashboard → Deployments
2. Click latest deployment
3. Click **Functions** tab
4. Look for `/api/send-approval-email`
5. Check logs for error messages

---

## Email Delivery Check

View all sent emails:

1. Go to: https://resend.com/emails
2. Filter by date: Today
3. You should see emails being sent
4. Click on any email to see delivery status and content

---

## Your Current Email Configuration

Based on your `.env` file, you have:

```
RESEND_API_KEY=re_jMs6T7rH_LSnVP1NLRVi7nTYFLmwo5SHb
ADMIN_EMAIL=ramblingpm@ramblingpm.com
EMAIL_FROM=stephan@raceplanner.ramblingpm.com
SUPABASE_WEBHOOK_SECRET=51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c
```

**Verify in Vercel** that these production values are also set correctly.

---

## Quick Test URLs

Once deployed, you can test these URLs:

**Beta Signup Page:**
```
https://raceplanner.ramblingpm.com/beta-signup
```

**Admin Beta Invites Panel:**
```
https://raceplanner.ramblingpm.com/admin/beta-invites
```

**Signup Page (for approved users):**
```
https://raceplanner.ramblingpm.com/signup
```

---

## Expected Email Flow

```
1. User goes to: https://raceplanner.ramblingpm.com/beta-signup
2. Submits email → Creates beta_invite record
3. API sends 2 emails:
   ├─→ User: "Thank you" confirmation
   └─→ Admin (ramblingpm@ramblingpm.com): Notification with buttons

4. Admin clicks "Approve" button in email
5. Token validates → Updates beta_invites.approved = true
6. Database UPDATE triggers Supabase webhook
7. Webhook calls: https://raceplanner.ramblingpm.com/api/send-approval-email
8. API sends approval email to user
9. User clicks "Create Your Account"
10. Redirects to: https://raceplanner.ramblingpm.com/signup
```

---

## Total Setup Time: ~10 minutes

1. Add env var to Vercel: 2 min
2. Redeploy: 3 min (automatic)
3. Configure webhook: 3 min
4. Test: 2 min

---

## If You Need Help

After following these steps, if something doesn't work:

1. Check Supabase webhook logs first
2. Check Vercel function logs second
3. Check Resend email delivery third
4. Verify all URLs point to `https://raceplanner.ramblingpm.com` (no `http://`, no `localhost`)

---

## Quick Summary

**Add to Vercel:**
```
NEXT_PUBLIC_SITE_URL=https://raceplanner.ramblingpm.com
```

**Supabase Webhook URL:**
```
https://raceplanner.ramblingpm.com/api/send-approval-email
```

**Webhook Header:**
```
x-webhook-secret: 51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c
```

That's it! These are the only two things you need to configure for production emails to work.
