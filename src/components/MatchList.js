import { query } from '@/lib/db';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

const sanitizeFilename = (name) => name.replace(/[^\w\s-]/g, '').trim();

export default async function MatchList({ tourneyFilter }) {
    let queryStr = `
        SELECT m.match_id, m.match_date, m.stage, m.gender,
               m.home_team_id, m.away_team_id,
               ta.name as team_a_name, tb.name as team_b_name,
               (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = m.home_team_id) as team_a_pts,
               (SELECT SUM(pts) FROM Boxscores WHERE match_id = m.match_id AND team_id = m.away_team_id) as team_b_pts
        FROM Matches m
        JOIN Teams ta ON m.home_team_id = ta.id
        JOIN Teams tb ON m.away_team_id = tb.id
        WHERE 1=1
    `;
    const params = [];
    if (tourneyFilter) {
        queryStr += ` AND m.tournament_id = ?`;
        params.push(tourneyFilter);
    } else {
        queryStr += ` AND m.tournament_id = (SELECT id FROM Tournaments ORDER BY id DESC LIMIT 1)`;
    }
    queryStr += ` ORDER BY m.match_id ASC LIMIT 200`;
    const matches = await query(queryStr, params);

    // Group: gender → stage
    const grouped = matches.reduce((acc, m) => {
        const g = m.gender || 'Men';
        if (!acc[g]) acc[g] = {};
        const s = m.stage || 'Round Robin';
        if (!acc[g][s]) acc[g][s] = [];
        acc[g][s].push(m);
        return acc;
    }, {});

    const stageOrder = { 'Final': 1, '3rd Place': 2, 'SF': 3, '5-8 Place': 4, 'QF': 5, 'Pre QF': 6, 'Pool A': 7, 'Pool B': 8, 'Round Robin': 9 };
    const sortStages = (a, b) => (stageOrder[a] || 99) - (stageOrder[b] || 99);

    const stageLabel = {
        'Final': 'Final', '3rd Place': '3rd Place', 'SF': 'Semi-Finals',
        '5-8 Place': '5th–8th Place', 'QF': 'Quarter-Finals',
        'Pre QF': 'Pre Quarter-Finals', 'Pool A': 'Pool A', 'Pool B': 'Pool B', 'Round Robin': 'Round Robin'
    };

    const logoDir = path.join(process.cwd(), 'public', 'logos');
    const getLogo = (name) => {
        if (!name) return <div style={{ width: 20, height: 20, borderRadius: '4px', background: '#1e2025', flexShrink: 0 }} />;
        const clean = sanitizeFilename(name);
        if (fs.existsSync(path.join(logoDir, `${clean}.jpg`))) {
            return <img src={`/logos/${clean}.jpg`} alt={name} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />;
        }
        return (
            <div style={{ width: 20, height: 20, borderRadius: '4px', background: '#1e2025', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#555', fontWeight: 700, flexShrink: 0 }}>
                {name.charAt(0)}
            </div>
        );
    };

    const fmtDate = (d) => {
        if (!d) return '';
        const parts = String(d).split('-');
        if (parts.length === 3) {
            const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (!isNaN(dt)) return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
        return String(d);
    };

    if (matches.length === 0) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.2 }}>🏀</div>
            No matches found.
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {Object.keys(grouped).sort().reverse().map((gender) => (
                <div key={gender}>
                    {/* Gender divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{
                            fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em',
                            textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px',
                            background: gender === 'Women' ? 'rgba(236,72,153,0.12)' : 'rgba(209,107,7,0.12)',
                            color: gender === 'Women' ? 'var(--women-accent)' : 'var(--tappa-orange)',
                            border: `1px solid ${gender === 'Women' ? 'rgba(236,72,153,0.25)' : 'rgba(209,107,7,0.25)'}`,
                            fontFamily: 'Space Grotesk'
                        }}>
                            {gender}&apos;s
                        </span>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    {/* Stages */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {Object.keys(grouped[gender]).sort(sortStages).map((stage) => {
                            const stageMatches = grouped[gender][stage];
                            const isFinal = stage === 'Final';
                            const isMedal = stage === 'Final' || stage === '3rd Place';

                            return (
                                <div key={stage} style={{ marginBottom: '0.5rem' }}>
                                    {/* Stage header */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px',
                                        borderLeft: `2px solid ${isFinal ? 'var(--tappa-orange)' : isMedal ? '#7c6b3f' : 'rgba(255,255,255,0.08)'}`,
                                        marginBottom: '4px',
                                    }}>
                                        <span style={{
                                            fontSize: '0.78rem', fontWeight: 700,
                                            color: isFinal ? 'var(--tappa-orange)' : isMedal ? 'var(--medal-gold)' : 'rgba(255,255,255,0.45)',
                                            fontFamily: 'Space Grotesk',
                                            letterSpacing: '0.03em'
                                        }}>
                                            {isFinal && '🏆 '}{stageLabel[stage] || stage}
                                        </span>
                                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'Space Grotesk' }}>
                                            {stageMatches.length} match{stageMatches.length !== 1 ? 'es' : ''}
                                        </span>
                                    </div>

                                    {/* Match rows in a glass card */}
                                    <div style={{
                                        background: 'rgba(255,255,255,0.025)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(4px)',
                                    }}>
                                        {stageMatches.map((m, idx) => {
                                            const aWon = (m.team_a_pts ?? 0) > (m.team_b_pts ?? 0);
                                            const bWon = (m.team_b_pts ?? 0) > (m.team_a_pts ?? 0);
                                            const dateStr = fmtDate(m.match_date);
                                            const isLast = idx === stageMatches.length - 1;

                                            return (
                                                <Link
                                                    key={m.match_id}
                                                    href={`/matches/${m.match_id}${tourneyFilter ? `?tournament=${tourneyFilter}` : ''}`}
                                                    className="match-row-hover"
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '52px 1fr auto 1fr 32px',
                                                        alignItems: 'center',
                                                        padding: '10px 16px',
                                                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                                        textDecoration: 'none',
                                                        gap: '8px',
                                                        transition: 'background 0.15s',
                                                    }}
                                                >
                                                    {/* Date */}
                                                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)', fontFamily: 'Space Grotesk', letterSpacing: '0.02em' }}>
                                                        {dateStr}
                                                    </span>

                                                    {/* Team A — right-aligned */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <span style={{
                                                            fontFamily: 'Space Grotesk', fontWeight: aWon ? 700 : 400,
                                                            color: aWon ? '#ffffff' : '#4a4f58',
                                                            fontSize: '0.9rem',
                                                        }}>
                                                            {m.team_a_name}
                                                        </span>
                                                        {getLogo(m.team_a_name)}
                                                    </div>

                                                    {/* Score */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        minWidth: '90px', justifyContent: 'center',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        borderRadius: '6px',
                                                        padding: '3px 10px',
                                                    }}>
                                                        <span style={{
                                                            fontFamily: 'Outfit', fontWeight: 800,
                                                            color: aWon ? '#ffffff' : '#3a3f47',
                                                            fontSize: '1.05rem', minWidth: '28px', textAlign: 'right',
                                                            letterSpacing: '-0.02em'
                                                        }}>
                                                            {m.team_a_pts ?? '-'}
                                                        </span>
                                                        <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.8rem', margin: '0 2px' }}>:</span>
                                                        <span style={{
                                                            fontFamily: 'Outfit', fontWeight: 800,
                                                            color: bWon ? '#ffffff' : '#3a3f47',
                                                            fontSize: '1.05rem', minWidth: '28px', textAlign: 'left',
                                                            letterSpacing: '-0.02em'
                                                        }}>
                                                            {m.team_b_pts ?? '-'}
                                                        </span>
                                                    </div>

                                                    {/* Team B — left-aligned */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {getLogo(m.team_b_name)}
                                                        <span style={{
                                                            fontFamily: 'Space Grotesk', fontWeight: bWon ? 700 : 400,
                                                            color: bWon ? '#ffffff' : '#4a4f58',
                                                            fontSize: '0.9rem',
                                                        }}>
                                                            {m.team_b_name}
                                                        </span>
                                                    </div>

                                                    {/* Chevron */}
                                                    <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.75rem', textAlign: 'right' }}>›</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
