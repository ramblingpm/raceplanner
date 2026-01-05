import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { defaultLocale, locales } from '@/i18n/config';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple HTML sanitizer for serverless environments (avoids jsdom issues)
// Allows safe HTML tags: p, br, strong, em, u, h1-h6, ul, ol, li, a, img, div, span, table, tr, td, th, thead, tbody
// Allows safe attributes: href, src, alt, title, class, style, target
function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Remove data: URLs (except for images which might be safe)
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');

  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

  return sanitized;
}

export async function POST(request: NextRequest) {
  console.log('📧 [Marketing Email API] Request received');

  try {
    // Parse request body with better error handling
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ [Marketing Email API] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { subject, html, recipients } = requestBody;

    console.log('📧 [Marketing Email API] Request data:', {
      hasSubject: !!subject,
      hasHtml: !!html,
      recipientCount: recipients?.length || 0
    });

    // Validate input
    if (!subject || !html) {
      console.error('❌ [Marketing Email API] Missing subject or HTML');
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.error('❌ [Marketing Email API] Invalid recipients array');
      return NextResponse.json(
        { error: 'Recipients array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Check Resend BCC limit (typically 50 recipients per email)
    if (recipients.length > 50) {
      console.error('❌ [Marketing Email API] Too many recipients:', recipients.length);
      return NextResponse.json(
        { error: `Too many recipients. Maximum 50 allowed, but got ${recipients.length}. Please send in smaller batches.` },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found');
      return NextResponse.json({ error: 'Unauthorized', debug: 'Missing auth token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client and verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get authenticated user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', debug: 'Invalid token' }, { status: 401 });
    }

    if (!user) {
      console.error('❌ No user found with token');
      return NextResponse.json({ error: 'Unauthorized', debug: 'No user found' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Verify the authenticated user is an admin using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json({ error: 'Forbidden', debug: 'Admin check failed' }, { status: 403 });
    }

    if (!adminData) {
      console.error('❌ User is not an admin:', user.id);
      return NextResponse.json({ error: 'Forbidden', debug: 'Not an admin' }, { status: 403 });
    }

    console.log('✅ Admin verified:', user.id);

    // Sanitize HTML content to prevent XSS (using simple regex-based sanitizer for serverless compatibility)
    const sanitizedHtml = sanitizeHtml(html);

    // Get locale preference and app name
    const locale = defaultLocale;
    const validLocale = locales.includes(locale) ? locale : defaultLocale;
    const messages = (await import(`../../../../messages/${validLocale}.json`)).default;
    const appName = messages.common.appName;

    const fromEmail = process.env.MARKETING_EMAIL_FROM || process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('❌ [Marketing Email API] RESEND_API_KEY is not configured!');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    if (!process.env.MARKETING_EMAIL_FROM) {
      console.warn('⚠️ [Marketing Email API] MARKETING_EMAIL_FROM not set, falling back to EMAIL_FROM or default');
    }

    console.log(`📧 [Marketing Email API] Sending marketing email to ${recipients.length} recipients by admin ${user.id}`);

    // Send emails using BCC to respect privacy
    let emailResult;
    try {
      emailResult = await resend.emails.send({
        from: `${appName} <${fromEmail}>`,
        to: fromEmail, // Send to self
        bcc: recipients, // Use BCC for privacy
        subject: subject,
        html: sanitizedHtml, // Use sanitized HTML
      });
    } catch (resendError) {
      console.error('❌ [Marketing Email API] Resend API threw error:', resendError);
      return NextResponse.json(
        { error: `Email service error: ${resendError instanceof Error ? resendError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (emailResult.error) {
      console.error('❌ [Marketing Email API] Resend returned error:', emailResult.error);
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error.message || emailResult.error}` },
        { status: 500 }
      );
    }

    console.log(`✅ [Marketing Email API] Email sent successfully to ${recipients.length} recipients`, {
      emailId: emailResult.data?.id,
      adminUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${recipients.length} recipients`,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('❌ [Marketing Email API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
