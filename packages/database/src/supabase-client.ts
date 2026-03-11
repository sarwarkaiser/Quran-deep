/**
 * Supabase Database Client
 * 
 * This module provides database access using Supabase (managed PostgreSQL)
 * with Drizzle ORM for type-safe queries.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Import all schemas
import * as quranSchema from './schema/quran';
import * as rcqiSchema from './schema/rcqi';
import * as usersSchema from './schema/users';
import * as researchSchema from './schema/research';

dotenv.config({ path: '../../.env' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Direct PostgreSQL connection string (for Drizzle ORM)
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey) {
    console.warn('SUPABASE_URL or SUPABASE_ANON_KEY not set. Using fallback DATABASE_URL.');
}

// Create Supabase client for auth and real-time features
export const supabase: SupabaseClient = createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseServiceKey || supabaseKey || 'dummy-key'
);

// Create postgres client for Drizzle ORM
export const client = databaseUrl
    ? postgres(databaseUrl, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    })
    : null;

// Create drizzle instance with all schemas
export const db = client
    ? drizzle(client, {
        schema: {
            ...quranSchema,
            ...rcqiSchema,
            ...usersSchema,
            ...researchSchema,
        },
    })
    : null;

// Export schemas for use in queries
export const schema = {
    ...quranSchema,
    ...rcqiSchema,
    ...usersSchema,
    ...researchSchema,
};

// Export types
export type Database = typeof db;

/**
 * Helper function to check database connection
 */
export async function checkConnection(): Promise<boolean> {
    try {
        if (!client) {
            console.error('No database client available');
            return false;
        }
        await client`SELECT 1`;
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

/**
 * Helper function to close database connection
 */
export async function closeConnection(): Promise<void> {
    if (client) {
        await client.end();
        console.log('Database connection closed');
    }
}
