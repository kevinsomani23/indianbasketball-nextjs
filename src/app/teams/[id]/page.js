import { query, queryOne } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const t = await queryOne('SELECT name FROM Teams WHERE id = ?', [id]);
    return { title: t ? `${t.name} Team Profile | Indian Basketball` : 'Team Profile' };
}

export default async function TeamProfile({ params }) {
    const { id } = await params;

    const team = await queryOne('SELECT * FROM Teams WHERE id = ?', [id]);
    if (!team) return <div>Team not found.</div>;

    // 1. Current Roster 
    // (We define current roster as any player who maps `team_id` to this team in the Players table)
    const roster = await query(`
    SELECT p.player_id, p.name, p.position, p.height, p.age,
           COUNT(b.match_id) as gp, 
           SUM(b.pts) as total_pts,
           (SUM(b.pts)*1.0/NULLIF(COUNT(b.match_id), 0)) as ppg
    FROM Players p
    LEFT JOIN Boxscores b ON p.player_id = b.player_id AND b.team_id = p.team_id
    WHERE p.team_id = ?
    GROUP BY p.player_id
    ORDER BY ppg DESC
  `, [id]);

    // 2. Cumulative Boxscore Logs
    const matchLogs = await query(`
    SELECT m.match_id, tour.name as tourney_name, 
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = ?) > 
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != ?) as won,
           SUM(b.pts) as team_pts, SUM(b.reb) as team_reb, SUM(b.ast) as team_ast,
           SUM(b.turnovers) as team_tov
    FROM Matches m
    JOIN Tournaments tour ON m.tournament_id = tour.id
    JOIN Boxscores b ON m.match_id = b.match_id AND b.team_id = ?
    GROUP BY m.match_id
    ORDER BY m.match_id DESC
  `, [id, id, id]);

    return (
        <div className="team-profile animate-slide-in">
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', margin: 0, color: 'white' }}>{team.name}</h1>
                <p style={{ color: 'var(--text-muted)' }}>Registered Roster & Historical Data</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left Column: ROSTER */}
                <div>
                    <h2 className="section-title">Team Roster (PPG Leaders)</h2>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="left-align">Player Name</th>
                                    <th>Pos</th>
                                    <th>Height</th>
                                    <th>Age</th>
                                    <th>Games Played</th>
                                    <th>PPG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roster.map((p) => (
                                    <tr key={p.player_id}>
                                        <td className="left-align">
                                            <Link href={`/players/${p.player_id}`} style={{ fontWeight: 700, color: 'white' }}>
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.position || '-'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.height || '-'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{p.age || '-'}</td>
                                        <td>{p.gp}</td>
                                        <td style={{ color: 'var(--tappa-orange)', fontWeight: 800 }}>{Number(p.ppg).toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: TEAM GAME LOGS */}
                <div>
                    <h2 className="section-title">Recent Matches</h2>
                    <div className="glass-card" style={{ padding: '0 1rem' }}>
                        {matchLogs.map((m) => (
                            <div key={m.match_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                                <div>
                                    <div style={{ color: m.won ? 'var(--success)' : 'var(--warning)', fontWeight: 800, fontSize: '1.2rem' }}>{m.won ? 'W' : 'L'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.tourney_name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 900, fontSize: '1.4rem' }}>{m.team_pts} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>PTS</span></div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.team_reb} REB | {m.team_ast} AST</div>
                                </div>
                            </div>
                        ))}
                        {matchLogs.length === 0 && <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent match data available.</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}
