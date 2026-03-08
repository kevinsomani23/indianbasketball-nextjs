'use client';

import Link from 'next/link';

const pmColor = (v) => v > 0 ? 'var(--success)' : v < 0 ? 'var(--danger)' : 'rgba(255,255,255,0.4)';
const pct = (m, a) => (a > 0 ? (m / a * 100).toFixed(1) : '-');

export default function BoxscoreRow({ b, isTop, showAdvanced, selectedPeriod, teamHighs, topIds }) {
    const pmVal = b.pm_plus ?? null;
    
    // Extract jersey from name if data is missing (e.g., Rajasthan)
    let jersey = b.jersey;
    let name = b.name || b.player_name || 'Unknown';
    if (!jersey && name.includes('#')) {
        const parts = name.split('#');
        name = parts[0].trim();
        jersey = parts[1].trim();
    }

    return (
        <tr className={isTop ? 'top-performer' : ''}>
            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'Space Mono' }}>{jersey || ''}</td>
            <td className="left-align">
                <div className="flex-row" style={{ gap: '6px' }}>
                    <Link href={`/players/${b.player_id}`} style={{ fontWeight: isTop ? 700 : 500 }}>{name}</Link>
                    {(() => {
                        const stats = [b.pts, b.reb, b.ast, b.stl, b.blk].map(v => v || 0);
                        const doubleDigits = stats.filter(s => s >= 10).length;
                        if (doubleDigits >= 3) return <span title="Triple-Double" style={{ fontSize: '0.6rem', background: 'var(--badge-td)', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 900 }}>TD</span>;
                        if (doubleDigits === 2) return <span title="Double-Double" style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', padding: '1px 4px', borderRadius: '3px', fontWeight: 900 }}>DD</span>;
                        return null;
                    })()}
                </div>
            </td>
            <td style={{ color: 'var(--text-muted)' }}>{b.min || '-'}</td>
            <td className={`leader ${teamHighs.pts > 0 && b.pts === teamHighs.pts ? 'team-high' : ''}`}>{b.pts ?? 0}</td>
            <td className="split-col">{b.pm2 ?? 0}</td>
            <td className="split-col" style={{ color: 'var(--text-muted)' }}>{b.pa2 ?? 0}</td>
            <td className="pct-col">{pct(b.pm2, b.pa2)}</td>
            <td className="split-col">{b.tpm ?? 0}</td>
            <td className="split-col" style={{ color: 'var(--text-muted)' }}>{b.tpa ?? 0}</td>
            <td className="pct-col">{pct(b.tpm, b.tpa)}</td>
            <td className="split-col">{b.ftm ?? 0}</td>
            <td className="split-col" style={{ color: 'var(--text-muted)' }}>{b.fta ?? 0}</td>
            <td className="pct-col">{pct(b.ftm, b.fta)}</td>
            <td className={teamHighs.oreb > 0 && (b.oreb || 0) === teamHighs.oreb ? 'team-high' : ''}>{b.oreb ?? 0}</td>
            <td className={teamHighs.dreb > 0 && (b.dreb || 0) === teamHighs.dreb ? 'team-high' : ''}>{b.dreb ?? 0}</td>
            <td className={teamHighs.reb > 0 && b.reb === teamHighs.reb ? 'team-high' : ''}>{b.reb ?? 0}</td>
            <td className={teamHighs.ast > 0 && b.ast === teamHighs.ast ? 'team-high' : ''}>{b.ast ?? 0}</td>
            <td>{b.tov ?? 0}</td>
            <td className={teamHighs.stl > 0 && b.stl === teamHighs.stl ? 'team-high' : ''}>{b.stl ?? 0}</td>
            <td className={teamHighs.blk > 0 && b.blk === teamHighs.blk ? 'team-high' : ''}>{b.blk ?? 0}</td>
            <td>{b.pf ?? 0}</td>
            <td style={{ color: 'rgba(255,255,255,0.4)' }}>{b.fd ?? 0}</td>
            <td style={{ color: pmColor(pmVal), fontWeight: pmVal !== null && pmVal !== 0 ? 700 : 'inherit', fontSize: '0.85rem' }}>
                {pmVal !== null ? (pmVal > 0 ? `+${pmVal}` : pmVal) : '-'}
            </td>
            {showAdvanced && <>
                <td className="pct-col">{b.efg_pct}</td>
                <td className="pct-col">{b.ts_pct}</td>
                <td className="gmscr-col">{b.calculated_gmscr?.toFixed(1) ?? '-'}</td>
            </>}
        </tr>
    );
}
