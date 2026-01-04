import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { defaultLocale, Locale, locales } from '@/i18n/config';
import DOMPurify from 'isomorphic-dompurify';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { subject, html, recipientFilter } = await request.json();

    // Validate input
    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with cookies for auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the authenticated user is an admin using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sanitize HTML content to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target'],
    });

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

    // Fetch beta invites based on filter using admin client
    let query = supabaseAdmin.from('beta_invites').select('email');

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
        { error: 'Failed to fetch recipients' },
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
    console.log(`📧 Sending marketing email to ${recipients.length} recipients by admin ${user.id}`);

    // Send emails using BCC to respect privacy
    const emailResult = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: fromEmail, // Send to self
      bcc: recipients, // Use BCC for privacy
      subject: subject,
      html: sanitizedHtml, // Use sanitized HTML
    });

    if (emailResult.error) {
      console.error('❌ Error sending marketing email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`✅ Marketing email sent successfully to ${recipients.length} recipients`, {
      emailId: emailResult.data?.id,
      adminUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${recipients.length} recipients`,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('❌ Error in send-marketing-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
