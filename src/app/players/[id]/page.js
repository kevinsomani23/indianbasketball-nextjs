import { query, queryOne } from '@/lib/db';
import { SQL_ACTIVE_PLAYERS } from '@/lib/queries';
import Link from 'next/link';
import { calculatePct, calculateTSA, calculateTSPct, calculateEFGPct, calculateATR, formatTime } from '@/lib/stats-utils';
import { PlayerRadar, PlayerTrend } from '@/components/PlayerCharts';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const p = await queryOne('SELECT name FROM Players WHERE player_id = ?', [id]);
    return { title: p ? `${p.name} Stats | Indian Basketball` : 'Player Profile' };
}

export default async function PlayerProfile({ params }) {
    const { id } = await params;

    // 1. Player Info & Team
    const player = await queryOne(`
    SELECT p.player_id, p.name, t.name as team_name, t.id as team_id, tour.gender
    FROM Players p
    JOIN Teams t ON p.team_id = t.id
    JOIN Tournaments tour ON p.tournament_id = tour.id
    WHERE p.player_id = ?
  `, [id]);

    if (!player) return <div>Player not found.</div>;

    // 2. Game Logs
    const gameLogs = await query(`
    SELECT b.pts, b.reb, b.ast, b.stl, b.blk, b.tov as tov, b.fgm, b.fga, b.tpm, b.tpa, b.ftm, b.fta, b.mins_dec as min, b.gm_scr,
           m.match_id, m.match_date, m.stage, tour.name as tourney_name,
           t.name as opp_name,
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = b.match_id AND team_id = b.team_id) > 
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = b.match_id AND team_id != b.team_id) as won
    FROM Boxscores b
    JOIN Matches m ON b.match_id = m.match_id
    JOIN Tournaments tour ON m.tournament_id = tour.id
    JOIN Teams t ON m.home_team_id = t.id OR m.away_team_id = t.id
    WHERE b.player_id = ? AND t.id != b.team_id AND b.${SQL_ACTIVE_PLAYERS}
    ORDER BY m.match_id DESC
  `, [id]);



    // 3. Totals over all matches
    const initialTotals = {
        gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
        fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, min: 0, gm_scr: 0, wins: 0
    };

    const totals = gameLogs.reduce((acc, g) => {
        acc.gp += 1;
        acc.pts += (g.pts || 0);
        acc.reb += (g.reb || 0);
        acc.ast += (g.ast || 0);
        acc.stl += (g.stl || 0);
        acc.blk += (g.blk || 0);
        acc.tov += (g.tov || 0);
        acc.fgm += (g.fgm || 0);
        acc.fga += (g.fga || 0);
        acc.tpm += (g.tpm || 0);
        acc.tpa += (g.tpa || 0);
        acc.ftm += (g.ftm || 0);
        acc.fta += (g.fta || 0);
        acc.min += (g.min || 0);
        acc.gm_scr += (g.gm_scr || 0);
        acc.wins += (g.won ? 1 : 0);
        return acc;
    }, initialTotals);
 
     // 4. Per-Tournament Splits
     const tourneySplits = gameLogs.reduce((acc, g) => {
         const t = g.tourney_name;
         if (!acc[t]) {
             acc[t] = { 
                 name: t, gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
                 fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, min: 0, gm_scr: 0 
             };
         }
         acc[t].gp += 1;
         acc[t].pts += (g.pts || 0);
         acc[t].reb += (g.reb || 0);
         acc[t].ast += (g.ast || 0);
         acc[t].stl += (g.stl || 0);
         acc[t].blk += (g.blk || 0);
         acc[t].tov += (g.tov || 0);
         acc[t].fgm += (g.fgm || 0);
         acc[t].fga += (g.fga || 0);
         acc[t].tpm += (g.tpm || 0);
         acc[t].tpa += (g.tpa || 0);
         acc[t].ftm += (g.ftm || 0);
         acc[t].fta += (g.fta || 0);
         acc[t].min += (g.min || 0);
         acc[t].gm_scr += (g.gm_scr || 0);
         return acc;
     }, {});
     const tourneySplitsArray = Object.values(tourneySplits).sort((a,b) => b.name.localeCompare(a.name));


    // Safe percentage helper
    // Safe helpers
    const pct = (m, a) => calculatePct(m, a).toFixed(1);
    const avg = (v, g) => g > 0 ? (v / g).toFixed(1) : '-';

    // Advanced Math using shared utils
    const fg_pct = pct(totals.fgm, totals.fga);
    const t_pct = pct(totals.tpm, totals.tpa);
    const ft_pct = pct(totals.ftm, totals.fta);
    const tsa = calculateTSA(totals.fga, totals.fta);
    const ts_pct = calculateTSPct(totals.pts, tsa).toFixed(1);
    const efg_pct = calculateEFGPct(totals.fgm, totals.tpm, totals.fga).toFixed(1);

    const gender = player.gender === 'Women' ? "Women's" : "Men's";

    return (
        <div className="player-profile animate-fade-in">
            {/* HEADER CARD */}
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexDirection: 'row', flexWrap: 'wrap' }}>

                {/* Image & Social Actions */}
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '100%', aspectRatio: '4/5', background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--border-glass)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        + Add Photo
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ flex: 1, padding: '10px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>✓ Claim Page</button>
                        <a href="#" style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>𝕏</a>
                        <a href="#" style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>IG</a>
                    </div>
                </div>

                {/* Player Metadata & Quick Stats */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '300px' }}>
                    <h1 style={{ fontSize: '3.5rem', margin: 0, color: 'var(--tappa-orange)', lineHeight: '1.1' }}>{player.name}</h1>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>
                        <Link href={`/teams/${player.team_id}`} className="team-link">{player.team_name}</Link>
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <strong style={{ color: 'white' }}>{gender}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Position:</span> N/A</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Height:</span> N/A</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> N/A</div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PTS</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{avg(totals.pts, totals.gp)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>REB</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{avg(totals.reb, totals.gp)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AST</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{avg(totals.ast, totals.gp)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GmScr</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>{avg(totals.gm_scr, totals.gp)}</div>
                        </div>
                    </div>
                </div>

                {/* Radar Chart */}
                <PlayerRadar
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

            {/* STAT TREND CHART */}
            {gameLogs.length > 0 && (
                <PlayerTrend 
                    data={[...gameLogs]
                        .slice(0, 10)
                        .reverse()
                        .map(g => ({
                            opponent: g.opp_name,
                            pts: g.pts,
                            reb: g.reb,
                            ast: g.ast,
                            gm_scr: g.gm_scr
                        }))
                    } 
                />
            )}

            <h2>Career Totals</h2>
            <div className="data-table-container" style={{ marginBottom: '2rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Category</th>
                            <th>GP</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>FGM</th>
                            <th>FGA</th>
                            <th>FG%</th>
                            <th>3PM</th>
                            <th>3PA</th>
                            <th>3P%</th>
                            <th>FTM</th>
                            <th>FTA</th>
                            <th>FT%</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TOV</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="left-align" style={{ fontWeight: 700 }}>Totals</td>
                            <td>{totals.gp}</td>
                            <td>{Math.round(totals.min)}</td>
                            <td className="leader">{totals.pts}</td>
                            <td>{totals.fgm}</td>
                            <td>{totals.fga}</td>
                            <td style={{ fontWeight: 600 }}>{fg_pct}</td>
                            <td>{totals.tpm}</td>
                            <td>{totals.tpa}</td>
                            <td style={{ fontWeight: 600 }}>{t_pct}</td>
                            <td>{totals.ftm}</td>
                            <td>{totals.fta}</td>
                            <td style={{ fontWeight: 600 }}>{ft_pct}</td>
                            <td>{totals.reb}</td>
                            <td>{totals.ast}</td>
                            <td>{totals.stl}</td>
                            <td>{totals.blk}</td>
                            <td>{totals.tov}</td>
                        </tr>
                    </tbody>
                </table>
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
                            <td>{formatTime(totals.min, totals.gp)}</td>
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

            <h2>Tournament Splits</h2>
            <div className="data-table-container" style={{ marginBottom: '2rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Tournament</th>
                            <th>GP</th>
                            <th>PPG</th>
                            <th>RPG</th>
                            <th>APG</th>
                            <th>SPG</th>
                            <th>BPG</th>
                            <th>FG%</th>
                            <th>3P%</th>
                            <th>FT%</th>
                            <th>GmScr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tourneySplitsArray.map(t => (
                            <tr key={t.name}>
                                <td className="left-align" style={{ fontWeight: 700 }}>{t.name}</td>
                                <td>{t.gp}</td>
                                <td className="leader">{avg(t.pts, t.gp)}</td>
                                <td>{avg(t.reb, t.gp)}</td>
                                <td>{avg(t.ast, t.gp)}</td>
                                <td>{avg(t.stl, t.gp)}</td>
                                <td>{avg(t.blk, t.gp)}</td>
                                <td>{pct(t.fgm, t.fga)}</td>
                                <td>{pct(t.tpm, t.tpa)}</td>
                                <td>{pct(t.ftm, t.fta)}</td>
                                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{avg(t.gm_scr, t.gp)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Game Log</h2>
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Date</th>
                            <th className="left-align">Tournament</th>
                            <th className="left-align">Stage</th>
                            <th className="left-align">Opponent</th>
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
                        {gameLogs.map((g, i) => {
                            const dateParts = g.match_date ? String(g.match_date).split('-') : null;
                            const dateStr = dateParts && dateParts.length === 3
                                ? new Date(Number(dateParts[0]), Number(dateParts[1])-1, Number(dateParts[2])).toLocaleDateString('en-IN', {day:'numeric',month:'short'})
                                : (g.match_date || '-');
                            return (
                            <tr key={i}>
                                <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{dateStr}</td>
                                <td className="left-align" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{g.tourney_name}</td>
                                <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{g.stage || '-'}</td>
                                <td className="left-align" style={{ fontWeight: 600 }}>
                                    <Link href={`/matches/${g.match_id}`} style={{ color: 'white', textDecoration: 'none' }}>@ {g.opp_name} →</Link>
                                </td>
                                <td style={{ color: g.won ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>{g.won ? 'W' : 'L'}</td>
                                <td>{formatTime(g.min, 1)}</td>
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
