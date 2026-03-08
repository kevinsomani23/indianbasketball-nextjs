import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { cache } from 'react';

let db = null; 

const DB_PATH = 'h:/VIBE CODE/ind basketball/data/processed_adv/basketball_v3_adv.sqlite';

export async function getDb() {
    if (db) return db;

    try {
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        // Enable WAL mode and tune performance
        await db.exec('PRAGMA journal_mode = WAL;');
        await db.exec('PRAGMA synchronous = NORMAL;');
        await db.exec('PRAGMA cache_size = -10000;'); // ~10MB cache
        await db.exec('PRAGMA journal_size_limit = 67108864;'); // 64MB
        
        console.log(`Connected to the SQLite database at ${DB_PATH} (WAL Enabled).`);
        return db;
    } catch (err) {
        console.error(`Error connecting to SQLite database: ${err.message}`);
        throw err;
    }
}

/**
 * Utility function to query data asynchronously.
 * Wrapped in React cache() to deduplicate queries within a single request.
 */
export const query = cache(async (sql, params = []) => {
    const connection = await getDb();
    // Use JSON stringify for params to ensure caching works correctly for arrays
    return connection.all(sql, params);
});

/**
 * Utility function for retrieving a single row.
 * Wrapped in React cache() to deduplicate queries within a single request.
 */
export const queryOne = cache(async (sql, params = []) => {
    const connection = await getDb();
    return connection.get(sql, params);
});
