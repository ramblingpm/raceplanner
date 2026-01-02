import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: Request) {
  try {
    console.log('[Admin Races API] Request received');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('[Admin Races API] No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    console.log('[Admin Races API] Verifying user token...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.log('[Admin Races API] User verification failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Admin Races API] User verified:', user.id);

    // Check if user is admin by checking admin_users table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    console.log('[Admin Races API] Admin check:', { adminUser, adminError });

    if (!adminUser) {
      console.log('[Admin Races API] User is not admin');
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('[Admin Races API] User is admin, fetching all races...');

    // Fetch all races using service role (bypasses RLS)
    const { data: races, error: racesError } = await supabaseAdmin
      .from('races')
      .select('*')
      .order('created_at', { ascending: false });

    if (racesError) {
      console.error('[Admin Races API] Error fetching races:', racesError);
      return NextResponse.json({ error: 'Failed to fetch races' }, { status: 500 });
    }

    console.log('[Admin Races API] Successfully fetched', races?.length, 'races');
    return NextResponse.json({ races });
  } catch (error) {
    console.error('[Admin Races API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
