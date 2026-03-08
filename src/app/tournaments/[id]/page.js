import { query, queryOne } from '@/lib/db';
import { SQL_ACTIVE_PLAYERS } from '@/lib/queries';
import Link from 'next/link';
import TournamentBracket from '@/components/TournamentBracket';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const t = await queryOne('SELECT name FROM Tournaments WHERE id = ?', [id]);
    return { title: t ? `${t.name} | Indian Basketball` : 'Tournament Hub' };
}

export default async function TournamentHub({ params }) {
    const { id } = await params;

    // 1. Tournament Info
    const tourney = await queryOne('SELECT * FROM Tournaments WHERE id = ?', [id]);
    if (!tourney) return <div>Tournament not found.</div>;

    // 2. Team Standings - Grouped by Pool/Stage if applicable
    const rawStandings = await query(`
    SELECT t.id, t.name, m.stage,
    COUNT(DISTINCT CASE WHEN (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = t.id) > (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != t.id) THEN m.match_id END) as wins,
    COUNT(DISTINCT CASE WHEN (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = t.id) <= (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != t.id) THEN m.match_id END) as losses,
    COUNT(DISTINCT m.match_id) as gp,
    (SELECT SUM(pts) FROM Boxscores WHERE tournament_id = ? AND team_id = t.id) as pts_scored,
    -- Get last 5 matches for form
    GROUP_CONCAT(
        CASE WHEN (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = t.id) > (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != t.id) THEN 'W' ELSE 'L' END,
        ','
    ) as form_string
    FROM Teams t
    JOIN Matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
    WHERE m.tournament_id = ?
    GROUP BY t.id, m.stage
    ORDER BY m.stage ASC, wins DESC, pts_scored DESC
    `, [id, id]);

    // Grouping logic for Pools
    const poolStandings = {};
    rawStandings.forEach(s => {
        const stage = s.stage || 'General';
        if (!poolStandings[stage]) poolStandings[stage] = [];
        poolStandings[stage].push(s);
    });

    // 3. Tournament Leaders (Points)
    const scoringLeaders = await query(`
    SELECT p.player_id, p.name, t.name as team_name, SUM(b.pts) as total_pts, COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END) as gp, (SUM(b.pts) * 1.0 / NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END), 0)) as ppg
    FROM Boxscores b
    JOIN Players p ON b.player_id = p.player_id
    JOIN Matches m ON b.match_id = m.match_id
    JOIN Teams t ON b.team_id = t.id
    WHERE m.tournament_id = ?
    GROUP BY p.player_id
    HAVING gp > 0
    ORDER BY ppg DESC
    LIMIT 5
    `, [id]);

    const FormDot = ({ result }) => (
        <span style={{ 
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
            marginRight: '3px',
            background: result === 'W' ? 'var(--success)' : 'var(--warning)',
            opacity: 0.8
        }} title={result}></span>
    );

    return (
        <div className="tournament-hub animate-fade-in">
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <div className="flex-row gap-md" style={{ marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--tappa-orange)' }}>{tourney.name}</h1>
                </div>
                <p style={{ color: 'var(--text-muted)' }}>Senior National Basketball Championship — Standings & Leaders</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>
                {/* Left Column: Standings */}
                <div>
                    {Object.entries(poolStandings).map(([stageName, teams]) => (
                        <div key={stageName} style={{ marginBottom: '2.5rem' }}>
                            <h2 className="flex-row text-xs-caps" style={{ letterSpacing: '0.1em', fontWeight: 800, marginBottom: '1rem', gap: '10px' }}>
                                <span style={{ display: 'inline-block', width: '20px', height: '1px', background: 'var(--tappa-orange)' }}></span>
                                {stageName}
                            </h2>
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="left-align" style={{ width: '40px' }}>#</th>
                                            <th className="left-align">Team</th>
                                            <th>GP</th>
                                            <th>W-L</th>
                                            <th>PTS</th>
                                            <th className="left-align">Form</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map((team, idx) => (
                                            <tr key={`${team.id}-${stageName}`}>
                                                <td className="left-align" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                                                <td className="left-align">
                                                    <Link href={`/teams/${team.id}`} style={{ fontWeight: 600, color: 'white' }}>{team.name}</Link>
                                                </td>
                                                <td style={{ color: 'rgba(255,255,255,0.4)' }}>{team.gp}</td>
                                                <td style={{ fontWeight: 700 }}>
                                                    <span style={{ color: 'var(--success)' }}>{team.wins}</span>-<span style={{ color: 'var(--warning)' }}>{team.losses}</span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>{team.pts_scored}</td>
                                                <td className="left-align">
                                                    {(team.form_string || '').split(',').slice(0, 5).map((r, i) => (
                                                        <FormDot key={i} result={r} />
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column: Leaders */}
                <div>
                    <h2 className="section-title">Scoring Leaders (PPG)</h2>
                    <div className="glass-card" style={{ padding: '1rem' }}>
                        {scoringLeaders.map((p, i) => (
                            <div key={p.player_id} className="flex-between" style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</div>
                                    <Link href={`/players/${p.player_id}`} style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.name}</Link>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.team_name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--tappa-orange)', fontWeight: 800, fontSize: '1.5rem', fontFamily: 'Outfit' }}>{p.ppg.toFixed(1)}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.total_pts} PTS | {p.gp} GP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Brackets Section */}
            <div style={{ marginTop: '3rem' }}>
                <h2 className="section-title">Championship Bracket</h2>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <TournamentBracket gender={tourney.gender} />
                </div>
            </div>
        </div>
    );
}
