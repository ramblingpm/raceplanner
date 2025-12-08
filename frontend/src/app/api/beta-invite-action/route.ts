import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/beta-invite-action?error=missing_token', request.url)
      );
    }

    // Create a Supabase client (using anon key, RPC function will handle auth)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Call the RPC function to process the action
    const { data, error } = await supabase.rpc('process_email_action', {
      p_token: token,
    });

    if (error) {
      console.error('Error processing email action:', error);
      return NextResponse.redirect(
        new URL('/beta-invite-action?error=server_error', request.url)
      );
    }

    // Build redirect URL based on result
    const result = data as {
      success: boolean;
      action?: string;
      error?: string;
      message: string;
      email?: string;
    };

    if (result.success) {
      return NextResponse.redirect(
        new URL(
          `/beta-invite-action?status=${result.action}&email=${encodeURIComponent(result.email || '')}`,
          request.url
        )
      );
    } else {
      return NextResponse.redirect(
        new URL(
          `/beta-invite-action?error=${result.error}&message=${encodeURIComponent(result.message)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error('Error processing beta invite action:', error);
    return NextResponse.redirect(
      new URL('/beta-invite-action?error=server_error', request.url)
    );
  }
}
