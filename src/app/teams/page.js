import { query } from '@/lib/db';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';

export const dynamic = 'force-dynamic';

export default async function TeamsPage({ searchParams }) {
    const { gender = 'all', search = '' } = await searchParams;

    // 1. Get ALL unique team-gender-tournament combinations from Matches
    // This is more reliable than the Teams table which is missing many gender entries.
    let sql = `
        SELECT DISTINCT 
            t.id, 
            t.name, 
            tour.gender,
            tour.id as tour_id
        FROM Teams t
        JOIN Matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
        JOIN Tournaments tour ON m.tournament_id = tour.id
        WHERE 1=1
    `;
    const params = [];

    if (gender !== 'all') {
        sql += ` AND tour.gender = ?`;
        params.push(gender === 'W' ? 'Women' : 'Men');
    }
    if (search) {
        sql += ` AND t.name LIKE ?`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY t.name ASC, tour_id DESC`;
    const teams = await query(sql, params);

    // 2. Group by Name
    // Note: In this DB, "Delhi" (Men) and "Delhi" (Women) use the SAME team.id
    const groupedTeams = teams.reduce((acc, team) => {
        const baseName = team.name.replace(/ Men$| Women$/i, '').trim();
        if (!acc[baseName]) {
            acc[baseName] = { name: baseName, genderSplits: {} };
        }
        
        // Use gender as the key to show both buttons
        if (!acc[baseName].genderSplits[team.gender]) {
            acc[baseName].genderSplits[team.gender] = team;
        }
        return acc;
    }, {});

    const stateList = Object.values(groupedTeams);

    return (
        <div className="teams-index animate-fade-in" style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900, fontFamily: 'Outfit' }}>STATE TEAMS</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Explore state organizations and their historical data.</p>
                </div>
                
                <form action="/teams" method="GET" style={{ display: 'flex', gap: '8px' }}>
                    <input 
                        name="search" 
                        defaultValue={search}
                        placeholder="Search states..." 
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white', fontSize: '0.9rem' }}
                    />
                    <select 
                        name="gender" 
                        defaultValue={gender}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white', fontSize: '0.9rem' }}
                    >
                        <option value="all">All Genders</option>
                        <option value="M">Men</option>
                        <option value="W">Women</option>
                    </select>
                    <button type="submit" style={{ padding: '8px 16px', background: 'var(--tappa-orange)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Filter</button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {stateList.map(state => (
                    <div key={state.name} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {/* State Logo */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <TeamLogo teamName={state.name} width={100} height={100} />
                        </div>

                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: 'white', fontWeight: 800 }}>{state.name}</h3>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['Men', 'Women'].map(gender => {
                                const div = state.genderSplits[gender];
                                if (!div) {
                                    return (
                                        <div 
                                            key={gender}
                                            style={{ 
                                                padding: '12px 16px', 
                                                background: 'rgba(255,255,255,0.01)', 
                                                borderRadius: '12px', 
                                                color: 'rgba(255,255,255,0.15)', 
                                                fontSize: '0.9rem', 
                                                fontWeight: 700,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                border: '1px dashed rgba(255,255,255,0.05)',
                                                cursor: 'not-allowed'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                                                <span>{gender}&apos;s</span>
                                            </div>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>UNRANKED</span>
                                        </div>
                                    );
                                }
                                return (
                                    <Link 
                                        key={gender} 
                                        href={`/teams/${div.id}?gender=${gender === 'Women' ? 'W' : 'M'}`} 
                                        style={{ 
                                            textDecoration: 'none', 
                                            padding: '12px 16px', 
                                            background: 'rgba(255,255,255,0.03)', 
                                            borderRadius: '12px', 
                                            color: 'white', 
                                            fontSize: '0.9rem', 
                                            fontWeight: 700,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: `1px solid rgba(255,255,255,0.08)`,
                                            transition: 'all 0.2s'
                                        }}
                                        className="team-division-link"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ 
                                                width: '8px', 
                                                height: '8px', 
                                                borderRadius: '50%', 
                                                background: gender === 'Women' ? '#ec4899' : 'var(--tappa-orange)' 
                                            }} />
                                            <span>{gender}&apos;s</span>
                                        </div>
                                        <span style={{ 
                                            fontSize: '0.7rem', 
                                            fontWeight: 800,
                                            color: 'var(--text-muted)',
                                            letterSpacing: '0.05em'
                                        }}>
                                            STATS →
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {stateList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                    No teams found matching your filters.
                </div>
            )}
        </div>
    );
}
