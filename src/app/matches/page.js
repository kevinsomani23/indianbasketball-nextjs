import { query } from '@/lib/db';
import Link from 'next/link';
import MatchList from '@/components/MatchList';

export const metadata = {
    title: 'Tournaments | Indian Basketball',
};

export default async function MatchesIndex({ searchParams }) {
    const sp = await searchParams;
    const tourneyFilter = sp.tournament || '';

    // Fetch tournaments with match counts
    const tournaments = await query(`
        SELECT t.id, t.name, t.gender, COUNT(m.match_id) as match_count
        FROM Tournaments t
        LEFT JOIN Matches m ON m.tournament_id = t.id
        GROUP BY t.id
        ORDER BY t.name DESC
    `);

    const activeFilter = tourneyFilter || (tournaments.length > 0 ? tournaments[0].id.toString() : '');

    // Group by edition: "75TH Senior National" → { Men: {...}, Women: {...} }
    const editions = {};
    for (const t of tournaments) {
        // Extract edition name (everything before " Men" or " Women")
        const edition = t.name.replace(/ (Men|Women)$/, '');
        if (!editions[edition]) editions[edition] = [];
        editions[edition].push(t);
    }
    // Sort editions descending (75th before 74th)
    const sortedEditions = Object.entries(editions).sort(([a], [b]) => b.localeCompare(a));

    return (
        <div style={{ backgroundColor: 'var(--dark-bg)', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

                {/* ── Left Sidebar ── */}
                <div style={{ width: '240px', flexShrink: 0, position: 'sticky', top: '80px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '1rem', fontFamily: 'Space Grotesk' }}>
                        Browse Events
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {sortedEditions.map(([edition, divs]) => {
                            // sort Women first (alphabetical desc)
                            const sorted = [...divs].sort((a, b) => b.gender?.localeCompare(a.gender || '') || 0);
                            return (
                                <div key={edition}>
                                    {/* Edition heading */}
                                    <div style={{
                                        fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                                        fontFamily: 'Space Grotesk', marginBottom: '6px',
                                        paddingLeft: '4px', letterSpacing: '0.01em'
                                    }}>
                                        {edition}
                                    </div>

                                    {/* Gender tabs */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {sorted.map(t => {
                                            const isActive = activeFilter === t.id.toString();
                                            const isWomen = t.gender === 'Women';
                                            const accentColor = isWomen ? '#ec4899' : 'var(--tappa-orange)';

                                            return (
                                                <Link
                                                    key={t.id}
                                                    href={`/matches?tournament=${t.id}`}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '9px 12px',
                                                        borderRadius: '8px',
                                                        textDecoration: 'none',
                                                        background: isActive ? `rgba(${isWomen ? '236,72,153' : '209,107,7'}, 0.1)` : 'transparent',
                                                        border: isActive ? `1px solid rgba(${isWomen ? '236,72,153' : '209,107,7'}, 0.25)` : '1px solid transparent',
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                                                            background: isActive ? accentColor : 'rgba(255,255,255,0.15)',
                                                            transition: 'background 0.15s'
                                                        }} />
                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: isActive ? 700 : 400,
                                                            color: isActive ? 'white' : 'rgba(255,255,255,0.45)',
                                                            fontFamily: 'Space Grotesk',
                                                            transition: 'color 0.15s'
                                                        }}>
                                                            {t.gender || 'All'}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{
                                                            fontSize: '0.68rem', fontWeight: 600,
                                                            color: isActive ? accentColor : 'rgba(255,255,255,0.2)',
                                                            fontFamily: 'Space Grotesk',
                                                            background: isActive ? `rgba(${isWomen ? '236,72,153' : '209,107,7'}, 0.08)` : 'transparent',
                                                            padding: '1px 6px', borderRadius: '10px',
                                                            transition: 'all 0.15s'
                                                        }}>
                                                            {t.match_count}
                                                        </span>
                                                        {isActive && (
                                                            <Link
                                                                href={`/tournaments/${t.id}`}
                                                                title="Standings & Bracket"
                                                                style={{
                                                                    fontSize: '0.62rem', fontWeight: 700,
                                                                    color: accentColor, fontFamily: 'Space Grotesk',
                                                                    background: `rgba(${isWomen ? '236,72,153' : '209,107,7'}, 0.1)`,
                                                                    padding: '1px 6px', borderRadius: '6px',
                                                                    textDecoration: 'none', letterSpacing: '0.03em',
                                                                    border: `1px solid rgba(${isWomen ? '236,72,153' : '209,107,7'}, 0.2)`
                                                                }}
                                                            >
                                                                Standings
                                                            </Link>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main Content ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Active tournament title */}
                    {(() => {
                        const active = tournaments.find(t => t.id.toString() === activeFilter);
                        if (!active) return null;
                        return (
                            <div style={{ marginBottom: '1.75rem' }}>
                                <h1 style={{
                                    fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.6rem',
                                    margin: 0, letterSpacing: '-0.03em', color: 'white'
                                }}>
                                    {active.name}
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '4px', fontFamily: 'Space Grotesk' }}>
                                    {active.match_count} matches · Senior National Basketball Championship
                                </p>
                            </div>
                        );
                    })()}
                    <MatchList tourneyFilter={activeFilter} />
                </div>
            </div>
        </div>
    );
}
