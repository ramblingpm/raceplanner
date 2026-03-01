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

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  return adminUser ? user : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raceId } = await params;
    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const ALLOWED_FIELDS = ['name', 'is_public', 'start_date', 'end_date', 'distance_km', 'description'];
    const update = Object.fromEntries(
      Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    );

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('races')
      .update(update)
      .eq('id', raceId);

    if (error) {
      console.error('[Admin PATCH Race API] Error:', error);
      return NextResponse.json({ error: 'Failed to update race' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin PATCH Race API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raceId } = await params;
    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
