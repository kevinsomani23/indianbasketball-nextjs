import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

// The database path is absolute based on the environment
// Next.js runs from the h:\VIBE CODE\ind basketball\web directory
const DB_PATH = 'h:/VIBE CODE/ind basketball/data/processed/indian_basketball_unified.sqlite';

export async function getDb() {
    if (db) {
        return db;
    }

    try {
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });
        console.log(`Connected to the SQLite database at ${DB_PATH}.`);
        return db;
    } catch (err) {
        console.error(`Error connecting to SQLite database: ${err.message}`);
        throw err;
    }
}

/**
 * Utility function to query data asynchronously
 */
export async function query(sql, params = []) {
    const connection = await getDb();
    return connection.all(sql, params);
}

/**
 * Utility function for retrieving a single row
 */
export async function queryOne(sql, params = []) {
    const connection = await getDb();
    return connection.get(sql, params);
}
