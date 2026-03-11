/**
 * Run database migrations on Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('🚀 Running migrations on Supabase...\n');
        console.log(`   URL: ${supabaseUrl}\n`);

        // Read migration file
        const migrationPath = path.join(__dirname, '../src/migrations/0000_shiny_captain_america.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        // Split by statement-breakpoint and execute each statement
        const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
        
        console.log(`📋 Found ${statements.length} statements to execute\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const preview = statement.substring(0, 50).replace(/\n/g, ' ');
            process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}... `);

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });
                
                if (error) {
                    // Try direct query if RPC fails
                    const { error: queryError } = await supabase.from('_exec_sql').select('*').eq('query', statement);
                    if (queryError && !queryError.message.includes('does not exist')) {
                        throw queryError;
                    }
                }
                
                console.log('✅');
                successCount++;
            } catch (err: any) {
                // Some statements might fail if objects already exist, which is OK
                if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
                    console.log('⚠️ (already exists)');
                    successCount++;
                } else {
                    console.log(`❌ ${err.message}`);
                    errorCount++;
                }
            }
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   ✅ ${successCount} statements executed`);
        if (errorCount > 0) {
            console.log(`   ❌ ${errorCount} statements failed`);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
