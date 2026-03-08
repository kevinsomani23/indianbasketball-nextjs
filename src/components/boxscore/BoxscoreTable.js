'use client';

import Link from 'next/link';
import BoxscoreRow from './BoxscoreRow';

const pct = (m, a) => (a > 0 ? (m / a * 100).toFixed(1) : '-');

export default function BoxscoreTable({ 
    enriched, 
    showAdvanced, 
    sortKey, 
    sortDir, 
    handleSort, 
    teamHighs, 
    topIds, 
    selectedPeriod,
    tot,
    totScore,
    totEfg,
    totTs,
    dnpPlayers
}) {
    const Th = ({ label, skey, cls }) => {
        const active = sortKey === skey;
        return (
            <th onClick={() => skey && handleSort(skey)} className={cls}
                style={{ cursor: skey ? 'pointer' : 'default', userSelect: 'none', color: active ? 'var(--tappa-orange)' : '', whiteSpace: 'nowrap' }}>
                {label}{active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </th>
        );
    };

    return (
        <div className="data-table-container">
            <table className="data-table" style={{ width: '100%', minWidth: '820px' }}>
                <thead>
                    <tr>
                        <th style={{ width: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>No.</th>
                        <Th label="Player" cls="left-align" />
                        <Th label="MIN" skey="min" />
                        <Th label="PTS" skey="pts" />
                        <Th label="2PM" skey="pm2" />
                        <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>2PA</th>
                        <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>2P%</th>
                        <Th label="3PM" skey="tpm" />
                        <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>3PA</th>
                        <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>3P%</th>
                        <Th label="FTM" skey="ftm" />
                        <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>FTA</th>
                        <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>FT%</th>
                        <Th label="OR" skey="oreb" />
                        <Th label="DR" skey="dreb" />
                        <Th label="REB" skey="reb" />
                        <Th label="AST" skey="ast" />
                        <Th label="TO" skey="tov" />
                        <Th label="ST" skey="stl" />
                        <Th label="BS" skey="blk" />
                        <Th label="PF" skey="pf" />
                        <Th label="FD" skey="fd" />
                        <Th label="+/-" skey="pm" />
                        {showAdvanced && <>
                            <Th label="eFG%" />
                            <Th label="TS%" />
                            <Th label="GmScr" skey="gmscr" />
                        </>}
                    </tr>
                </thead>
                <tbody>
                    {enriched.map((b, i) => (
                        <BoxscoreRow 
                            key={`${b.player_id}-${i}`}
                            b={b}
                            isTop={topIds.includes(b.player_id)}
                            showAdvanced={showAdvanced}
                            selectedPeriod={selectedPeriod}
                            teamHighs={teamHighs}
                            topIds={topIds}
                        />
                    ))}
                    {/* TOTALS ROW */}
                    <tr style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <td></td>
                        <td className="left-align" style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>TOTALS</td>
                        <td></td>
                        <td className="leader" style={{ fontWeight: 800 }}>{totScore}</td>
                        <td className="split-col">{tot.pm2 ?? 0}</td>
                        <td className="split-col" style={{ color: 'var(--text-muted)' }}>{tot.pa2 ?? 0}</td>
                        <td className="pct-col">{pct(tot.pm2, tot.pa2)}</td>
                        <td className="split-col">{tot.tpm ?? 0}</td>
                        <td className="split-col" style={{ color: 'var(--text-muted)' }}>{tot.tpa ?? 0}</td>
                        <td className="pct-col">{pct(tot.tpm, tot.tpa)}</td>
                        <td className="split-col">{tot.ftm ?? 0}</td>
                        <td className="split-col" style={{ color: 'var(--text-muted)' }}>{tot.fta ?? 0}</td>
                        <td className="pct-col">{pct(tot.ftm, tot.fta)}</td>
                        <td>{tot.oreb ?? 0}</td>
                        <td>{tot.dreb ?? 0}</td>
                        <td style={{ fontWeight: 700 }}>{tot.reb ?? 0}</td>
                        <td style={{ fontWeight: 700 }}>{tot.ast ?? 0}</td>
                        <td>{tot.tov ?? 0}</td>
                        <td>{tot.stl ?? 0}</td>
                        <td>{tot.blk ?? 0}</td>
                        <td>{tot.pf ?? 0}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{tot.fd ?? 0}</td>
                        <td></td>
                        {showAdvanced && <>
                            <td className="pct-col" style={{ color: 'var(--text-muted)' }}>{totEfg}</td>
                            <td className="pct-col" style={{ color: 'var(--text-muted)' }}>{totTs}</td>
                            <td></td>
                        </>}
                    </tr>
                    {/* DNP */}
                    {dnpPlayers.length > 0 && (
                        <tr>
                            <td></td>
                            <td colSpan={100} className="left-align" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', paddingTop: '6px', fontStyle: 'italic' }}>
                                DNP — {dnpPlayers.map((p, i) => (
                                    <span key={p.player_id}>
                                        <Link href={`/players/${p.player_id}`} style={{ color: 'var(--text-muted)' }}>{p.name || p.player_name}</Link>
                                        {i < dnpPlayers.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
