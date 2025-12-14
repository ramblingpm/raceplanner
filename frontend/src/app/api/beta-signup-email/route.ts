import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { cookies } from 'next/headers';
import { defaultLocale, Locale, locales } from '@/i18n/config';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json();

    // Get locale from cookies for translations
    const cookieStore = await cookies();
    const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || defaultLocale;

    // Validate locale and import messages
    const validLocale = locales.includes(locale) ? locale : defaultLocale;
    const messages = (await import(`../../../../messages/${validLocale}.json`)).default;
    const appName = messages.common.appName;

    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      console.log('❌ No Turnstile token provided');
      return NextResponse.json({ error: 'Bot verification required' }, { status: 400 });
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      console.log('❌ Invalid Turnstile token');
      return NextResponse.json({ error: 'Bot verification failed' }, { status: 403 });
    }

    console.log('✅ Turnstile verification passed');

    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@raceplanner.com';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resendApiKey = process.env.RESEND_API_KEY;

 
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY is not configured!');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }


    // Email to the user
    const userEmailResult = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: email,
      subject: 'Thank you for requesting beta access!',
      html: `
        <h1>Thank you for your interest in ${appName}!</h1>
        <p>We've received your beta access request and are excited to have you join us.</p>
        <p>Our team will review your request and you'll receive an email notification once you've been approved.</p>
        <p>This typically takes 24-48 hours.</p>
        <br />
        <p>Best regards,<br />The ${appName} Team</p>
      `,
    });

    console.log('📧 User email result:', JSON.stringify(userEmailResult, null, 2));

    if (userEmailResult.error) {
      console.error('❌ User email error:', userEmailResult.error);
    }



    // Get the beta invite for this email to create action tokens
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: betaInvite, error: inviteError } = await supabase
      .from('beta_invites')
      .select('id')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let approveLink = `${siteUrl}/admin/beta-invites`;
    let denyLink = `${siteUrl}/admin/beta-invites`;
    let emailActionButtons = '';

    if (!inviteError && betaInvite) {
      // Create tokens for approve and deny actions
      const { data: approveToken } = await supabase.rpc('create_email_action_token', {
        p_email: email.toLowerCase(),
        p_action: 'approve',
        p_beta_invite_id: betaInvite.id,
      });

      const { data: denyToken } = await supabase.rpc('create_email_action_token', {
        p_email: email.toLowerCase(),
        p_action: 'deny',
        p_beta_invite_id: betaInvite.id,
      });

      if (approveToken && denyToken) {
        approveLink = `${siteUrl}/api/beta-invite-action?token=${encodeURIComponent(approveToken)}`;
        denyLink = `${siteUrl}/api/beta-invite-action?token=${encodeURIComponent(denyToken)}`;

        emailActionButtons = `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
            <tr>
              <td style="padding-right: 10px;">
                <a href="${approveLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  ✓ Approve
                </a>
              </td>
              <td>
                <a href="${denyLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  ✗ Deny
                </a>
              </td>
            </tr>
          </table>
        `;
      }
    }

    // Email to admin(s)
    const adminEmailResult = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: adminEmail,
      subject: 'New Beta Access Request',
      html: `
        <h2>New Beta Access Request</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p>A new user has requested beta access.</p>
        ${emailActionButtons}
        <p style="margin-top: 20px;">Or <a href="${siteUrl}/admin/beta-invites">manage in admin panel</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Action links expire in 72 hours.</p>
      `,
    });

    console.log('📧 Admin email result:', JSON.stringify(adminEmailResult, null, 2));

    if (adminEmailResult.error) {
      console.error('❌ Admin email error:', adminEmailResult.error);
    }

    return NextResponse.json({
      success: true,
      userEmailId: userEmailResult.data?.id,
      adminEmailId: adminEmailResult.data?.id,
    });
  } catch (error) {
    console.error('❌ Error sending beta signup emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
