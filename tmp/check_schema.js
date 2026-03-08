const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('h:/VIBE CODE/ind basketball/data/processed/basketball.sqlite');

db.all("SELECT DISTINCT gender FROM Tournaments", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
