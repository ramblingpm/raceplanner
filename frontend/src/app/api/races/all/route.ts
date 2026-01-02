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
    console.log('[All Races API] Request received');

    // Fetch all races using service role (bypasses RLS)
    // This is public endpoint - anyone can see all races (for coming soon feature)
    const { data: races, error: racesError } = await supabaseAdmin
      .from('races')
      .select('*')
      .order('created_at', { ascending: false });

    if (racesError) {
      console.error('[All Races API] Error fetching races:', racesError);
      return NextResponse.json({ error: 'Failed to fetch races' }, { status: 500 });
    }

    console.log('[All Races API] Successfully fetched', races?.length, 'races');
    return NextResponse.json({ races });
  } catch (error) {
    console.error('[All Races API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
