# Race Planner Documentation

Welcome to the Race Planner documentation! This directory contains guides for setting up and maintaining various features of the application.

## 📚 Documentation Index

### Beta Access System

The application uses a beta invite system to control access during early development.

#### Setup Guides

1. **[Beta Approval Webhook Setup](./BETA_APPROVAL_WEBHOOK_SETUP.md)** - Complete guide for setting up automatic approval emails
   - How the webhook system works
   - Detailed setup instructions
   - Security considerations
   - Troubleshooting guide
   - Maintenance tips

2. **[Quick Setup Checklist](./QUICK_SETUP_CHECKLIST.md)** - TL;DR version for quick reference
   - 10-minute setup guide
   - Pre-deployment checklist
   - Testing checklist
   - Quick troubleshooting

---

## 🚀 Getting Started

### For New Deployments

If you're setting up Race Planner for the first time:

1. Complete the main application setup (database, environment variables)
2. Follow the [Quick Setup Checklist](./QUICK_SETUP_CHECKLIST.md) for beta approval emails
3. Test with a sample beta invite

### For Existing Installations

If you're adding the beta approval email feature to an existing installation:

1. Run the database migration: `/database/migrations/add_email_action_tokens.sql`
2. Add the required environment variables
3. Follow the [Beta Approval Webhook Setup](./BETA_APPROVAL_WEBHOOK_SETUP.md) guide

---

## 🔧 Key Features Documented

### Email-Based Beta Approval Flow

- ✅ Admins receive emails with approve/deny buttons
- ✅ One-click approval from email (no login required)
- ✅ Automatic welcome email sent to approved users
- ✅ Secure token-based authentication
- ✅ 72-hour expiration on action links
- ✅ Localized content based on user preferences

### Architecture

```
User Requests Beta Access
         ↓
Admin Receives Email (with Approve/Deny buttons)
         ↓
Admin Clicks "Approve"
         ↓
Database: beta_invites.approved = true
         ↓
Supabase Webhook Triggers
         ↓
API sends welcome email to user
         ↓
User receives approval email with signup link
```

---

## 🔐 Security

All webhook endpoints are secured with:
- Secret token validation
- Event type verification
- Database-level RLS policies
- Time-limited action tokens

See the [Security section](./BETA_APPROVAL_WEBHOOK_SETUP.md#security) for details.

---

## 📊 Monitoring

### What to Monitor

1. **Webhook Success Rate**
   - Supabase Dashboard → Database → Webhooks

2. **Email Delivery**
   - Resend Dashboard → Logs

3. **Application Logs**
   - Search for: `send-approval-email webhook`

See [Maintenance](./BETA_APPROVAL_WEBHOOK_SETUP.md#maintenance) for details.

---

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not firing | Check if webhook is enabled in Supabase Dashboard |
| Emails not sent | Verify `SUPABASE_WEBHOOK_SECRET` and `RESEND_API_KEY` |
| Invalid token errors | Ensure webhook secret matches in environment variables |

For detailed troubleshooting, see the [Troubleshooting Guide](./BETA_APPROVAL_WEBHOOK_SETUP.md#troubleshooting).

---

## 📁 Related Files

### Frontend
- `/frontend/src/app/api/send-approval-email/route.ts` - Webhook endpoint
- `/frontend/src/app/api/beta-signup-email/route.ts` - Initial signup email
- `/frontend/src/app/api/beta-invite-action/route.ts` - Email action handler
- `/frontend/src/app/beta-invite-action/page.tsx` - Confirmation page

### Database
- `/database/migrations/add_email_action_tokens.sql` - Token storage setup

### Configuration
- `/frontend/src/i18n/config.ts` - Localization settings
- `/messages/en.json` - English translations
- `/messages/sv.json` - Swedish translations

---

## 🔄 Updates

### Latest Changes (2024-12-08)

- ✅ Added Supabase webhook integration for approval emails
- ✅ Implemented email-based approve/deny actions
- ✅ Added comprehensive documentation
- ✅ Created security token system
- ✅ Localized email content

---

## 📝 Contributing

When adding new features:

1. Update relevant documentation
2. Add to this index if creating new guides
3. Update the changelog in relevant docs
4. Test thoroughly in development before deploying

---

## 📞 Questions?

For questions not covered in the documentation:
- Review the code comments in the related files
- Check application and webhook logs
- Consult Supabase and Resend documentation

---

*Last Updated: 2024-12-08*
