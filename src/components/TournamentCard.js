'use client';

import Link from 'next/link';

export default function TournamentCard({ tournament }) {
    const isWomen = tournament.gender === 'Women';
    const accentColor = isWomen ? 'var(--women-accent)' : 'var(--tappa-orange)';
    const gradient = `linear-gradient(135deg, ${isWomen ? 'rgba(236,72,153,0.12)' : 'rgba(209,107,7,0.12)'} 0%, rgba(0,0,0,0) 70%)`;

    return (
        <Link href={`/matches?tournament=${tournament.id}`} style={{ textDecoration: 'none' }}>
            <div 
                className="tournament-card"
                style={{
                    minWidth: '280px',
                    width: '300px',
                    height: '140px',
                    background: 'var(--bg-glass)',
                    backgroundImage: gradient,
                    border: '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}
            >
                {/* Decorative Accent Bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: accentColor }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: accentColor, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>NATIONAL CHAMPIONSHIP</span>
                            <span style={{ background: accentColor, color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '0.6rem' }}>
                                {tournament.gender?.toUpperCase() || 'MEN'}
                            </span>
                        </div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                            {tournament.name}
                        </h3>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TEAMS</div>
                        <div style={{ fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>{tournament.team_count || 0}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GAMES</div>
                        <div style={{ fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>{tournament.match_count || 0}</div>
                    </div>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', color: 'var(--tappa-orange)' }}>
                        <span style={{ fontSize: '1.2rem' }}>→</span>
                    </div>
                </div>

            </div>
            
            <style jsx>{`
                .tournament-card:hover {
                    transform: translateY(-4px) scale(1.02);
                    border-color: rgba(255,255,255,0.2) !important;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
                }
            `}</style>
        </Link>
    );
}
