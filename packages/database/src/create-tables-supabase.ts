/**
 * Create tables in Supabase using direct PostgreSQL connection
 */

import postgres from 'postgres';
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

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
if (!projectRef) {
    console.error('❌ Error: Could not extract project ref from URL');
    process.exit(1);
}

// Build connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const password = supabaseKey; // Service role key acts as password for postgres user
const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

async function createTables() {
    console.log('🚀 Connecting to Supabase PostgreSQL...\n');
    console.log(`   Project: ${projectRef}`);
    console.log(`   Host: db.${projectRef}.supabase.co\n`);

    const client = postgres(connectionString, {
        max: 1,
        connect_timeout: 30,
    });

    try {
        // Test connection
        await client`SELECT 1`;
        console.log('✅ Connected to Supabase PostgreSQL\n');

        // Read and execute migration
        const migrationPath = path.join(__dirname, '../src/migrations/0000_shiny_captain_america.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📋 Executing migration...\n');

        // Execute the whole SQL
        await client.unsafe(migrationSql);

        console.log('✅ Tables created successfully!\n');

        // List created tables
        const tables = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `;

        console.log('📊 Tables in database:');
        tables.forEach((t: any) => console.log(`   • ${t.table_name}`));

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes('password authentication failed')) {
            console.error('\n💡 The service_role key might not work as database password.');
            console.error('   Get the database password from:');
            console.error('   Supabase Dashboard → Project Settings → Database → Connection string');
        }
    } finally {
        await client.end();
    }
}

createTables();
