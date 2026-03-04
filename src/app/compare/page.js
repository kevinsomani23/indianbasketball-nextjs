import { query, queryOne } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Head-to-Head Comparison | Indian Basketball',
};

async function getPlayerStats(id) {
    if (!id) return null;
    const player = await queryOne('SELECT p.name, p.position, p.height, p.age, t.name as team_name FROM Players p JOIN Teams t ON p.team_id = t.id WHERE p.player_id = ?', [id]);
    if (!player) return null;

    const logs = await query('SELECT * FROM Boxscores WHERE player_id = ?', [id]);

    const totals = logs.reduce((acc, g) => {
        acc.gp += 1; acc.pts += g.pts; acc.reb += g.reb; acc.ast += g.ast; acc.stl += g.stl; acc.blk += g.blk;
        acc.tov += g.tov; acc.fgm += g.fgm; acc.fga += g.fga; acc.tpm += g.tpm; acc.tpa += g.tpa;
        acc.ftm += g.ftm; acc.fta += g.fta; acc.gm_scr += g.gm_scr;
        return acc;
    }, { gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, gm_scr: 0 });

    const avg = (v, g) => g > 0 ? Number((v / g).toFixed(1)) : 0;

    return {
        id, ...player,
        stats: {
            gp: totals.gp,
            ppg: avg(totals.pts, totals.gp),
            rpg: avg(totals.reb, totals.gp),
            apg: avg(totals.ast, totals.gp),
            spg: avg(totals.stl, totals.gp),
            bpg: avg(totals.blk, totals.gp),
            tpg: avg(totals.tov, totals.gp),
            gm_scr: avg(totals.gm_scr, totals.gp),
            fg_pct: totals.fga > 0 ? Number(((totals.fgm / totals.fga) * 100).toFixed(1)) : 0,
            t_pct: totals.tpa > 0 ? Number(((totals.tpm / totals.tpa) * 100).toFixed(1)) : 0,
            ft_pct: totals.fta > 0 ? Number(((totals.ftm / totals.fta) * 100).toFixed(1)) : 0,
        }
    };
}

export default async function ComparePage({ searchParams }) {
    // Await searchParams in Next.js 15
    const sp = await searchParams;
    const { p1, p2 } = sp;

    // Let's grab the top 50 players to populate the dropdowns
    const topPlayers = await query(`
    SELECT p.player_id, p.name, t.name as team_name
    FROM Players p
    JOIN Teams t ON p.team_id = t.id
    JOIN Boxscores b ON p.player_id = b.player_id
    GROUP BY p.player_id
    ORDER BY SUM(b.pts) DESC
    LIMIT 100
  `);

    const player1 = await getPlayerStats(p1);
    const player2 = await getPlayerStats(p2);

    const renderComparisonRow = (label, key, higherIsBetter = true) => {
        if (!player1 || !player2) return null;
        const v1 = player1.stats[key];
        const v2 = player2.stats[key];
        const p1Wins = higherIsBetter ? v1 > v2 : v1 < v2;
        const p2Wins = higherIsBetter ? v2 > v1 : v2 < v1;

        return (
            <tr>
                <td style={{ textAlign: 'center', width: '35%', color: p1Wins ? 'var(--tappa-orange)' : 'white', fontWeight: p1Wins ? 800 : 400 }}>{String(v1)}</td>
                <td style={{ textAlign: 'center', width: '30%', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</td>
                <td style={{ textAlign: 'center', width: '35%', color: p2Wins ? 'var(--tappa-orange)' : 'white', fontWeight: p2Wins ? 800 : 400 }}>{String(v2)}</td>
            </tr>
        );
    };

    return (
        <div className="compare-dashboard animate-fade-in">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>Head-to-Head Comparison</h1>
                <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Select two players to compare their advanced career metrics.</p>
            </div>

            {/* Selectors */}
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', justifyContent: 'space-between' }}>
                {/* We use a simple layout for the dropdown forms */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Player A</h3>
                    <form action="/compare" method="GET" style={{ display: 'flex', gap: '10px' }}>
                        <input type="hidden" name="p2" value={p2 || ''} />
                        <select name="p1" defaultValue={p1 || ''} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                            <option value="">-- Select Player --</option>
                            {topPlayers.map(p => <option key={p.player_id} value={p.player_id}>{p.name} ({p.team_name})</option>)}
                        </select>
                        <button type="submit" style={{ padding: '10px 20px', background: 'var(--tappa-orange)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Select</button>
                    </form>
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Player B</h3>
                    <form action="/compare" method="GET" style={{ display: 'flex', gap: '10px' }}>
                        <input type="hidden" name="p1" value={p1 || ''} />
                        <select name="p2" defaultValue={p2 || ''} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                            <option value="">-- Select Player --</option>
                            {topPlayers.map(p => <option key={p.player_id} value={p.player_id}>{p.name} ({p.team_name})</option>)}
                        </select>
                        <button type="submit" style={{ padding: '10px 20px', background: 'var(--tappa-orange)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Select</button>
                    </form>
                </div>
            </div>

            {/* Comparison Matrix */}
            {(player1 && player2) ? (
                <div className="glass-card" style={{ padding: '0' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', fontSize: '1.5rem', color: 'white', borderBottom: '2px solid var(--tappa-orange)' }}>
                                    <Link href={`/players/${player1.id}`}>{player1.name}</Link>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{player1.team_name}</div>
                                </th>
                                <th style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-glass)' }}>VS</th>
                                <th style={{ textAlign: 'center', fontSize: '1.5rem', color: 'white', borderBottom: '2px solid var(--tappa-orange)' }}>
                                    <Link href={`/players/${player2.id}`}>{player2.name}</Link>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{player2.team_name}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderComparisonRow('Games Played', 'gp')}
                            {renderComparisonRow('Points Per Game', 'ppg')}
                            {renderComparisonRow('Rebounds Per Game', 'rpg')}
                            {renderComparisonRow('Assists Per Game', 'apg')}
                            {renderComparisonRow('Steals Per Game', 'spg')}
                            {renderComparisonRow('Blocks Per Game', 'bpg')}
                            {renderComparisonRow('Turnovers Per Game', 'tpg', false)}
                            {renderComparisonRow('Game Score', 'gm_scr')}
                            {renderComparisonRow('Field Goal %', 'fg_pct')}
                            {renderComparisonRow('3-Point %', 't_pct')}
                            {renderComparisonRow('Free Throw %', 'ft_pct')}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Please select two players to begin the comparison.
                </div>
            )}
        </div>
    );
}
