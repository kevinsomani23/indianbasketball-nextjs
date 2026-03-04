import { query, queryOne } from '@/lib/db';
import Link from 'next/link';

// Force dynamic rendering since we read from SQLite at runtime
export const dynamic = 'force-dynamic';

import RadarChartWidget from '@/components/RadarChartWidget';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const p = await queryOne('SELECT name FROM Players WHERE player_id = ?', [id]);
    return { title: p ? `${p.name} Stats | Indian Basketball` : 'Player Profile' };
}

export default async function PlayerProfile({ params }) {
    const { id } = await params;

    // 1. Player Info & Team
    const player = await queryOne(`
    SELECT p.player_id, p.name, p.position, p.height, p.age, t.name as team_name, t.id as team_id
    FROM Players p
    JOIN Teams t ON p.team_id = t.id
    WHERE p.player_id = ?
  `, [id]);

    if (!player) return <div>Player not found.</div>;

    // 2. Game Logs (Every single game they played)
    const gameLogs = await query(`
    SELECT b.pts, b.reb, b.ast, b.stl, b.blk, b.tov as tov, b.fgm, b.fga, b.tpm, b.tpa, b.ftm, b.fta, b.min, b.gm_scr,
           m.match_id, tour.name as tourney_name,
           t.name as opp_name,
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = b.match_id AND team_id = b.team_id) > 
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = b.match_id AND team_id != b.team_id) as won
    FROM Boxscores b
    JOIN Matches m ON b.match_id = m.match_id
    JOIN Tournaments tour ON m.tournament_id = tour.id
    JOIN Teams t ON m.home_team_id = t.id OR m.away_team_id = t.id
    WHERE b.player_id = ? AND t.id != b.team_id
    ORDER BY m.match_id DESC
  `, [id]);

    // 3. Totals over all matched
    const totals = gameLogs.reduce((acc, g) => {
        acc.gp += 1;
        acc.pts += g.pts;
        acc.reb += g.reb;
        acc.ast += g.ast;
        acc.stl += g.stl;
        acc.blk += g.blk;
        acc.tov += g.tov;
        acc.fgm += g.fgm;
        acc.fga += g.fga;
        acc.tpm += g.tpm;
        acc.tpa += g.tpa;
        acc.ftm += g.ftm;
        acc.fta += g.fta;
        acc.min += g.min;
        acc.gm_scr += g.gm_scr;
        acc.wins += g.won;
        return acc;
    }, {
        gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
        fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, min: 0, gm_scr: 0, wins: 0
    });

    // Safe percentage helper
    const pct = (m, a) => (a > 0 ? ((m / a) * 100).toFixed(1) : '-');
    const avg = (v, g) => (g > 0 ? (v / g).toFixed(1) : '-');

    // Advanced Math
    const fg_pct = pct(totals.fgm, totals.fga);
    const t_pct = pct(totals.tpm, totals.tpa);
    const ft_pct = pct(totals.ftm, totals.fta);
    const ts_att = (totals.fga + 0.44 * totals.fta);
    const ts_pct = ts_att > 0 ? ((totals.pts / (2 * ts_att)) * 100).toFixed(1) : '-';
    const efg_pct = totals.fga > 0 ? (((totals.fgm + 0.5 * totals.tpm) / totals.fga) * 100).toFixed(1) : '-';

    return (
        <div className="player-profile animate-fade-in">
            {/* HEADER CARD */}
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--tappa-orange)' }}>{player.name}</h1>
                    <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>
                        <Link href={`/teams/${player.team_id}`} className="team-link">{player.team_name}</Link>
                    </h3>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Position:</span> {player.position || 'N/A'}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Height:</span> {player.height || 'N/A'}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> {player.age || 'N/A'}</div>
                    </div>
                </div>

                {/* Quick Career Summary Stats inline */}
                <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PTS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{avg(totals.pts, totals.gp)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>REB</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{avg(totals.reb, totals.gp)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AST</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{avg(totals.ast, totals.gp)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GmScr</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{avg(totals.gm_scr, totals.gp)}</div>
                    </div>
                </div>

                {/* Radar Chart Overlay Component */}
                <div style={{ minWidth: '350px' }}>
                    <RadarChartWidget
                        stats={{
                            pts: avg(totals.pts, totals.gp),
                            ast: avg(totals.ast, totals.gp),
                            ts_pct: ts_pct,
                            stl: avg(totals.stl, totals.gp),
                            blk: avg(totals.blk, totals.gp),
                            reb: avg(totals.reb, totals.gp)
                        }}
                    />
                </div>
            </div>

            <h2>Per Game Averages</h2>
            <div className="data-table-container" style={{ marginBottom: '2rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Category</th>
                            <th>GP</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TOV</th>
                            <th>FG%</th>
                            <th>3P%</th>
                            <th>FT%</th>
                            <th>eFG%</th>
                            <th>TS%</th>
                            <th>GmScr</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="left-align" style={{ fontWeight: 700 }}>Career</td>
                            <td>{totals.gp}</td>
                            <td>{avg(totals.min, totals.gp)}</td>
                            <td className="leader">{avg(totals.pts, totals.gp)}</td>
                            <td>{avg(totals.reb, totals.gp)}</td>
                            <td>{avg(totals.ast, totals.gp)}</td>
                            <td>{avg(totals.stl, totals.gp)}</td>
                            <td>{avg(totals.blk, totals.gp)}</td>
                            <td>{avg(totals.tov, totals.gp)}</td>
                            <td>{fg_pct}</td>
                            <td>{t_pct}</td>
                            <td>{ft_pct}</td>
                            <td style={{ color: 'var(--tappa-orange)' }}>{efg_pct}</td>
                            <td style={{ color: 'var(--tappa-orange)' }}>{ts_pct}</td>
                            <td style={{ color: 'var(--success)' }}>{avg(totals.gm_scr, totals.gp)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Game Logs</h2>
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Opponent</th>
                            <th className="left-align">Tournament</th>
                            <th>W/L</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TOV</th>
                            <th>FGM-A</th>
                            <th>3PM-A</th>
                            <th>FTM-A</th>
                            <th>GmScr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gameLogs.map((g, i) => (
                            <tr key={i}>
                                <td className="left-align" style={{ fontWeight: 600 }}>@ {g.opp_name}</td>
                                <td className="left-align" style={{ color: 'var(--text-secondary)' }}>{g.tourney_name}</td>
                                <td style={{ color: g.won ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>{g.won ? 'W' : 'L'}</td>
                                <td>{g.min || '-'}</td>
                                <td className="leader">{g.pts}</td>
                                <td>{g.reb}</td>
                                <td>{g.ast}</td>
                                <td>{g.stl}</td>
                                <td>{g.blk}</td>
                                <td>{g.tov}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{g.fgm}-{g.fga}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{g.tpm}-{g.tpa}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{g.ftm}-{g.fta}</td>
                                <td style={{ color: 'white', fontWeight: 600 }}>{g.gm_scr?.toFixed(1) || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
