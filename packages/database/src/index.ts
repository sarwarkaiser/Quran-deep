/**
 * Database Package - RCQI Platform
 * 
 * Supports both local PostgreSQL and Supabase (managed PostgreSQL)
 */

// Original client (backward compatibility)
export { db, schema } from './client';
export type { Database } from './client';

// Supabase client (new)
export {
    supabase,
    db as supabaseDb,
    schema as supabaseSchema,
    checkConnection,
    closeConnection,
} from './supabase-client';
export type { Database as SupabaseDatabase } from './supabase-client';

// Export all schema tables
export * from './schema/quran';
export * from './schema/rcqi';
export * from './schema/users';
export * from './schema/research';
