import Link from 'next/link';
import { query, queryOne } from '@/lib/db';
import { SQL_OPP_NAME, SQL_TEAM_SCORE, SQL_OPP_SCORE, SQL_TOURNEY_FILTER, SQL_TOURNEY_FILTER_PREFIXED, SQL_ACTIVE_PLAYERS } from '@/lib/queries';
import TeamLogo from '@/components/TeamLogo';
import MatchCard from '@/components/MatchCard';
import TournamentDropdown from '@/components/TournamentDropdown';
import RosterTable from '@/components/RosterTable';
import { calculatePct, formatTime } from '@/lib/stats-utils';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const t = await queryOne('SELECT name FROM Teams WHERE id = ?', [id]);
    return { title: t ? `${t.name} | Indian Basketball` : 'Team Profile' };
}

function RingChart({ pct, color, label, sublabel }) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const fill = (parseFloat(pct) / 100) * circ;
    return (
        <div className="flex-col" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                    <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
                        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', fontFamily: "'Outfit', sans-serif" }}>{pct}%</div>
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>{label}</div>
                {sublabel && <div className="text-muted-sm" style={{ fontSize: '0.65rem', marginTop: '2px' }}>{sublabel}</div>}
            </div>
        </div>
    );
}

export default async function TeamProfile({ params, searchParams }) {
    const { id } = await params;
    const sp = await searchParams;
    const urlGender = sp?.gender;
    const urlTourney = sp?.tourney || 'all';

    const team = await queryOne('SELECT * FROM Teams WHERE id = ?', [id]);
    if (!team) return <div style={{ padding: '4rem', color: 'var(--text-muted)' }}>Team not found.</div>;

    const teamTournaments = await query(`
        SELECT DISTINCT t.id, t.name, t.short_name, m.gender
        FROM Matches m JOIN Tournaments t ON m.tournament_id = t.id
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) ORDER BY t.id DESC
    `, [id, id]);

    // Per-game team stats from TeamMatchStats
    const tms = await query(`
        SELECT tms.pts, tms.reb, tms.ast, tms.stl, tms.tov,
               tms.fgm, tms.fga, tms.tpm, tms.tpa, tms.ftm, tms.fta,
               tms.offrtg, tms.defrtg, tms.netrtg, tms.efg_pct,
               tms.oreb, tms.dreb, tms.tournament_id,
               m.match_id, m.gender, m.home_team_id, m.match_date, m.stage,
               t.name as tourney_name, t.short_name as tourney_short, t.id as t_id,
               ${SQL_OPP_NAME} as opp_name,
               ${SQL_TEAM_SCORE} as team_score,
               ${SQL_OPP_SCORE} as opp_score
        FROM TeamMatchStats tms
        JOIN Matches m ON tms.match_id = m.match_id
        JOIN Tournaments t ON m.tournament_id = t.id
        WHERE tms.team_id = ? AND ${SQL_TOURNEY_FILTER.replace('tournament_id', 'tms.tournament_id')}
        ORDER BY m.match_id DESC
    `, [id, id, id, id, urlTourney, urlTourney]);

    // Roster with averages + totals
    const roster = await query(`
        SELECT p.player_id, p.name,
               (SELECT m.gender FROM Boxscores b2 JOIN Matches m ON b2.match_id = m.match_id WHERE b2.player_id = p.player_id LIMIT 1) as gender,
               COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END) as gp,
               ROUND(SUM(b.mins_dec), 0) as total_min,
               SUM(b.pts) as pts, SUM(b.reb) as reb,
               SUM(b.ast) as ast, SUM(b.stl) as stl,
               SUM(b.blk) as blk, SUM(b.tov) as tov,
               SUM(b.fgm) as fgm, SUM(b.fga) as fga,
               SUM(b.tpm) as tpm, SUM(b.tpa) as tpa,
               SUM(b.ftm) as ftm, SUM(b.fta) as fta,
               ROUND(SUM(b.pts)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as ppg,
               ROUND(SUM(b.reb)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as rpg,
               ROUND(SUM(b.ast)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as apg,
               ROUND(SUM(b.stl)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as spg,
               ROUND(SUM(b.blk)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as bpg,
               ROUND(SUM(b.tov)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as topg,
               ROUND(SUM(b.gm_scr)*1.0/NULLIF(COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END),0),1) as gmscr
        FROM Players p
        LEFT JOIN Boxscores b ON p.player_id = b.player_id AND b.team_id = p.team_id
            AND ${SQL_TOURNEY_FILTER_PREFIXED}
        WHERE p.team_id = ?
        GROUP BY p.player_id HAVING gp > 0 ORDER BY ppg DESC
    `, [urlTourney, urlTourney, id]);


    // Gender detection
    const hasMen   = tms.some(m => m.gender === 'Men')   || roster.some(p => p.gender === 'Men');
    const hasWomen = tms.some(m => m.gender === 'Women') || roster.some(p => p.gender === 'Women');
    const isDualGender = hasMen && hasWomen;

    let activeTab = hasMen ? 'M' : 'W';
    if (urlGender === 'W' && hasWomen) activeTab = 'W';
    else if (urlGender === 'M' && hasMen) activeTab = 'M';
    const G = activeTab === 'M' ? 'Men' : 'Women';

    const activeTMS   = tms.filter(m => m.gender === G);
    const activeRoster = roster.filter(p => p.gender === G);
    const genderTourneys = teamTournaments.filter(t => t.gender === G);
    const n = activeTMS.length;

    // Period-level data (fetched after G is known)
    // Note: PeriodBoxscores uses different player_id hashes than Players table.
    // SQL already scopes by team_id + gender + tournament — no JS filter needed.
    const activePeriodData = await query(`
        SELECT pb.player_id, pb.player_name as name, pb.period,
               COUNT(DISTINCT pb.match_id) as gp,
               SUM(pb.pts) as pts, SUM(pb.reb) as reb, SUM(pb.oreb) as oreb, SUM(pb.dreb) as dreb,
               SUM(pb.ast) as ast, SUM(pb.stl) as stl, SUM(pb.blk) as blk, SUM(pb.tov) as tov,
               SUM(pb.fgm) as fgm, SUM(pb.fga) as fga,
               SUM(pb.tpm) as tpm, SUM(pb.tpa) as tpa,
               SUM(pb.ftm) as ftm, SUM(pb.fta) as fta
        FROM PeriodBoxscores pb
        JOIN Matches m ON pb.match_id = m.match_id
        WHERE pb.team_id = ? AND m.gender = ?
          AND (? = 'all' OR pb.tournament_id = ?)
        GROUP BY pb.player_id, pb.period
    `, [id, G, urlTourney, urlTourney]);

    // Aggregate helpers
    const S = (k) => activeTMS.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    const A = (k) => n > 0 ? (S(k) / n).toFixed(1) : '—';
    const P = (m, a) => calculatePct(m, a).toFixed(1);

    const wins = activeTMS.filter(m => m.team_score > m.opp_score).length;
    const losses = n - wins;
    const avgPts  = A('pts');
    const avgOpp  = n > 0 ? (activeTMS.reduce((a, r) => a + (Number(r.opp_score) || 0), 0) / n).toFixed(1) : '—';

    // Shooting from accumulated team stats
    const fgm = S('fgm'), fga = S('fga');
    const tpm = S('tpm'), tpa = S('tpa');
    const ftm = S('ftm'), fta = S('fta');
    const fgPct = P(fgm, fga);
    const tpPct = P(tpm, tpa);
    const ftPct = P(ftm, fta);

    const netRtg = n > 0 ? (S('netrtg') / n).toFixed(1) : '—';

    // ── Tournament Splits (always show all, regardless of filter)
    const allTMS = tms; // all games before gender filter... wait, tms is already filtered by urlTourney
    // Need unfiltered tournament splits — query separately
    const tournamentSplits = await query(`
        SELECT tour.name as tourney_name, tour.short_name,
               COUNT(*) as gp,
               SUM(CASE WHEN
                   (CASE WHEN m.home_team_id = ? THEN m.home_score ELSE m.away_score END) >
                   (CASE WHEN m.home_team_id = ? THEN m.away_score ELSE m.home_score END)
               THEN 1 ELSE 0 END) as wins,
               ROUND(AVG(tms.pts), 1) as avg_pts,
               ROUND(AVG(tms.reb), 1) as avg_reb,
               ROUND(AVG(tms.ast), 1) as avg_ast,
               ROUND(SUM(tms.fgm)*100.0/NULLIF(SUM(tms.fga),0), 1) as fg_pct,
               ROUND(SUM(tms.tpm)*100.0/NULLIF(SUM(tms.tpa),0), 1) as tp_pct,
               ROUND(SUM(tms.ftm)*100.0/NULLIF(SUM(tms.fta),0), 1) as ft_pct,
               ROUND(AVG(tms.netrtg), 1) as net_rtg
        FROM TeamMatchStats tms
        JOIN Matches m ON tms.match_id = m.match_id
        JOIN Tournaments tour ON tms.tournament_id = tour.id
        WHERE tms.team_id = ? AND m.gender = ?
        GROUP BY tms.tournament_id
        ORDER BY tms.tournament_id DESC
    `, [id, id, id, G]);

    // ── Head-to-Head records
    const h2h = await query(`
        SELECT opp.name as opp_name, opp.id as opp_id,
               COUNT(*) as gp,
               SUM(CASE WHEN
                   (CASE WHEN m.home_team_id = ? THEN m.home_score ELSE m.away_score END) >
                   (CASE WHEN m.home_team_id = ? THEN m.away_score ELSE m.home_score END)
               THEN 1 ELSE 0 END) as wins
        FROM Matches m
        JOIN Teams opp ON opp.id = (CASE WHEN m.home_team_id = ? THEN m.away_team_id ELSE m.home_team_id END)
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.gender = ?
          AND (? = 'all' OR m.tournament_id = ?)
        GROUP BY opp.id
        ORDER BY gp DESC, wins DESC
    `, [id, id, id, id, id, G, urlTourney, urlTourney]);

    // Form guide (last 10)
    const formGuide = activeTMS.slice(0, 10).map(m => m.team_score > m.opp_score ? 'W' : 'L').reverse();

    // Stat leaders
    const PL = (k) => activeRoster.length > 0 ? activeRoster.reduce((a, b) => +a[k] > +b[k] ? a : b) : null;
    const ptsLeader = PL('ppg');
    const rebLeader = PL('rpg');
    const astLeader = PL('apg');

    const href = (o = {}) => `/teams/${id}?gender=${o.gender ?? activeTab}&tourney=${o.tourney ?? urlTourney}`;
    const O = 'var(--tappa-orange)';
    const OHex = '#d16b07';

    const buildMatch = (m) => ({
        match_id: m.match_id,
        won: m.team_score > m.opp_score,
        own_name: team.name,
        opp_name: m.opp_name,
        tourney_name: m.tourney_name,
        team_pts: m.team_score,
        opp_pts: m.opp_score,
        match_date: m.match_date,
        stage: m.stage,
    });

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '5rem', maxWidth: '1400px', margin: '0 auto' }}>

            {/* ═══ HERO ═══ */}
            <div className="glass-card" style={{
                marginBottom: '1.5rem', padding: 0, overflow: 'hidden',
                borderLeft: `5px solid ${OHex}`,
                background: 'linear-gradient(130deg, var(--dark-panel) 0%, #130d05 100%)',
                position: 'relative',
            }}>
                <div style={{ position: 'absolute', top: '-60px', left: '-50px', width: '400px', height: '350px', background: OHex, filter: 'blur(120px)', opacity: 0.1, pointerEvents: 'none' }} />
                <div className="flex-row gap-lg" style={{ padding: '2.5rem 3rem', position: 'relative' }}>
                    <div style={{ filter: `drop-shadow(0 0 24px ${OHex}40)`, flexShrink: 0 }}>
                        <TeamLogo teamName={team.name} width={90} height={90} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.62rem', color: O, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Indian Basketball</div>
                        <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}>
                            {team.name}
                        </h1>
                        {/* Form dots */}
                        {formGuide.length > 0 && (
                            <div className="flex-row gap-sm" style={{ marginTop: '0.85rem' }}>
                                <span className="text-xs-caps" style={{ fontSize: '0.58rem', marginRight: '4px', letterSpacing: '1px' }}>Form</span>
                                {formGuide.map((r, i) => (
                                    <div key={i} style={{
                                        width: '22px', height: '22px', borderRadius: '50%',
                                        background: r === 'W' ? 'var(--success)' : 'var(--danger)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.6rem', fontWeight: 900, color: 'white'
                                    }}>{r}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* W - L block */}
                    <div style={{ display: 'flex', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ padding: '1.5rem 2.5rem', textAlign: 'center', background: 'rgba(34,197,94,0.07)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--success)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{wins}</div>
                            <div className="text-xs-caps" style={{ marginTop: '0.3rem' }}>Wins</div>
                        </div>
                        <div style={{ padding: '1.5rem 2.5rem', textAlign: 'center', background: 'rgba(239,68,68,0.07)' }}>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--danger)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{losses}</div>
                            <div className="text-xs-caps" style={{ marginTop: '0.3rem' }}>Losses</div>
                        </div>
                    </div>
                    {/* Gender tabs */}
                    {isDualGender && (
                        <div className="flex-row gap-xs" style={{ flexShrink: 0 }}>
                            {[{ l: "Men's", v: 'M' }, { l: "Women's", v: 'W' }].map(g => (
                                <Link key={g.v} href={href({ gender: g.v, tourney: 'all' })} prefetch={false} style={{
                                    padding: '0.4rem 1rem', borderRadius: '7px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
                                    background: activeTab === g.v ? OHex : 'rgba(255,255,255,0.05)',
                                    color: activeTab === g.v ? 'white' : 'var(--text-muted)',
                                    border: `1px solid ${activeTab === g.v ? OHex : 'var(--border-glass)'}`,
                                }}>{g.l}</Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ TOURNAMENT DROPDOWN ═══ */}
            {genderTourneys.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <TournamentDropdown
                        teamId={id}
                        gender={activeTab}
                        tournaments={genderTourneys}
                        currentTourney={String(urlTourney)}
                    />
                </div>
            )}

            {n > 0 ? <>

                {/* ═══ KEY METRICS ROW ═══ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--border-glass)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                    {[
                        { l: 'Pts / Game', v: avgPts, c: O },
                        { l: 'Opp Pts / Game', v: avgOpp, c: 'var(--danger)' },
                        { l: 'Reb / Game', v: A('reb'), c: 'white' },
                        { l: 'Ast / Game', v: A('ast'), c: 'var(--success)' },
                        { l: 'Net Rtg', v: netRtg === '—' ? '—' : (parseFloat(netRtg) >= 0 ? `+${netRtg}` : netRtg), c: parseFloat(netRtg) > 0 ? 'var(--success)' : parseFloat(netRtg) < 0 ? 'var(--danger)' : 'white' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--dark-panel)', padding: '1.25rem 1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.4rem' }}>{s.l}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.c, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{s.v}</div>
                        </div>
                    ))}
                </div>

                {/* ═══ SHOOTING RINGS ═══ */}
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '2rem', marginBottom: '1.5rem' }}>
                    {fgPct && <RingChart pct={fgPct} color={OHex} label="Field Goal %" sublabel={`${fgm}/${fga}`} />}
                    {tpPct && <RingChart pct={tpPct} color="var(--stat-reb)" label="3-Point %" sublabel={`${tpm}/${tpa}`} />}
                    {ftPct && <RingChart pct={ftPct} color="var(--badge-td)" label="Free Throw %" sublabel={`${ftm}/${fta}`} />}
                </div>

                {/* ═══ TOURNAMENT SPLITS TABLE ═══ */}
                {tournamentSplits.length > 1 && (
                    <>
                        <h2>Tournament Breakdown</h2>
                        <div className="data-table-container" style={{ marginBottom: '2rem' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="left-align">Tournament</th>
                                        <th>GP</th>
                                        <th>W–L</th>
                                        <th>Win%</th>
                                        <th>PPG</th>
                                        <th>RPG</th>
                                        <th>APG</th>
                                        <th>FG%</th>
                                        <th>3P%</th>
                                        <th>FT%</th>
                                        <th>Net Rtg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tournamentSplits.map((t, i) => {
                                        const l = t.gp - t.wins;
                                        const wpct = t.gp > 0 ? ((t.wins / t.gp) * 100).toFixed(0) : '—';
                                        const nr = t.net_rtg != null ? (parseFloat(t.net_rtg) >= 0 ? `+${t.net_rtg}` : t.net_rtg) : '—';
                                        return (
                                            <tr key={i} className={i === 0 ? '' : ''}>
                                                <td className="left-align" style={{ fontWeight: 700 }}>{t.tourney_name}</td>
                                                <td>{t.gp}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{t.wins}–{l}</td>
                                                <td className={wpct >= 50 ? 'leader' : ''} style={{ color: parseInt(wpct) >= 50 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{wpct}%</td>
                                                <td className="leader">{t.avg_pts}</td>
                                                <td>{t.avg_reb}</td>
                                                <td>{t.avg_ast}</td>
                                                <td>{t.fg_pct != null ? `${t.fg_pct}%` : '—'}</td>
                                                <td>{t.tp_pct != null ? `${t.tp_pct}%` : '—'}</td>
                                                <td>{t.ft_pct != null ? `${t.ft_pct}%` : '—'}</td>
                                                <td style={{ color: parseFloat(t.net_rtg) > 0 ? 'var(--success)' : parseFloat(t.net_rtg) < 0 ? 'var(--danger)' : 'white', fontWeight: 700 }}>{nr}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}



                {/* ═══ STAT LEADERS ═══ */}
                {(ptsLeader || rebLeader || astLeader) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                        {[
                            { role: 'Scoring Leader', p: ptsLeader, stat: ptsLeader?.ppg, unit: 'PPG', c: OHex },
                            { role: 'Rebound Leader', p: rebLeader, stat: rebLeader?.rpg, unit: 'RPG', c: 'var(--stat-reb)' },
                            { role: 'Assists Leader', p: astLeader, stat: astLeader?.apg, unit: 'APG', c: 'var(--badge-td)' },
                        ].map((l, i) => l.p && (
                            <Link key={i} href={`/players/${l.p.player_id}`} style={{ textDecoration: 'none' }}>
                                <div className="glass-card hover-glow flex-row gap-md" style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${l.c}`, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4.5rem', fontWeight: 900, color: l.c, opacity: 0.06, fontFamily: "'Outfit', sans-serif", lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>{Number(l.stat).toFixed(0)}</div>
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(l.p.name)}&background=1a1a1a&color=fff&size=128&font-size=0.35&bold=true`}
                                        alt={l.p.name}
                                        style={{ width: '52px', height: '52px', borderRadius: '50%', border: `2px solid ${l.c}`, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="text-xs-caps">{l.role}</div>
                                        <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{l.p.name}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{l.p.gp} games</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 900, color: l.c, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{Number(l.stat).toFixed(1)}</div>
                                        <div className="text-xs-caps">{l.unit}</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ═══ ROSTER ═══ */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2>Roster</h2>
                    <RosterTable roster={activeRoster} periodData={activePeriodData} />
                </div>


                {/* ═══ RESULTS ═══ */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2>Results</h2>
                    {urlTourney === 'all' ? (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            {activeTMS.slice(0, 10).map(m => <MatchCard key={m.match_id} match={buildMatch(m)} />)}
                            {!activeTMS.length && (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: 'span 2' }}>No results.</div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            {activeTMS.map(m => <MatchCard key={m.match_id} match={buildMatch(m)} />)}
                            {!activeTMS.length && (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: 'span 2' }}>No results for this tournament.</div>
                            )}
                        </div>
                    )}
                </div>


                {/* ═══ HEAD TO HEAD (bottom) ═══ */}
                {h2h.length > 0 && (
                    <div>
                        <h2>Head-to-Head vs Other States</h2>
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="left-align">Opponent</th>
                                        <th>GP</th>
                                        <th>W</th>
                                        <th>L</th>
                                        <th>Win%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {h2h.map((r, i) => {
                                        const l = r.gp - r.wins;
                                        const wpct = r.gp > 0 ? ((r.wins / r.gp) * 100).toFixed(0) : '0';
                                        const dominated = r.wins === r.gp;
                                        const lost_all = r.wins === 0;
                                        return (
                                            <tr key={i} className={dominated ? 'top-performer' : ''}>
                                                <td className="left-align" style={{ fontWeight: 700 }}>
                                                    <Link href={`/teams/${r.opp_id}`} className="flex-row gap-sm" style={{ color: 'white', textDecoration: 'none' }}>
                                                        <TeamLogo teamName={r.opp_name} width={24} height={24} />
                                                        {r.opp_name}
                                                    </Link>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>{r.gp}</td>
                                                <td style={{ color: 'var(--success)', fontWeight: 700 }}>{r.wins}</td>
                                                <td style={{ color: l > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: l > 0 ? 700 : 400 }}>{l}</td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                                                        background: dominated ? 'rgba(34,197,94,0.15)' : lost_all ? 'rgba(239,68,68,0.12)' : 'transparent',
                                                        color: parseInt(wpct) >= 50 ? 'var(--success)' : 'var(--danger)',
                                                    }}>{wpct}%</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </> : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No data available. Try selecting a different tournament or gender.
                </div>
            )}
        </div>
    );
}
