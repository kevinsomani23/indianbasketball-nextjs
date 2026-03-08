'use client';

import Link from 'next/link';

export default function BoxscoreHeader({ 
    teamName, 
    teamId, 
    isWinner, 
    showAdvanced, 
    setShowAdvanced, 
    selectedPeriod, 
    setSelectedPeriod, 
    displayPeriods,
    currentScore
}) {
    return (
        <div className="flex-between" style={{
            marginBottom: '0.35rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
            <div className="flex-row gap-sm">
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                    <Link href={`/teams/${teamId}`} className="team-link">{teamName}</Link>
                </h2>
                {isWinner && (
                    <span style={{ fontSize: '0.65rem', background: 'var(--tappa-orange)', color: '#fff', padding: '2px 7px', borderRadius: '20px', fontWeight: 700, fontFamily: 'Space Grotesk', letterSpacing: '0.05em' }}>WIN</span>
                )}
            </div>

            <div className="flex-row gap-sm">
                {/* Advanced toggle */}
                <button onClick={() => setShowAdvanced(v => !v)} style={{
                    padding: '3px 10px', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer',
                    background: showAdvanced ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: showAdvanced ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    fontFamily: 'Space Grotesk', transition: 'all 0.2s',
                }}>
                    Advanced
                </button>

                {/* Period tabs */}
                <div className="flex-row" style={{ gap: '3px', backgroundColor: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '7px' }}>
                    {displayPeriods.map(p => (
                        <button key={p} onClick={() => setSelectedPeriod(p)} style={{
                            padding: '4px 11px', border: 'none', borderRadius: '5px',
                            background: selectedPeriod === p ? 'var(--tappa-orange)' : 'transparent',
                            color: selectedPeriod === p ? '#fff' : 'var(--text-muted)',
                            fontWeight: selectedPeriod === p ? 700 : 500,
                            cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.2s ease'
                        }}>{p}</button>
                    ))}
                </div>

                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit', color: isWinner ? 'var(--tappa-orange)' : 'rgba(255,255,255,0.5)', minWidth: '48px', textAlign: 'right' }}>
                    {currentScore}
                </div>
            </div>
        </div>
    );
}
