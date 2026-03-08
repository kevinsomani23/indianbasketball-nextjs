import { getDb } from './src/lib/db.js';

async function checkSchema() {
    const db = await getDb();
    const row = await db.get('SELECT * FROM Boxscores LIMIT 1');
    console.log(Object.keys(row));
    process.exit(0);
}

checkSchema();
