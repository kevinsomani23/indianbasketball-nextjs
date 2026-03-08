import { query } from '@/lib/db';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';
import TournamentSelector from '@/components/TournamentSelector';

export const dynamic = 'force-dynamic';

export default async function TournamentsDashboard({ searchParams }) {
    const params = await searchParams;
    const tourneys = await query(`SELECT id, name, short_name, gender FROM Tournaments ORDER BY id DESC`);
    
    // Default to the latest tournament if none selected
    const selectedId = params.tournament ? parseInt(params.tournament) : tourneys[0].id;
    const t = tourneys.find(item => item.id === selectedId) || tourneys[0];

    // Fetch Dashboard Data for selected tournament
    
    // 1. Finalists (Winner & Runner-up)
    const final = await query(`
        SELECT m.match_id, ta.name as t1, tb.name as t2, ta.id as id1, tb.id as id2,
               (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = m.home_team_id) as p1,
               (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = m.away_team_id) as p2
        FROM Matches m
        JOIN Teams ta ON m.home_team_id = ta.id
        JOIN Teams tb ON m.away_team_id = tb.id
        WHERE m.tournament_id = ? AND m.stage = 'Final'
        LIMIT 1
    `, [t.id]);

    let champion = { name: "TBD", id: null, score: "" };
    let runnerUp = { name: "TBD", id: null, score: "" };
    
    if (final && final.length > 0) {
        const f = final[0];
        if (f.p1 !== null && f.p2 !== null) {
            if (f.p1 > f.p2) {
                champion = { name: f.t1, id: f.id1, score: f.p1 };
                runnerUp = { name: f.t2, id: f.id2, score: f.p2 };
            } else {
                champion = { name: f.t2, id: f.id2, score: f.p2 };
                runnerUp = { name: f.t1, id: f.id1, score: f.p1 };
            }
        }
    }

    // 2. Statistical Leaders
    const getLeader = async (stat) => {
        const rows = await query(`
            SELECT p.player_id, p.name, SUM(b.${stat}) as total, AVG(b.${stat}) as avg, t.name as team_name
            FROM Boxscores b
            JOIN Players p ON b.player_id = p.player_id
            JOIN Teams t ON p.team_id = t.id
            JOIN Matches m ON b.match_id = m.match_id
            WHERE m.tournament_id = ?
            GROUP BY p.player_id
            ORDER BY total DESC
            LIMIT 1
        `, [t.id]);
        return rows[0] || null;
    };

    const topScorer = await getLeader('pts');
    const topRebounder = await getLeader('reb');
    const topPlaymaker = await getLeader('ast');

    // 3. Tournament Summary
    const matchCount = (await query("SELECT COUNT(*) as c FROM Matches WHERE tournament_id = ?", [t.id]))[0].c;
    const playerCount = (await query("SELECT COUNT(DISTINCT player_id) as c FROM Boxscores WHERE match_id IN (SELECT match_id FROM Matches WHERE tournament_id = ?)", [t.id]))[0].c;
    const teamCount = (await query("SELECT COUNT(DISTINCT id) as c FROM Teams WHERE tournament_id = ?", [t.id]))[0].c;

    return (
        <div className="tournaments-dashboard animate-fade-in" style={{ padding: '0 1rem' }}>
            {/* Header with Selection */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '3rem', 
                borderBottom: '1px solid var(--border-glass)', 
                paddingBottom: '2rem' 
            }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>
                        {t.name.toUpperCase()}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            background: t.gender === 'Women' ? 'rgba(236,72,153,0.1)' : 'rgba(209,107,7,0.1)',
                            color: t.gender === 'Women' ? 'var(--women-accent)' : 'var(--tappa-orange)',
                            border: `1px solid ${t.gender === 'Women' ? 'rgba(236,72,153,0.2)' : 'rgba(209,107,7,0.2)'}`,
                            fontFamily: 'Space Grotesk'
                        }}>
                            {t.gender.toUpperCase()} DIVISION
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>• BFI Senior National Basketball Championship</span>
                    </div>
                </div>

                <TournamentSelector tourneys={tourneys} selectedId={selectedId} />
            </div>

            {/* Dashboard Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                
                {/* Main Stats Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Champion & Runner-up Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', position: 'relative', border: '1px solid rgba(209, 107, 7, 0.3)', background: 'linear-gradient(135deg, rgba(209, 107, 7, 0.05) 0%, rgba(9, 9, 11, 0.4) 100%)' }}>
                            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--tappa-orange)', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em' }}>CHAMPIONS</div>
                            <div style={{ marginBottom: '1rem' }}><TeamLogo teamName={champion.name} width={120} height={120} /></div>
                            <h2 style={{ fontSize: '1.8rem', margin: '0 0 4px 0', fontWeight: 900 }}>{champion.name}</h2>
                            <p style={{ margin: 0, color: 'var(--tappa-orange)', fontSize: '1.1rem', fontWeight: 800 }}>{champion.score ? `FINAL: ${champion.score}` : 'TBD'}</p>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.8 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '0.1em' }}>RUNNER-UP</div>
                            <div style={{ marginBottom: '1rem' }}><TeamLogo teamName={runnerUp.name} width={80} height={80} /></div>
                            <h3 style={{ fontSize: '1.4rem', margin: '0 0 4px 0', fontWeight: 800 }}>{runnerUp.name}</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>{runnerUp.score ? `Final Score: ${runnerUp.score}` : 'TBD'}</p>
                        </div>
                    </div>

                    {/* Quick Navigation Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <Link href={`/matches?tournament=${t.id}`} style={{ textDecoration: 'none' }}>
                            <div className="glass-card clickable-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>MATCHES</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{matchCount} Total Games</p>
                            </div>
                        </Link>
                        <Link href={`/stats?tournament=${t.id}`} style={{ textDecoration: 'none' }}>
                            <div className="glass-card clickable-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>FULL STATS</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Advanced Analysis</p>
                            </div>
                        </Link>
                        <Link href={`/teams?gender=${t.gender === 'Women' ? 'W' : 'M'}`} style={{ textDecoration: 'none' }}>
                            <div className="glass-card clickable-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>TEAMS</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{teamCount} Participating</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Sidebar Stats Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 900, borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>STATISTICAL LEADERS</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Points Leader */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--tappa-orange)' }}>PTS</div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>SCORING CHAMP</div>
                                    <div style={{ fontWeight: 800, color: 'white' }}>{topScorer?.name || 'N/A'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{topScorer?.team_name} • <span style={{ color: 'white' }}>{topScorer?.total} Points</span></div>
                                </div>
                            </div>

                            {/* Rebounds Leader */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--badge-dd)' }}>REB</div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>GLASS CLEANER</div>
                                    <div style={{ fontWeight: 800, color: 'white' }}>{topRebounder?.name || 'N/A'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{topRebounder?.team_name} • <span style={{ color: 'white' }}>{topRebounder?.total} Rebs</span></div>
                                </div>
                            </div>

                            {/* Assists Leader */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--stat-reb)' }}>AST</div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PLAYMAKER</div>
                                    <div style={{ fontWeight: 800, color: 'white' }}>{topPlaymaker?.name || 'N/A'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{topPlaymaker?.team_name} • <span style={{ color: 'white' }}>{topPlaymaker?.total} Assists</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.05em' }}>TOURNAMENT AT A GLANCE</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{playerCount}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ATHLETES</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{matchCount}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MATCHES</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
