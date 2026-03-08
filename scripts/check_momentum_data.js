const sqlite3 = require('sqlite3').verbose();
const dbPath = 'H:/VIBE CODE/ind basketball/data/processed_adv/basketball_v3_adv.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('Checking TeamPeriodStats:');
db.all("PRAGMA table_info(TeamPeriodStats)", (err, columns) => {
    if (columns) {
        console.log('Columns:', columns.map(c => c.name).join(', '));
        db.all("SELECT * FROM TeamPeriodStats LIMIT 10", (err, rows) => {
            console.log('Sample Data:', JSON.stringify(rows, null, 2));
            db.close();
        });
    } else {
        console.log('Table TeamPeriodStats does not exist.');
        db.close();
    }
});
