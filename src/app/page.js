import { queryOne, query } from '@/lib/db';
import Link from 'next/link';
import TopPerformancesList from '@/components/TopPerformancesList';
import TournamentCard from '@/components/TournamentCard';

// Force dynamic since we read from SQLite
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. Global Stats
  const stats = await Promise.all([
    queryOne('SELECT COUNT(*) as count FROM Tournaments'),
    queryOne('SELECT COUNT(*) as count FROM Teams'),
    queryOne('SELECT COUNT(*) as count FROM Players'),
    queryOne('SELECT COUNT(*) as count FROM Matches'),
  ]);

  const globalStats = {
    tourneys: stats[0].count,
    teams: stats[1].count,
    players: stats[2].count,
    matches: stats[3].count
  };

  // 2. Fetch All Tournaments for the Carousel
  const tournaments = await query(`
    SELECT t.id, t.name, t.gender,
           (SELECT COUNT(*) FROM Matches m WHERE m.tournament_id = t.id) as match_count,
           (SELECT COUNT(DISTINCT b.team_id) FROM Boxscores b WHERE b.tournament_id = t.id) as team_count
    FROM Tournaments t
    ORDER BY t.id DESC
  `);

  // 3. Top Single-Game Performances
  const getTopPerformances = async (gender) => {
    return await query(`
      SELECT b.match_id, b.pts, b.reb, b.ast, b.gm_scr, p.player_id, p.name as player_name, 
             t.name as team_name, tour.name as tourney_name, m.gender
      FROM Boxscores b
      JOIN Players p ON b.player_id = p.player_id
      JOIN Teams t ON b.team_id = t.id
      JOIN Matches m ON b.match_id = m.match_id
      JOIN Tournaments tour ON m.tournament_id = tour.id
      WHERE m.gender = ? AND b.gm_scr > 0
      ORDER BY b.gm_scr DESC
      LIMIT 10
    `, [gender]);
  };

  const topMenPerformances = await getTopPerformances('Men');
  const topWomenPerformances = await getTopPerformances('Women');

  // 4. Recent Matches
  const recentMatches = await query(`
    SELECT m.match_id, m.match_date, m.stage,
           ta.name as team_a_name, tb.name as team_b_name,
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = m.home_team_id) as team_a_score,
           (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = m.away_team_id) as team_b_score,
           tour.name as tourney_name
    FROM Matches m
    JOIN Teams ta ON m.home_team_id = ta.id
    JOIN Teams tb ON m.away_team_id = tb.id
    JOIN Tournaments tour ON m.tournament_id = tour.id
    ORDER BY m.match_id DESC
    LIMIT 8
  `);

  return (
    <div className="home-dashboard animate-fade-in" style={{ padding: '0 1rem' }}>
      
      {/* 1. HEADER & GLOBAL STATS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', margin: '0 0 8px 0', color: 'white', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.06em', lineHeight: 1 }}>
            TournamentHub
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            Advanced analytics, momentum tracking, and deep match metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PLAYERS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Outfit' }}>{globalStats.players.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GAMES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Outfit' }}>{globalStats.matches.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TEAMS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Outfit' }}>{globalStats.teams.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 2. TOURNAMENT TRAYS — GROUPED BY EDITION */}
      <div style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Space Grotesk' }}>
              <span style={{ color: 'var(--tappa-orange)' }}>—</span> Tournament Hub
          </h2>

          {(() => {
              // Group by edition
              const editions = {};
              for (const t of tournaments) {
                  const ed = t.name.replace(/ (Men|Women)$/, '');
                  if (!editions[ed]) editions[ed] = [];
                  editions[ed].push(t);
              }
              return Object.entries(editions).sort(([a], [b]) => b.localeCompare(a)).map(([edition, divs]) => (
                  <div key={edition} style={{ marginBottom: '2rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Space Grotesk', marginBottom: '0.8rem', paddingLeft: '4px' }}>
                          {edition} Edition
                      </div>
                      <div className="tray-container">
                          {divs.sort((a, b) => (b.gender || '').localeCompare(a.gender || '')).map(t => (
                              <div key={t.id} className="tray-item">
                                <TournamentCard tournament={t} />
                              </div>
                          ))}
                      </div>
                  </div>
              ));
          })()}
      </div>

      {/* 3. PLAYER TRAYS — FEATURED ATHLETES (Restored) */}
      <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Space Grotesk' }}>
              <span style={{ color: 'var(--success)' }}>—</span> Star Performers
          </h2>
          <div className="tray-container">
              {[...topMenPerformances.slice(0, 5), ...topWomenPerformances.slice(0, 5)].map((p, idx) => (
                  <div key={`${p.player_id}-${idx}`} className="tray-item" style={{ width: '220px' }}>
                    <Link href={`/players/${p.player_id}`} style={{ textDecoration: 'none' }}>
                        <div className="player-tray-card">
                            <div style={{ 
                                width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
                                margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {p.player_name[0]}
                            </div>
                            <h3 style={{ fontSize: '0.95rem', margin: '0 0 4px 0', color: 'white', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.player_name}</h3>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0 0 12px 0', fontWeight: 600 }}>{p.team_name}</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PTS</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{p.pts}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>REB</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{p.reb}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>AST</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{p.ast}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '0.7rem', color: 'var(--tappa-orange)', fontWeight: 800 }}>
                                {p.gm_scr.toFixed(1)} GM SCR
                            </div>
                        </div>
                    </Link>
                  </div>
              ))}
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '3rem' }}>
        {/* LEFT COLUMN: TOP PERFORMANCES (LIST VIEW) */}
        <div>
          <TopPerformancesList 
            menData={topMenPerformances} 
            womenData={topWomenPerformances} 
          />
        </div>

        {/* RIGHT COLUMN: RECENT MATCHES & QUICK LINKS */}
        <div>
          <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '1px', background: 'var(--tappa-orange)' }}></span>
                  Recent Results
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentMatches.map(m => (
                      <Link key={m.match_id} href={`/matches/${m.match_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <div className="glass-card" style={{ padding: '0.85rem 1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', transition: 'all 0.2s', position: 'relative' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{m.tourney_name}</span>
                                  <span>{m.stage}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '0.85rem', fontWeight: m.team_a_score > m.team_b_score ? 800 : 500, color: m.team_a_score > m.team_b_score ? 'white' : 'var(--text-secondary)' }}>
                                              {m.team_a_name}
                                          </span>
                                          <span style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'Outfit', color: m.team_a_score > m.team_b_score ? 'white' : 'var(--text-muted)' }}>
                                              {m.team_a_score}
                                          </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '0.85rem', fontWeight: m.team_b_score > m.team_a_score ? 800 : 500, color: m.team_b_score > m.team_a_score ? 'white' : 'var(--text-secondary)' }}>
                                              {m.team_b_name}
                                          </span>
                                          <span style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'Outfit', color: m.team_b_score > m.team_a_score ? 'white' : 'var(--text-muted)' }}>
                                              {m.team_b_score}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link href="/players" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Explore Global Players</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                  </Link>
                  <Link href="/teams" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Browse Franchises</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                  </Link>
                  <Link href="/compare/teams" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Head-to-Head Compare</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                  </Link>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
