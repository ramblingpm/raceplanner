import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { defaultLocale, Locale, locales } from '@/i18n/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { subject, html, recipientFilter, adminUserId } = await request.json();

    // Validate input
    if (!subject || !html) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    if (!adminUserId) {
      console.log('❌ No admin user ID provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', adminUserId)
      .single();

    if (adminError || !adminData) {
      console.log('❌ User is not an admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get locale preference and app name
    const locale = defaultLocale;
    const validLocale = locales.includes(locale) ? locale : defaultLocale;
    const messages = (await import(`../../../../messages/${validLocale}.json`)).default;
    const appName = messages.common.appName;

    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY is not configured!');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Fetch beta invites based on filter
    let query = supabase.from('beta_invites').select('email');

    switch (recipientFilter) {
      case 'all':
        // No filter - get all
        break;
      case 'approved':
        query = query.eq('approved', true);
        break;
      case 'approved_not_used':
        query = query.eq('approved', true).eq('used', false);
        break;
      case 'used':
        query = query.eq('used', true);
        break;
      case 'pending':
        query = query.eq('approved', false).eq('used', false);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid recipient filter' },
          { status: 400 }
        );
    }

    const { data: invites, error: invitesError } = await query;

    if (invitesError) {
      console.error('❌ Error fetching invites:', invitesError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients', details: invitesError.message },
        { status: 500 }
      );
    }

    if (!invites || invites.length === 0) {
      console.log('⚠️ No recipients found for filter:', recipientFilter);
      return NextResponse.json(
        { error: 'No recipients found matching the selected filter' },
        { status: 400 }
      );
    }

    const recipients = invites.map((invite) => invite.email);
    console.log(`📧 Sending marketing email to ${recipients.length} recipients`);

    // Send emails using BCC to respect privacy
    const emailResult = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: fromEmail, // Send to self
      bcc: recipients, // Use BCC for privacy
      subject: subject,
      html: html,
    });

    if (emailResult.error) {
      console.error('❌ Error sending marketing email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    console.log(`✅ Marketing email sent successfully to ${recipients.length} recipients`, {
      emailId: emailResult.data?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${recipients.length} recipients`,
      emailId: emailResult.data?.id,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('❌ Error in send-marketing-email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
