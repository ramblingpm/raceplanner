import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, Locale, locales } from '@/i18n/config';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WebhookPayload {
  type: 'UPDATE' | 'INSERT' | 'DELETE';
  table: string;
  record: {
    id: string;
    email: string;
    approved: boolean;
    approved_at: string;
    [key: string]: any;
  };
  old_record?: {
    approved: boolean;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret to ensure request is from Supabase
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('❌ SUPABASE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (webhookSecret !== expectedSecret) {
      console.error('❌ Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: WebhookPayload = await request.json();

    // Validate this is an approval event
    // We only want to send email when approved changes from false to true
    if (
      payload.type !== 'UPDATE' ||
      payload.table !== 'beta_invites' ||
      !payload.old_record ||
      payload.old_record.approved === true ||
      payload.record.approved !== true
    ) {
      // Not an approval event, silently ignore
      return NextResponse.json({ message: 'Not an approval event, ignored' });
    }

    const email = payload.record.email;
    console.log(`✅ Beta invite approved for ${email}, sending approval email...`);

    // Get locale preference (default to Swedish)
    // In the future, you could store user's preferred locale in beta_invites table
    const locale = defaultLocale;
    const validLocale = locales.includes(locale) ? locale : defaultLocale;
    const messages = (await import(`../../../../../messages/${validLocale}.json`)).default;
    const appName = messages.common.appName;

    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const signupUrl = `${siteUrl}/signup`;

    // Send approval email to the user
    const emailResult = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: email,
      subject: `🎉 Your ${appName} Beta Access Has Been Approved!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; padding: 40px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
                      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #111827;">
                        Welcome to ${appName}!
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Great news! Your beta access request has been approved.
                      </p>

                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                        You can now create your account and start planning your perfect race strategy!
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${signupUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Create Your Account
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- What's Next Section -->
                      <div style="margin-top: 40px; padding: 20px; background-color: #f3f4f6; border-radius: 6px;">
                        <h2 style="margin: 0 0 15px; font-size: 18px; font-weight: 600; color: #111827;">
                          What you can do with ${appName}:
                        </h2>
                        <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                          <li style="margin-bottom: 8px;">📊 Calculate race times and required speeds</li>
                          <li style="margin-bottom: 8px;">🗺️ Visualize race routes on interactive maps</li>
                          <li style="margin-bottom: 8px;">⏱️ Plan feed zone stops and optimize your strategy</li>
                          <li style="margin-bottom: 8px;">💾 Save and compare multiple race plans</li>
                        </ul>
                      </div>

                      <!-- Support Info -->
                      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                        If you have any questions or need help getting started, feel free to reach out to us.
                      </p>

                      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Best regards,<br />
                        <strong>The ${appName} Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f9fafb; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                        You're receiving this email because you requested beta access to ${appName}.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailResult.error) {
      console.error('❌ Error sending approval email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    console.log(`✅ Approval email sent successfully to ${email}`, {
      emailId: emailResult.data?.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Approval email sent successfully',
      emailId: emailResult.data?.id,
    });
  } catch (error) {
    console.error('❌ Error in send-approval-email webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
