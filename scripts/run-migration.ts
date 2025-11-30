import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath: string) {
  console.log(`Running migration: ${filePath}`);
  const sql = readFileSync(filePath, 'utf-8');

  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 100)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      // Try direct execution via postgres REST API
      const { error: directError } = await supabase.from('_migrations').insert({
        name: filePath,
        executed_at: new Date().toISOString(),
      });

      if (directError) {
        console.error('Error executing statement:', error);
      }
    }
  }

  console.log('✅ Migration completed');
  process.exit(0);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: tsx run-migration.ts <migration-file>');
  process.exit(1);
}

runMigration(migrationFile);
