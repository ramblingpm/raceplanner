import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTestRace() {
  console.log('Deleting "Tour de Test" race...');

  const { data, error } = await supabase
    .from('races')
    .delete()
    .eq('name', 'Tour de Test')
    .select();

  if (error) {
    console.error('Error deleting race:', error);
  } else {
    console.log('✅ Successfully deleted race:', data);
  }

  process.exit(0);
}

deleteTestRace();
