/**
 * Database client setup
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Import all schemas
import * as quranSchema from './schema/quran';
import * as rcqiSchema from './schema/rcqi';
import * as usersSchema from './schema/users';
import * as researchSchema from './schema/research';

import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
export const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

// Create drizzle instance with all schemas
export const db = drizzle(client, {
    schema: {
        ...quranSchema,
        ...rcqiSchema,
        ...usersSchema,
        ...researchSchema,
    },
});

// Export schemas for use in queries
export const schema = {
    ...quranSchema,
    ...rcqiSchema,
    ...usersSchema,
    ...researchSchema,
};

// Export types
export type Database = typeof db;
