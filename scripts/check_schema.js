const sqlite3 = require('sqlite3').verbose();
const dbPath = 'H:/VIBE CODE/ind basketball/data/processed_adv/basketball_v3_adv.sqlite';
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Tables:', rows.map(r => r.name).join(', '));
    
    // Check for a plays or events table
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='PeriodBoxscores'", (err, row) => {
        if (row) {
            console.log('\nPeriodBoxscores Columns:');
            db.all("PRAGMA table_info(PeriodBoxscores)", (err, columns) => {
                console.log(columns.map(c => c.name).join(', '));
                db.close();
            });
        } else {
            console.log('\nNo PeriodBoxscores table found.');
            db.close();
        }
    });
});
