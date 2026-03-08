import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
        return NextResponse.json({ players: [], teams: [] });
    }

    try {
        const queryTerm = q.trim().split(/\s+/).map(word => `${word}*`).join(' ');
        
        // 1. Fetch raw matches from FTS index
        const indexResults = await query(`
            SELECT entity_id, entity_type, name, metadata
            FROM SearchIndex 
            WHERE SearchIndex MATCH ?
            ORDER BY rank
            LIMIT 20
        `, [queryTerm]);

        const players = [];
        const teams = [];
        const tournaments = [];
        const matches = [];

        // 2. Hydrate matches based on type
        for (const item of indexResults) {
            if (item.entity_type === 'player' && players.length < 5) {
                const p = await query(`
                    SELECT p.player_id as id, p.name, t.name as team_name, tour.gender
                    FROM Players p
                    JOIN Teams t ON p.team_id = t.id
                    JOIN Tournaments tour ON p.tournament_id = tour.id
                    WHERE p.player_id = ?
                `, [item.entity_id]);
                if (p[0]) players.push(p[0]);
            } else if (item.entity_type === 'team' && teams.length < 3) {
                const t = await query(`
                    SELECT t.id, t.name, tour.gender
                    FROM Teams t
                    JOIN Tournaments tour ON t.tournament_id = tour.id
                    WHERE t.id = ?
                `, [item.entity_id]);
                if (t[0]) teams.push(t[0]);
            } else if (item.entity_type === 'tournament' && tournaments.length < 2) {
                const tour = await query(`SELECT id, name FROM Tournaments WHERE id = ?`, [item.entity_id]);
                if (tour[0]) tournaments.push(tour[0]);
            } else if (item.entity_type === 'match' && matches.length < 3) {
                const m = await query(`
                    SELECT m.match_id as id, m.stage, m.match_date, tour.name as tourney_name, ta.name as team_a, tb.name as team_b
                    FROM Matches m
                    JOIN Tournaments tour ON m.tournament_id = tour.id
                    JOIN Teams ta ON m.home_team_id = ta.id
                    JOIN Teams tb ON m.away_team_id = tb.id
                    WHERE m.match_id = ?
                `, [item.entity_id]);
                if (m[0]) matches.push(m[0]);
            }
        }

        return NextResponse.json({ players, teams, tournaments, matches });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
