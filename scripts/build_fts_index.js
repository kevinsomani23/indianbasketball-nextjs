const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the advanced database as our source/target
const dbPath = 'h:/VIBE CODE/ind basketball/data/processed_adv/basketball_v3_adv.sqlite';
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Building FTS5 search index...');

    // 1. Create the virtual table
    db.run(`DROP TABLE IF EXISTS SearchIndex`);
    db.run(`CREATE VIRTUAL TABLE SearchIndex USING fts5(
        entity_id,
        entity_type,
        name,
        metadata
    )`);

    // 2. Index Players (Join with teams and tournaments for context)
    console.log('Indexing players...');
    db.run(`
        INSERT INTO SearchIndex(entity_id, entity_type, name, metadata)
        SELECT DISTINCT p.player_id, 'player', p.name, t.name || ' ' || COALESCE(p.jersey, '') || ' ' || tr.name
        FROM Players p
        LEFT JOIN Teams t ON p.team_id = t.id
        LEFT JOIN Tournaments tr ON p.tournament_id = tr.id
    `);

    // 3. Index Teams (Join with tournaments to get gender context)
    console.log('Indexing teams...');
    db.run(`
        INSERT INTO SearchIndex(entity_id, entity_type, name, metadata)
        SELECT DISTINCT t.id, 'team', t.name, tr.gender || ' ' || tr.name
        FROM Teams t
        LEFT JOIN Tournaments tr ON t.tournament_id = tr.id
    `);

    // 4. Index Tournaments
    console.log('Indexing tournaments...');
    db.run(`
        INSERT INTO SearchIndex(entity_id, entity_type, name, metadata)
        SELECT id, 'tournament', name, gender
        FROM Tournaments
    `);

    // 5. Index Matches
    console.log('Indexing matches...');
    db.run(`
        INSERT INTO SearchIndex(entity_id, entity_type, name, metadata)
        SELECT 
            m.match_id, 
            'match', 
            ta.name || ' vs ' || tb.name, 
            COALESCE(m.stage, '') || ' ' || tr.name
        FROM Matches m
        JOIN Teams ta ON m.home_team_id = ta.id
        JOIN Teams tb ON m.away_team_id = tb.id
        JOIN Tournaments tr ON m.tournament_id = tr.id
    `);

    console.log('FTS5 Index built successfully.');
});

db.close();
