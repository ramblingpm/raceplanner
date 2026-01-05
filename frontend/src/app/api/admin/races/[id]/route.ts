import { NextRequest, NextResponse } from 'next/server';
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raceId } = await params;

    console.log('[Admin Delete Race API] Request received for race:', raceId);

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('[Admin Delete Race API] No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    console.log('[Admin Delete Race API] Verifying user token...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.log('[Admin Delete Race API] User verification failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Admin Delete Race API] User verified:', user.id);

    // Check if user is admin by checking admin_users table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    console.log('[Admin Delete Race API] Admin check:', { adminUser, adminError });

    if (!adminUser) {
      console.log('[Admin Delete Race API] User is not admin');
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('[Admin Delete Race API] User is admin, deleting race...');

    // First, delete all feed zones for this race
    const { error: feedZonesError } = await supabaseAdmin
      .from('feed_zones')
      .delete()
      .eq('race_id', raceId);

    if (feedZonesError) {
      console.error('[Admin Delete Race API] Error deleting feed zones:', feedZonesError);
      return NextResponse.json({ error: 'Failed to delete race feed zones' }, { status: 500 });
    }

    // Then delete the race itself
    const { error: raceError } = await supabaseAdmin
      .from('races')
      .delete()
      .eq('id', raceId);

    if (raceError) {
      console.error('[Admin Delete Race API] Error deleting race:', raceError);
      return NextResponse.json({ error: 'Failed to delete race' }, { status: 500 });
    }

    console.log('[Admin Delete Race API] Successfully deleted race and feed zones');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Delete Race API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
