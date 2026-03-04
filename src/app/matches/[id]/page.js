import { query, queryOne } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    return { title: `Match ${id} Boxscore | Indian Basketball` };
}

export default async function MatchBoxscore({ params }) {
    const { id } = await params;

    // 1. Get Match Context
    const match = await queryOne(`
    SELECT m.match_id, tour.name as tourney_name, tour.id as tourney_id,
           ta.id as team_a_id, ta.name as team_a_name,
           tb.id as team_b_id, tb.name as team_b_name
    FROM Matches m
    JOIN Tournaments tour ON m.tournament_id = tour.id
    JOIN Teams ta ON m.home_team_id = ta.id
    JOIN Teams tb ON m.away_team_id = tb.id
    WHERE m.match_id = ?
  `, [id]);

    if (!match) return <div>Match not found.</div>;

    // Helper to fetch boxscores for a specific team in this match
    const getBoxscores = async (teamId) => {
        return await query(`
      SELECT b.*, p.name, p.position 
      FROM Boxscores b
      JOIN Players p ON b.player_id = p.player_id
      WHERE b.match_id = ? AND b.team_id = ?
      ORDER BY b.min DESC, b.pts DESC
    `, [id, teamId]);
    };

    const teamABox = await getBoxscores(match.team_a_id);
    const teamBBox = await getBoxscores(match.team_b_id);

    // Validate Score
    const teamAScore = teamABox.reduce((sum, b) => sum + b.pts, 0);
    const teamBScore = teamBBox.reduce((sum, b) => sum + b.pts, 0);

    // Reusable Boxscore Table Component
    const renderBoxscoreTable = (teamName, teamId, boxscores, totalScore) => (
        <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>
                    <Link href={`/teams/${teamId}`} className="team-link">{teamName}</Link>
                </h2>
                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--tappa-orange)' }}>
                    {totalScore}
                </div>
            </div>
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align" style={{ width: '20%' }}>Player</th>
                            <th>Pos</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TOV</th>
                            <th>FGM</th>
                            <th>FGA</th>
                            <th>3PM</th>
                            <th>3PA</th>
                            <th>FTM</th>
                            <th>FTA</th>
                            <th>GmScr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {boxscores.map(b => (
                            <tr key={b.player_id}>
                                <td className="left-align">
                                    <Link href={`/players/${b.player_id}`}><strong>{b.name}</strong></Link>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{b.position || '-'}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{b.min || '-'}</td>
                                <td className="leader">{b.pts}</td>
                                <td>{b.reb}</td>
                                <td>{b.ast}</td>
                                <td>{b.stl}</td>
                                <td>{b.blk}</td>
                                <td>{b.tov}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.fgm}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.fga}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.tpm}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.tpa}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.ftm}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.fta}</td>
                                <td style={{ fontWeight: 700, color: 'white' }}>{b.gm_scr?.toFixed(1) || '-'}</td>
                            </tr>
                        ))}
                        {/* Totals Row */}
                        <tr style={{ background: 'rgba(255,133,51,0.1)', borderTop: '2px solid var(--tappa-orange)' }}>
                            <td className="left-align" style={{ fontWeight: 800, color: 'var(--tappa-orange)' }}>TEAM TOTALS</td>
                            <td></td>
                            <td>200</td>
                            <td className="leader">{totalScore}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.reb, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.ast, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.stl, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.blk, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.tov, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.fgm, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.fga, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.tpm, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.tpa, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.ftm, 0)}</td>
                            <td style={{ fontWeight: 700 }}>{boxscores.reduce((s, b) => s + b.fta, 0)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="match-dashboard animate-slide-in">
            <div className="glass-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', margin: '0 0 10px 0' }}>
                    <Link href={`/tournaments/${match.tourney_id}`}>{match.tourney_name}</Link>
                </p>
                <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>
                    {match.team_a_name} <span style={{ color: 'var(--text-muted)', fontSize: '1.5rem', margin: '0 1rem' }}>vs</span> {match.team_b_name}
                </h1>
            </div>

            {renderBoxscoreTable(match.team_a_name, match.team_a_id, teamABox, teamAScore)}
            {renderBoxscoreTable(match.team_b_name, match.team_b_id, teamBBox, teamBScore)}

        </div>
    );
}
