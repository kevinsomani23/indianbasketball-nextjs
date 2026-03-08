import { query, queryOne } from '@/lib/db';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Team Comparison | Indian Basketball',
};

async function getTeamStats(id) {
    if (!id) return null;
    const team = await queryOne('SELECT * FROM Teams WHERE id = ?', [id]);
    if (!team) return null;

    // Aggregate Boxscore Data for the Team
    // We sum up the individual player boxscores for every match this team played
    const logs = await query(`
        SELECT m.match_id, 
               SUM(b.pts) as pts, SUM(b.reb) as reb, SUM(b.ast) as ast, 
               SUM(b.stl) as stl, SUM(b.blk) as blk, SUM(b.tov) as tov,
               SUM(b.fgm) as fgm, SUM(b.fga) as fga,
               SUM(b.tpm) as tpm, SUM(b.tpa) as tpa,
               SUM(b.ftm) as ftm, SUM(b.fta) as fta,
               (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = ?) > 
               (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id != ?) as won
        FROM Matches m
        JOIN Boxscores b ON m.match_id = b.match_id AND b.team_id = ?
        GROUP BY m.match_id
    `, [id, id, id]);

    const gp = logs.length;
    const wins = logs.filter(l => l.won).length;
    const losses = gp - wins;

    if (gp === 0) return { id, ...team, stats: null };

    const totals = logs.reduce((acc, g) => {
        acc.pts += g.pts; acc.reb += g.reb; acc.ast += g.ast; acc.stl += g.stl; acc.blk += g.blk; acc.tov += g.tov;
        acc.fgm += g.fgm; acc.fga += g.fga; acc.tpm += g.tpm; acc.tpa += g.tpa; acc.ftm += g.ftm; acc.fta += g.fta;
        return acc;
    }, { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

    const avg = (v, g) => Number((v / g).toFixed(1));

    return {
        id, ...team,
        stats: {
            gp,
            wins,
            losses,
            win_pct: Number(((wins / gp) * 100).toFixed(1)),
            ppg: avg(totals.pts, gp),
            rpg: avg(totals.reb, gp),
            apg: avg(totals.ast, gp),
            spg: avg(totals.stl, gp),
            bpg: avg(totals.blk, gp),
            tpg: avg(totals.tov, gp),
            fg_pct: totals.fga > 0 ? Number(((totals.fgm / totals.fga) * 100).toFixed(1)) : 0,
            t_pct: totals.tpa > 0 ? Number(((totals.tpm / totals.tpa) * 100).toFixed(1)) : 0,
            ft_pct: totals.fta > 0 ? Number(((totals.ftm / totals.fta) * 100).toFixed(1)) : 0,
        }
    };
}

export default async function TeamComparePage({ searchParams }) {
    const sp = await searchParams;
    const { t1, t2 } = sp;

    // Grab all valid teams for the dropdowns
    const allTeams = await query(`
        SELECT t.id, t.name, tour.gender 
        FROM Teams t 
        JOIN Tournaments tour ON t.tournament_id = tour.id 
        ORDER BY t.name ASC
    `);

    const team1 = await getTeamStats(t1);
    const team2 = await getTeamStats(t2);

    // Fetch H2H Matches if both teams are selected
    let h2hMatches = [];
    if (t1 && t2) {
        h2hMatches = await query(`
            SELECT m.match_id, tour.name as tourney_name,
                   ta.name as team_a_name, tb.name as team_b_name,
                   SUM(CASE WHEN b.team_id = ta.id THEN b.pts ELSE 0 END) as team_a_pts,
                   SUM(CASE WHEN b.team_id = tb.id THEN b.pts ELSE 0 END) as team_b_pts
            FROM Matches m
            JOIN Tournaments tour ON m.tournament_id = tour.id
            JOIN Teams ta ON m.home_team_id = ta.id
            JOIN Teams tb ON m.away_team_id = tb.id
            JOIN Boxscores b ON m.match_id = b.match_id
            WHERE (m.home_team_id = ? AND m.away_team_id = ?) OR (m.home_team_id = ? AND m.away_team_id = ?)
            GROUP BY m.match_id
            ORDER BY m.match_id DESC
        `, [t1, t2, t2, t1]);
    }

    const renderComparisonRow = (label, key, higherIsBetter = true, isPercent = false) => {
        if (!team1 || !team2 || !team1.stats || !team2.stats) return null;
        const v1 = team1.stats[key];
        const v2 = team2.stats[key];
        const t1Wins = higherIsBetter ? v1 > v2 : v1 < v2;
        const t2Wins = higherIsBetter ? v2 > v1 : v2 < v1;

        return (
            <tr>
                <td style={{ textAlign: 'center', width: '35%', color: t1Wins ? 'var(--tappa-orange)' : 'white', fontWeight: t1Wins ? 800 : 400 }}>{String(v1)}{isPercent ? '%' : ''}</td>
                <td style={{ textAlign: 'center', width: '30%', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</td>
                <td style={{ textAlign: 'center', width: '35%', color: t2Wins ? 'var(--tappa-orange)' : 'white', fontWeight: t2Wins ? 800 : 400 }}>{String(v2)}{isPercent ? '%' : ''}</td>
            </tr>
        );
    };

    return (
        <div className="compare-dashboard animate-fade-in">
            <style dangerouslySetInnerHTML={{ __html: `.hover-orange:hover { color: var(--tappa-orange) !important; border-color: var(--tappa-orange) !important; }` }} />
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1>Head-to-Head Comparison</h1>
                <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Select two teams to compare their aggregated metrics.</p>
            </div>

            {/* Sub-Navigation Toggle (Pill Style) */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                <Link href="/compare" style={{ 
                    padding: '8px 24px', 
                    borderRadius: '8px', 
                    background: 'transparent', 
                    color: 'var(--text-secondary)', 
                    fontWeight: '800', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textDecoration: 'none'
                }} className="hover-white">
                    Players
                </Link>
                <Link href="/compare/teams" style={{ 
                    padding: '8px 24px', 
                    borderRadius: '8px', 
                    background: 'var(--tappa-orange)', 
                    color: 'white', 
                    fontWeight: '800', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(209, 107, 7, 0.3)'
                }}>
                    Teams
                </Link>
            </div>

            {/* Selectors */}
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Team A</h3>
                    <form action="/compare/teams" method="GET" style={{ display: 'flex', gap: '10px' }}>
                        <input type="hidden" name="t2" value={t2 || ''} />
                        <select name="t1" defaultValue={t1 || ''} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                            <option value="">-- Select Team --</option>
                            {allTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.gender === 'Women' ? "Women's" : "Men's"})</option>)}
                        </select>
                        <button type="submit" style={{ padding: '10px 20px', background: 'var(--tappa-orange)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Select</button>
                    </form>
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Team B</h3>
                    <form action="/compare/teams" method="GET" style={{ display: 'flex', gap: '10px' }}>
                        <input type="hidden" name="t1" value={t1 || ''} />
                        <select name="t2" defaultValue={t2 || ''} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                            <option value="">-- Select Team --</option>
                            {allTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.gender === 'Women' ? "Women's" : "Men's"})</option>)}
                        </select>
                        <button type="submit" style={{ padding: '10px 20px', background: 'var(--tappa-orange)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Select</button>
                    </form>
                </div>
            </div>

            {/* Comparison Matrix */}
            {(team1 && team2 && team1.stats && team2.stats) ? (
                <>
                    <div className="glass-card" style={{ padding: '0', marginBottom: '2rem' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center', fontSize: '1.5rem', color: 'white', borderBottom: '2px solid var(--tappa-orange)', padding: '2rem 1rem' }}>
                                        <TeamLogo teamName={team1.name} width={60} height={60} />
                                        <div style={{ marginTop: '10px' }}>
                                            <Link href={`/teams/${team1.id}`}>{team1.name}</Link>
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-glass)' }}>VS</th>
                                    <th style={{ textAlign: 'center', fontSize: '1.5rem', color: 'white', borderBottom: '2px solid var(--tappa-orange)', padding: '2rem 1rem' }}>
                                        <TeamLogo teamName={team2.name} width={60} height={60} />
                                        <div style={{ marginTop: '10px' }}>
                                            <Link href={`/teams/${team2.id}`}>{team2.name}</Link>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderComparisonRow('Win Percentage', 'win_pct', true, true)}
                                {renderComparisonRow('Wins', 'wins')}
                                {renderComparisonRow('Losses', 'losses', false)}
                                {renderComparisonRow('Team PPG', 'ppg')}
                                {renderComparisonRow('Team RPG', 'rpg')}
                                {renderComparisonRow('Team APG', 'apg')}
                                {renderComparisonRow('Team SPG', 'spg')}
                                {renderComparisonRow('Team BPG', 'bpg')}
                                {renderComparisonRow('Team TPG', 'tpg', false)}
                                {renderComparisonRow('Team FG%', 'fg_pct', true, true)}
                                {renderComparisonRow('Team 3P%', 't_pct', true, true)}
                                {renderComparisonRow('Team FT%', 'ft_pct', true, true)}
                            </tbody>
                        </table>
                    </div>

                    {/* H2H Meetings */}
                    <h2 className="section-title">Match History</h2>
                    <div className="glass-card" style={{ padding: '0 1rem' }}>
                        {h2hMatches.map((m) => {
                            // Determine if Team 1 won this match
                            const isT1Home = m.team_a_name === team1.name;
                            const t1Pts = isT1Home ? m.team_a_pts : m.team_b_pts;
                            const t2Pts = isT1Home ? m.team_b_pts : m.team_a_pts;
                            const t1Won = t1Pts > t2Pts;

                            return (
                                <div key={m.match_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{m.tourney_name}</div>
                                        <Link href={`/matches/${m.match_id}`} style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', textDecoration: 'none' }} className="hover-orange">
                                            {m.team_a_name} vs {m.team_b_name}
                                        </Link>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: t1Won ? 'var(--tappa-orange)' : 'white', fontFamily: 'Outfit' }}>{t1Pts}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{team1.name}</div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>-</div>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: !t1Won ? 'var(--tappa-orange)' : 'white', fontFamily: 'Outfit' }}>{t2Pts}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{team2.name}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {h2hMatches.length === 0 && <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No historical matchups found between these teams.</div>}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    {team1 || team2 ? 'Insufficient data for one or both teams.' : 'Please select two teams to begin the comparison.'}
                </div>
            )}
        </div>
    );
}
