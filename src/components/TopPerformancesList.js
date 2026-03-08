'use client';

import { useState } from 'react';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';

export default function TopPerformancesList({ menData, womenData }) {
    const [gender, setGender] = useState('Men');
    const data = gender === 'Men' ? menData : womenData;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <span style={{ fontSize: '1.2rem' }}>⭐</span>
                    Featured Performances
                </h2>
                
                {/* Pill Toggle */}
                <div style={{ display: 'flex', background: 'var(--elevation-1)', padding: '4px', borderRadius: '100px', border: '1px solid var(--border-glass)' }}>
                    {['Men', 'Women'].map(g => (
                        <button
                            key={g}
                            onClick={() => setGender(g)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '100px',
                                border: 'none',
                                background: gender === g ? 'var(--tappa-orange)' : 'transparent',
                                color: gender === g ? 'black' : 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: gender === g ? '0 4px 12px var(--tappa-orange-glow)' : 'none'
                            }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.map((perf, idx) => (
                    <div 
                        key={`${perf.player_id}-${perf.match_id}`} 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: 'var(--dark-panel)', 
                            border: '1px solid var(--border-glass)', 
                            padding: '0.75rem 1.25rem', 
                            borderRadius: '16px', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }} 
                        className="perf-card hover-glow"
                    >
                        {/* Kinetic Background Glow on Hover */}
                        <div className="card-bg-glow" />

                        <div style={{ 
                            width: '40px', 
                            color: idx < 3 ? 'var(--tappa-orange)' : 'var(--text-muted)', 
                            fontWeight: '900', 
                            fontSize: '1.4rem', 
                            fontFamily: 'Outfit',
                            fontStyle: 'italic',
                            opacity: idx < 3 ? 1 : 0.6
                        }}>
                            {idx + 1}
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1 }}>
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                                <TeamLogo teamName={perf.team_name} width={42} height={42} />
                            </div>
                            <div>
                                <Link href={`/players/${perf.player_id}`} style={{ 
                                    fontSize: '1.15rem', 
                                    fontWeight: 900, 
                                    fontStyle: 'italic', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    display: 'block', 
                                    marginBottom: '2px', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.1
                                }}>
                                    {perf.player_name}
                                </Link>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{perf.team_name}</span>
                                    <span style={{ width: '3px', height: '3px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                                    <span>{perf.tourney_name}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', gap: '1.5rem', alignItems: 'center', zIndex: 1 }}>
                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--tappa-orange)', fontFamily: 'Outfit', lineHeight: 0.9, letterSpacing: '-0.02em' }}>
                                    {perf.gm_scr > 0 ? perf.gm_scr.toFixed(1) : ((perf.pts ?? 0) + (perf.reb ?? 0) * 0.7 + (perf.ast ?? 0) * 0.7).toFixed(1)}
                                </div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '1.2px', marginTop: '4px' }}>GM SCORE</div>
                            </div>
                            
                            {/* Refined Stat Row */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '1px', 
                                background: 'var(--border-glass)', 
                                padding: '1px', 
                                borderRadius: '10px', 
                                border: '1px solid var(--border-glass)',
                                overflow: 'hidden'
                            }}>
                                {[
                                    { label: 'PTS', val: perf.pts },
                                    { label: 'REB', val: perf.reb },
                                    { label: 'AST', val: perf.ast }
                                ].map((s, i) => (
                                    <div key={i} style={{ background: 'rgba(24, 24, 27, 0.8)', padding: '6px 12px', minWidth: '45px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', fontFamily: 'Outfit' }}>{s.val}</div>
                                        <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <Link href={`/matches/${perf.match_id}`} style={{ 
                                padding: '10px 18px', 
                                background: 'white', 
                                borderRadius: '10px', 
                                fontSize: '0.7rem', 
                                fontWeight: 900, 
                                color: 'black', 
                                textDecoration: 'none', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.1em',
                                transition: 'all 0.2s ease',
                                border: '1px solid white'
                            }} className="boxscore-btn">
                                Boxscore
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .perf-card {
                    cursor: pointer;
                }
                .perf-card:hover {
                    border-color: rgba(209, 107, 7, 0.4) !important;
                    transform: scale(1.01) translateY(-2px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
                }
                .boxscore-btn:hover {
                    background: transparent !important;
                    color: white !important;
                    box-shadow: 0 0 15px rgba(255,255,255,0.2);
                }
                .card-bg-glow {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 200px;
                    height: 100%;
                    background: radial-gradient(circle at 100% 50%, rgba(209, 107, 7, 0.05) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                .perf-card:hover .card-bg-glow {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
