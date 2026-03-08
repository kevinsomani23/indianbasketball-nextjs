import { query, queryOne } from '@/lib/db';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import TeamLogo from '@/components/TeamLogo';
import InteractiveBoxscore from '@/components/InteractiveBoxscore';
import TeamBoxscoresContainer from '@/components/TeamBoxscoresContainer';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const m = await queryOne(`
        SELECT ta.name as a, tb.name as b, tour.name as tour, m.stage
        FROM Matches m
        JOIN Teams ta ON m.home_team_id = ta.id
        JOIN Teams tb ON m.away_team_id = tb.id
        JOIN Tournaments tour ON m.tournament_id = tour.id
        WHERE m.match_id = ?
    `, [id]);
    if (!m) return { title: `Match ${id} | Indian Basketball` };
    const stage = m.stage ? ` · ${m.stage}` : '';
    return { title: `${m.a} vs ${m.b} | ${m.tour}${stage}` };
}

export default async function MatchBoxscore({ params }) {
    const { id } = await params;

    // 1. Get Match Context
    const match = await queryOne(`
    SELECT m.match_id, m.match_date, tour.name as tourney_name, tour.id as tourney_id, m.stage,
           ta.id as team_a_id, ta.name as team_a_name,
           tb.id as team_b_id, tb.name as team_b_name,
           (SELECT p.player_id FROM Boxscores b JOIN Players p ON b.player_id = p.player_id WHERE b.match_id = m.match_id LIMIT 1) as sample_pid
    FROM Matches m
    JOIN Tournaments tour ON m.tournament_id = tour.id
    JOIN Teams ta ON m.home_team_id = ta.id
    JOIN Teams tb ON m.away_team_id = tb.id
    WHERE m.match_id = ?
  `, [id]);

    if (!match) return <div>Match not found.</div>;
    const gender = match.gender === 'Women' ? "Women's" : "Men's";

    // Helper to fetch boxscores for a specific team in this match
    const getBoxscores = async (teamId) => {
        return await query(`
      SELECT b.*, p.name 
      FROM Boxscores b
      JOIN Players p ON b.player_id = p.player_id
      WHERE b.match_id = ? AND b.team_id = ?
      ORDER BY b.min DESC, b.pts DESC
    `, [id, teamId]);
    };

    const teamABox = await getBoxscores(match.team_a_id);
    const teamBBox = await getBoxscores(match.team_b_id);

    // Fetch Team Match Stats for stat strip
    const teamMatchStats = await query(`
        SELECT team_id, pts, pitp, fbps, sec_chance, efg_pct, ts_pct
        FROM TeamMatchStats
        WHERE match_id = ?
    `, [id]);
    const teamAStats = teamMatchStats.find(t => t.team_id === match.team_a_id) || {};
    const teamBStats = teamMatchStats.find(t => t.team_id === match.team_b_id) || {};

    // Fetch Player Period Stats for Interactive Boxscore
    const playerPeriodStatsRows = await query(`
        SELECT *
        FROM PeriodBoxscores
        WHERE match_id = ?
    `, [id]);
    
    const teamAPeriodBoxscores = playerPeriodStatsRows.filter(r => r.team_id === match.team_a_id);
    const teamBPeriodBoxscores = playerPeriodStatsRows.filter(r => r.team_id === match.team_b_id);

    // Fetch Team Period Stats for Quarters Breakdown Scoreboard
    const periodStatsRows = await query(`
        SELECT team_id, period, pts
        FROM TeamPeriodStats
        WHERE match_id = ?
        ORDER BY period
    `, [id]);
    
    // Process periods
    // period string might be 'Q1', 'Q2', 'H1', 'OT1' etc depending on scrape. Usually Q1, Q2, Q3, Q4.
    const validPeriods = ['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2', 'OT3'];
    const pbpPeriodsPresent = periodStatsRows.length > 0;
    
    // Group by team
    const teamAPeriods = {};
    const teamBPeriods = {};
    let matchedPeriods = new Set();
    
    periodStatsRows.forEach(row => {
        if (validPeriods.includes(row.period)) {
            // Only add OTs if someone scored in them
            if (row.period.startsWith('OT') && row.pts === 0) return;
            
            matchedPeriods.add(row.period);
            if (row.team_id === match.team_a_id) {
                teamAPeriods[row.period] = row.pts;
            } else if (row.team_id === match.team_b_id) {
                teamBPeriods[row.period] = row.pts;
            }
        }
    });
    
    // Sort periods correctly (Q1-Q4, then OT)
    const sortedPeriods = Array.from(matchedPeriods).sort((a,b) => {
        if (a.startsWith('Q') && b.startsWith('OT')) return -1;
        if (a.startsWith('OT') && b.startsWith('Q')) return 1;
        return a.localeCompare(b);
    });

    // Validate Score
    const teamAScore = teamABox.reduce((sum, b) => sum + b.pts, 0);
    const teamBScore = teamBBox.reduce((sum, b) => sum + b.pts, 0);
    
    // Format Date Safely (Prevent 'Invalid Date' and timezone shifts)
    let displayDate = "";
    if (match.match_date) {
        if (typeof match.match_date === 'string' && match.match_date.includes('-')) {
            const parts = match.match_date.split('-');
            if (parts.length === 3) {
                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                } else {
                    displayDate = match.match_date;
                }
            } else {
                displayDate = match.match_date;
            }
        } else {
            displayDate = match.match_date;
        }
    }

    // Prev/Next match navigation within same tournament
    const [prevMatch, nextMatch] = await Promise.all([
        queryOne(`
            SELECT m.match_id FROM Matches m
            JOIN Tournaments t ON m.tournament_id = t.id
            WHERE m.tournament_id = ? AND m.match_id < ? AND t.gender = (SELECT gender FROM Tournaments WHERE id = ?)
            ORDER BY m.match_id DESC LIMIT 1
        `, [match.tourney_id, id, match.tourney_id]),
        queryOne(`
            SELECT m.match_id FROM Matches m
            JOIN Tournaments t ON m.tournament_id = t.id
            WHERE m.tournament_id = ? AND m.match_id > ? AND t.gender = (SELECT gender FROM Tournaments WHERE id = ?)
            ORDER BY m.match_id ASC LIMIT 1
        `, [match.tourney_id, id, match.tourney_id]),
    ]);

    return (
        <div className="match-boxscore-page animate-fade-in" style={{ backgroundColor: 'var(--dark-bg)', minHeight: '100vh', padding: '2rem 5%' }}>
            
            {/* Top Navigation Bar */}
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <Link href="/matches" className="flex-row" style={{ color: 'var(--text-secondary)', textDecoration: 'none', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.2rem' }}>←</span> Matches
                </Link>
                <div className="flex-row" style={{ gap: '8px' }}>
                    {prevMatch ? (
                        <Link href={`/matches/${prevMatch.match_id}`} title="Previous match" style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            ← Prev
                        </Link>
                    ) : <span style={{ padding: '6px 12px', color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>← Prev</span>}
                    {nextMatch ? (
                        <Link href={`/matches/${nextMatch.match_id}`} title="Next match" style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            Next →
                        </Link>
                    ) : <span style={{ padding: '6px 12px', color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>Next →</span>}
                    <ShareButton />
                </div>
            </div>
                
            {/* Header Scoreboard */}
                <div style={{ marginBottom: '3rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                        <Link href={`/tournaments/${match.tourney_id}`} style={{ color: 'var(--text-secondary)' }}>{match.tourney_name}</Link> <span style={{ opacity: 0.5, margin: '0 8px' }}>•</span> {gender} {match.stage && `• ${match.stage}`} {displayDate && `• ${displayDate}`}
                    </p>
                    <h1 className="flex-center" style={{ fontSize: '3rem', margin: '0 0 2rem 0', color: 'white', gap: '3rem' }}>
                        <div className="flex-row" style={{ gap: '20px' }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: 600 }}>{match.team_a_name}</span>
                            <TeamLogo teamName={match.team_a_name} width={70} height={70} />
                            <span style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '3.5rem', color: teamAScore > teamBScore ? 'var(--tappa-orange)' : 'white' }}>{teamAScore}</span>
                        </div>

                        <span style={{ color: 'var(--text-muted)', fontSize: '1.5rem', fontWeight: 400 }}>vs</span>

                        <div className="flex-row" style={{ gap: '20px' }}>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '3.5rem', color: teamBScore > teamAScore ? 'var(--tappa-orange)' : 'white' }}>{teamBScore}</span>
                            <TeamLogo teamName={match.team_b_name} width={70} height={70} />
                            <span style={{ fontSize: '1.8rem', fontWeight: 600 }}>{match.team_b_name}</span>
                        </div>
                    </h1>
                    
                    {/* Quarter Breakdown Scoreboard */}
                    {pbpPeriodsPresent && sortedPeriods.length > 0 && (
                        <div className="flex-center">
                            <div style={{ 
                                backgroundColor: 'rgba(0,0,0,0.3)', 
                                borderRadius: '8px', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '1rem 1.5rem',
                                display: 'inline-block'
                            }}>
                                <table style={{ width: 'auto', margin: '0 auto', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '150px', textAlign: 'left', padding: '0.5rem 1rem' }}></th>
                                            {sortedPeriods.map(p => (
                                                <th key={p} style={{ width: '40px', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p}</th>
                                            ))}
                                            <th style={{ width: '50px', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800 }}>TOT</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                        <tr>
                                            <td style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'white' }}>{match.team_a_name}</td>
                                            {sortedPeriods.map(p => (
                                                <td key={p} style={{ textAlign: 'center', padding: '0.5rem' }}>{teamAPeriods[p] ?? '-'}</td>
                                            ))}
                                            <td style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--tappa-orange)', fontWeight: 800 }}>{teamAScore}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'white' }}>{match.team_b_name}</td>
                                            {sortedPeriods.map(p => (
                                                <td key={p} style={{ textAlign: 'center', padding: '0.5rem' }}>{teamBPeriods[p] ?? '-'}</td>
                                            ))}
                                            <td style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--tappa-orange)', fontWeight: 800 }}>{teamBScore}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Team Stat Strip */}
                    {(teamAStats.pitp !== undefined || teamBStats.pitp !== undefined) && (
                        <div className="flex-center" style={{ marginTop: '1.5rem', gap: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                            {[
                                { label: 'In Paint', a: teamAStats.pitp, b: teamBStats.pitp },
                                { label: 'Fast Break', a: teamAStats.fbps, b: teamBStats.fbps },
                                { label: '2nd Chance', a: teamAStats.sec_chance, b: teamBStats.sec_chance },
                                { label: 'eFG%', a: teamAStats.efg_pct != null ? Number(teamAStats.efg_pct).toFixed(1) : null, b: teamBStats.efg_pct != null ? Number(teamBStats.efg_pct).toFixed(1) : null },
                                { label: 'TS%', a: teamAStats.ts_pct != null ? Number(teamAStats.ts_pct).toFixed(1) : null, b: teamBStats.ts_pct != null ? Number(teamBStats.ts_pct).toFixed(1) : null },
                            ].filter(s => s.a !== null && s.a !== undefined).map(stat => (
                                <div key={stat.label} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{stat.label}</div>
                                    <div className="flex-row" style={{ gap: '8px', fontWeight: 700 }}>
                                        <span style={{ color: stat.a > stat.b ? 'white' : 'var(--text-muted)' }}>{stat.a ?? '-'}</span>
                                        <span style={{ opacity: 0.3 }}>–</span>
                                        <span style={{ color: stat.b > stat.a ? 'white' : 'var(--text-muted)' }}>{stat.b ?? '-'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Match Video Embed (Hidden for now until URLs are mapped) */}
                <div style={{ display: 'none', margin: '0 auto 4rem auto', maxWidth: '800px' }}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <iframe 
                            src="https://www.youtube.com/embed/placeholder" 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            title="Match Video"
                        />
                    </div>
                </div>

                {/* SCORING MOMENTUM CHART - MOVED TO CONTAINER */}

                {/* Vertical Full-Width Tables */}
                <div>
                    <TeamBoxscoresContainer 
                        teamAName={match.team_a_name} 
                        teamAId={match.team_a_id} 
                        teamABox={teamABox} 
                        teamAPeriodBoxscores={teamAPeriodBoxscores}
                        teamAScore={teamAScore}
                        
                        teamBName={match.team_b_name} 
                        teamBId={match.team_b_id} 
                        teamBBox={teamBBox} 
                        teamBPeriodBoxscores={teamBPeriodBoxscores}
                        teamBScore={teamBScore}
                        
                        periods={sortedPeriods}
                        isWinnerA={teamAScore > teamBScore}
                        isWinnerB={teamBScore > teamAScore}
                        
                        // Pass momentum data
                        pbpPeriodsPresent={pbpPeriodsPresent}
                        teamAPeriods={teamAPeriods}
                        teamBPeriods={teamBPeriods}
                    />
                </div>
        </div>
    );
}

