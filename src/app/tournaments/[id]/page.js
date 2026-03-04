import { query, queryOne } from '@/lib/db';
import Link from 'next/link';

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

    // 2. Participating Teams & Standings
    // We approximate standings by aggregating team wins in this tournament
    const teamStandings = await query(`
    SELECT t.id, t.name,
    SUM(CASE WHEN (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = t.id) > (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != t.id) THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = t.id) <= (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != t.id) THEN 1 ELSE 0 END) as losses,
    SUM(b.pts) as pts_scored
    FROM Teams t
    JOIN Boxscores b ON t.id = b.team_id
    JOIN Matches m ON b.match_id = m.match_id
    WHERE m.tournament_id = ?
    GROUP BY t.id
    ORDER BY wins DESC, pts_scored DESC
    `, [id]);

    // 3. Tournament Leaders (Points)
    const scoringLeaders = await query(`
    SELECT p.player_id, p.name, t.name as team_name, SUM(b.pts) as total_pts, COUNT(b.match_id) as gp, (SUM(b.pts) * 1.0 / COUNT(b.match_id)) as ppg
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

    return (
        <div className="tournament-hub animate-fade-in">
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--tappa-orange)' }}>{tourney.name}</h1>
                <p style={{ color: 'var(--text-muted)' }}>Senior National Basketball Championship</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Left Column: Standings */}
                <div>
                    <h2 className="section-title">Participating Teams & Records</h2>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="left-align">Team</th>
                                    <th>W</th>
                                    <th>L</th>
                                    <th>Total PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamStandings.map((team, idx) => (
                                    <tr key={team.id}>
                                        <td className="left-align">
                                            <span style={{ color: 'var(--text-muted)', marginRight: '10px' }}>{idx + 1}.</span>
                                            <Link href={`/ teams / ${team.id} `}><strong>{team.name}</strong></Link>
                                        </td>
                                        <td style={{ color: 'var(--success)' }}>{team.wins / 12}</td> {/* Divided by 12 rosters approx to get Team Wins instead of Player Wins */}
                                        <td style={{ color: 'var(--warning)' }}>{team.losses / 12}</td>
                                        <td>{team.pts_scored}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Leaders */}
                <div>
                    <h2 className="section-title">Scoring Leaders (PPG)</h2>
                    <div className="glass-card" style={{ padding: '1rem' }}>
                        {scoringLeaders.map((p, i) => (
                            <div key={p.player_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</div>
                                    <Link href={`/ players / ${p.player_id} `} style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.name}</Link>
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
        </div>
    );
}
