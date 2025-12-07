import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {


    const { email } = await request.json();


    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

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
      from: `Race Planner <${fromEmail}>`,
      to: email,
      subject: 'Thank you for requesting beta access!',
      html: `
        <h1>Thank you for your interest in Race Planner!</h1>
        <p>We've received your beta access request and are excited to have you join us.</p>
        <p>Our team will review your request and you'll receive an email notification once you've been approved.</p>
        <p>This typically takes 24-48 hours.</p>
        <br />
        <p>Best regards,<br />The Race Planner Team</p>
      `,
    });



    // Email to admin(s)
    const adminEmailResult = await resend.emails.send({
      from: `Race Planner <${fromEmail}>`,
      to: adminEmail,
      subject: 'New Beta Access Request',
      html: `
        <h2>New Beta Access Request</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p>A new user has requested beta access. Please review and approve in the admin panel.</p>
        <br />
        <p><a href="${siteUrl}/admin/beta-invites">Go to Admin Panel</a></p>
      `,
    });


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
