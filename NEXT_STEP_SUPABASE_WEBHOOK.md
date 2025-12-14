# ✅ Step 1 Complete: Vercel Environment Variable Added

The `NEXT_PUBLIC_SITE_URL` has been successfully added to Vercel and deployed!

- ✅ Environment variable: `NEXT_PUBLIC_SITE_URL = https://raceplanner.ramblingpm.com`
- ✅ Deployed to production
- ✅ Custom domain is working: https://raceplanner.ramblingpm.com

---

## 🔧 Step 2: Configure Supabase Webhook (5 minutes)

This is the ONLY remaining step to fix the approval email issue.

### Quick Instructions

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Select your Race Planner project**

3. **Navigate to:** Database → Webhooks

4. **Click:** "Create a new webhook" or "Enable Webhooks"

5. **Fill in the form with these EXACT values:**

---

### Webhook Configuration Form

#### Basic Settings

**Name:**
```
beta-approval-email
```

**Table:**
```
beta_invites
```

**Events:**
- ✅ UPDATE (check this)
- ☐ INSERT (leave unchecked)
- ☐ DELETE (leave unchecked)

---

#### HTTP Request Settings

**Type:**
```
HTTP Request
```

**Method:**
```
POST
```

**URL:** (copy-paste this exactly)
```
https://raceplanner.ramblingpm.com/api/send-approval-email
```

---

#### HTTP Headers

Click **"Add header"** button and enter:

**Header Key:**
```
x-webhook-secret
```

**Header Value:**
```
51b308ea74c2f4f20cb6da13953f52d626a1f932f5471a3688c3c40566a6af8c
```

---

#### HTTP Params

Leave empty (no query parameters needed)

---

#### Advanced Options (optional)

- **Timeout:** 5000ms (default is fine)
- **Retry Logic:** Enable (recommended)

---

6. **Click:** "Create webhook" or "Save"

---

## ✅ Verification

After creating the webhook, you should see it in the list:

- **Name:** beta-approval-email
- **Table:** beta_invites
- **Status:** Enabled (green dot)

---

## 🧪 Test the Email Flow

Once webhook is configured, test the complete flow:

### Test 1: Beta Signup

1. Go to: https://raceplanner.ramblingpm.com/beta-signup
2. Submit your email address
3. You should receive **2 emails**:
   - User confirmation: "Thank you for requesting beta access!"
   - Admin notification to: ramblingpm@ramblingpm.com

### Test 2: Approval Email

1. Check the admin email
2. Click the **Approve** button
3. User should receive: "🎉 Your Race Planner Beta Access Has Been Approved!"
4. Verify the "Create Your Account" button links to:
   ```
   https://raceplanner.ramblingpm.com/signup
   ```

### Test 3: Verify Links

Check that ALL email links point to your production domain:
- ✅ https://raceplanner.ramblingpm.com/...
- ❌ NOT http://localhost:3000/...

---

## 🔍 Check Webhook Logs

After testing, verify the webhook fired successfully:

1. Go to: Supabase Dashboard → Database → Webhooks
2. Click on: **beta-approval-email**
3. Click: **Logs** tab
4. Look for the most recent entry

**Success looks like:**
```
Status: 200 OK
Response Body: {
  "success": true,
  "message": "Approval email sent successfully",
  "emailId": "..."
}
```

**Common Issues:**

| Status | Cause | Fix |
|--------|-------|-----|
| 401 Unauthorized | Webhook secret mismatch | Double-check the secret header value |
| 404 Not Found | Wrong URL | Verify URL is exactly: `https://raceplanner.ramblingpm.com/api/send-approval-email` |
| 500 Internal Error | Server error | Check Vercel function logs |
| Timeout | Endpoint not responding | Verify URL and deployment status |

---

## 📊 Check Vercel Function Logs (if needed)

If webhook shows errors:

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click: **Deployments** → Latest deployment
4. Click: **Functions** tab
5. Find: `/api/send-approval-email`
6. View logs

---

## 📧 Check Email Delivery

View all sent emails:

1. Go to: https://resend.com/emails
2. Filter by today's date
3. Check delivery status of emails

---

## Summary

You're almost done! Just configure the Supabase webhook and you'll have:

✅ Beta signup emails working (sends user + admin emails)
✅ Approval emails working (sends when admin approves)
✅ All email links pointing to production domain
✅ Full email automation working end-to-end

**Time to complete:** ~5 minutes
