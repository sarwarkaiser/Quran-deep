import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from './client';

import path from 'path';

async function main() {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
    console.log('Migrations complete!');
    await client.end();
}

main().catch((err) => {
    console.error('Migration failed!');
    console.error(err);
    process.exit(1);
});
