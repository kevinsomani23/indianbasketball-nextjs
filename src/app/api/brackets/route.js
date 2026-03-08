import { getDb } from '@/lib/db';
import { TOURNAMENT_BRACKETS } from '@/lib/brackets';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender');

    const bracketConfig = TOURNAMENT_BRACKETS[gender];
    if (!bracketConfig) {
        return Response.json({ error: 'Bracket configuration not found for this gender' }, { status: 404 });
    }

    try {
        const db = await getDb();
        
        // Helper function to fetch full match details for an array of IDs
        const fetchMatchesForStage = async (matchIds) => {
            if (!matchIds || matchIds.length === 0) return [];
            
            const placeholders = matchIds.map(() => '?').join(',');
            const query = `
                SELECT 
                    m.match_id, 
                    t1.name as home_team, 
                    t2.name as away_team, 
                    m.home_score, 
                    m.away_score
                FROM Matches m
                JOIN Teams t1 ON m.home_team_id = t1.id
                JOIN Teams t2 ON m.away_team_id = t2.id
                WHERE m.match_id IN (${placeholders})
            `;
            const matches = await db.all(query, matchIds);
            
            // Re-sort matches to mirror the exact requested order from config
            return matchIds.map(id => matches.find(m => m.match_id == id) || null);
        };

        const quarterFinals = await fetchMatchesForStage(bracketConfig.quarterFinals);
        const semiFinals = await fetchMatchesForStage(bracketConfig.semiFinals);
        const finals = await fetchMatchesForStage(bracketConfig.finals);

        return Response.json({ quarterFinals, semiFinals, finals });
    } catch (error) {
        console.error("Error fetching bracket data:", error);
        return Response.json({ error: 'Internal server error fetching bracket data' }, { status: 500 });
    }
}
