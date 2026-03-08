'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function BoxscoreTabs({ teamA, teamB }) {
    const [activeTab, setActiveTab] = useState('A');

    const activeTeam = activeTab === 'A' ? teamA : teamB;

    const pct = (m, a) => (a > 0 ? ((m / a) * 100).toFixed(1) : '-');

    const tObj = activeTeam.boxscores.reduce((s, b) => {
        s.reb += b.reb; s.ast += b.ast; s.stl += b.stl; s.blk += b.blk; s.tov += b.tov;
        s.fgm += b.fgm; s.fga += b.fga; s.tpm += b.tpm; s.tpa += b.tpa; s.ftm += b.ftm; s.fta += b.fta;
        return s;
    }, { reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

    return (
        <div style={{ marginTop: '0rem' }}>
            {/* Massive Scoreboard Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                    onClick={() => setActiveTab('A')}
                    style={{
                        flex: 1,
                        padding: '1.5rem',
                        background: activeTab === 'A' ? 'var(--tappa-orange)' : 'rgba(255,255,255,0.02)',
                        color: activeTab === 'A' ? '#000' : 'white',
                        border: activeTab === 'A' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: activeTab === 'A' ? '0 10px 25px rgba(209, 107, 7, 0.3)' : 'none'
                    }}
                >
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{teamA.name}</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-2px' }}>{teamA.score}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('B')}
                    style={{
                        flex: 1,
                        padding: '1.5rem',
                        background: activeTab === 'B' ? 'var(--tappa-orange)' : 'rgba(255,255,255,0.02)',
                        color: activeTab === 'B' ? '#000' : 'white',
                        border: activeTab === 'B' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: activeTab === 'B' ? '0 10px 25px rgba(209, 107, 7, 0.3)' : 'none'
                    }}
                >
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{teamB.name}</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-2px' }}>{teamB.score}</span>
                </button>
            </div>

            {/* Table */}
            <div className="data-table-container" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '950px' }}>
                    <thead>
                        <tr>
                            <th className="left-align" style={{ width: '25%' }}>Player</th>
                            <th>Pos</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TOV</th>
                            <th>FGM</th>
                            <th>FGA</th>
                            <th>FG%</th>
                            <th>3PM</th>
                            <th>3PA</th>
                            <th>3P%</th>
                            <th>FTM</th>
                            <th>FTA</th>
                            <th>FT%</th>
                            <th>GmScr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTeam.boxscores.map(b => (
                            <tr key={b.player_id}>
                                <td className="left-align">
                                    <Link href={`/players/${b.player_id}`}><strong>{b.name}</strong></Link>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>-</td>
                                <td style={{ color: 'var(--text-muted)' }}>{b.min || '-'}</td>
                                <td className="leader">{b.pts}</td>
                                <td>{b.reb}</td>
                                <td>{b.ast}</td>
                                <td>{b.stl}</td>
                                <td>{b.blk}</td>
                                <td>{b.tov}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.fgm}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.fga}</td>
                                <td style={{ fontWeight: 600 }}>{pct(b.fgm, b.fga)}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.tpm}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.tpa}</td>
                                <td style={{ fontWeight: 600 }}>{pct(b.tpm, b.tpa)}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.ftm}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.fta}</td>
                                <td style={{ fontWeight: 600 }}>{pct(b.ftm, b.fta)}</td>
                                <td style={{ fontWeight: 700, color: 'white' }}>{b.gm_scr?.toFixed(1) || '-'}</td>
                            </tr>
                        ))}
                        {/* Totals Row */}
                        <tr style={{ background: 'rgba(255,133,51,0.1)', borderTop: '2px solid var(--tappa-orange)' }}>
                            <td className="left-align" style={{ fontWeight: 800, color: 'var(--tappa-orange)' }}>TEAM TOTALS</td>
                            <td></td>
                            <td>200</td>
                            <td className="leader">{activeTeam.score}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.reb}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.ast}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.stl}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.blk}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.tov}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.fgm}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.fga}</td>
                            <td style={{ fontWeight: 800 }}>{pct(tObj.fgm, tObj.fga)}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.tpm}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.tpa}</td>
                            <td style={{ fontWeight: 800 }}>{pct(tObj.tpm, tObj.tpa)}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.ftm}</td>
                            <td style={{ fontWeight: 700 }}>{tObj.fta}</td>
                            <td style={{ fontWeight: 800 }}>{pct(tObj.ftm, tObj.fta)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Profile CTA */}
            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Want to see season averages and advanced metrics for this squad?</p>
                <Link href={`/teams/${activeTeam.id}`} style={{ color: 'var(--tappa-orange)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    Explore the {activeTeam.name} Team Profile <span style={{ fontSize: '1.2rem' }}>→</span>
                </Link>
            </div>
        </div>
    );
}
