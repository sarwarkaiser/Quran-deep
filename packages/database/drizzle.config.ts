import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    schema: './src/schema/*.ts',
    out: './src/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
