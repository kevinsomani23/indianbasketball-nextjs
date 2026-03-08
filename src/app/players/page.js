import { query } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PlayersGallery({ searchParams }) {
    const { gender = 'all', search = '' } = await searchParams;

    // Fetch players with their team and gender info
    // We use a subquery to get the most recent team/tournament for the player list
    let sql = `
        SELECT p.player_id, p.name, t.name as team_name, tour.gender, tour.name as tournament_name
        FROM Players p
        JOIN Teams t ON p.team_id = t.id
        JOIN Tournaments tour ON p.tournament_id = tour.id
        WHERE 1=1
    `;
    const params = [];

    if (gender !== 'all') {
        sql += ` AND tour.gender = ?`;
        params.push(gender === 'W' ? 'Women' : 'Men');
    }
    if (search) {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${search}%`);
    }

    sql += ` GROUP BY p.player_id ORDER BY p.name ASC LIMIT 100`; // Limit to 100 for performance in gallery view

    const players = await query(sql, params);

    return (
        <div className="players-gallery animate-fade-in" style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900, fontFamily: 'Outfit' }}>PLAYERS</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Browse the official athlete directory.</p>
                </div>
                
                <form action="/players" method="GET" style={{ display: 'flex', gap: '8px' }}>
                    <input 
                        name="search" 
                        defaultValue={search}
                        placeholder="Search players..." 
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', width: '250px' }}
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
                    <button type="submit" style={{ padding: '8px 16px', background: 'var(--tappa-orange)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Search</button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {players.map(p => (
                    <Link key={p.player_id} href={`/players/${p.player_id}`} style={{ textDecoration: 'none' }}>
                        <div className="glass-card player-card" style={{ padding: '1.5rem', textAlign: 'center', transition: 'all 0.2s', height: '100%', position: 'relative', overflow: 'hidden' }}>
                            {/* Gender Indicator Strip */}
                            <div style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                height: '4px', 
                                background: p.gender === 'Women' ? '#ec4899' : 'var(--tappa-orange)' 
                            }} />

                            <div style={{ 
                                width: '70px', 
                                height: '70px', 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '50%', 
                                margin: '0.5rem auto 1rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '1.5rem', 
                                fontWeight: 900, 
                                color: 'rgba(255,255,255,0.2)', 
                                border: '1px solid rgba(255,255,255,0.05)' 
                            }}>
                                {p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'white', fontWeight: 700 }}>{p.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.team_name}</p>
                            
                            <div style={{ 
                                marginTop: '1rem', 
                                fontSize: '0.65rem', 
                                color: p.gender === 'Women' ? '#ec4899' : 'var(--tappa-orange)', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em', 
                                fontWeight: 800 
                            }}>
                                {p.gender === 'Women' ? "Women's" : "Men's"}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {players.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                    No players found matching your search.
                </div>
            )}
            
            <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                Showing top 100 results. Use filters for specific players.
            </div>
        </div>
    );
}
