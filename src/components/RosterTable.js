'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { calculatePct } from '@/lib/stats-utils';

const PERIOD_TAB = (active) => ({
    padding: '4px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer',
    fontSize: '0.78rem', fontWeight: active ? 700 : 500, transition: 'all 0.15s ease',
    background: active ? 'var(--tappa-orange)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    fontFamily: "'Space Grotesk', sans-serif",
});
const PERIOD_WRAP = {
    display: 'flex', gap: '2px',
    background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '7px',
};

export default function RosterTable({ roster, periodData }) {
    const [mode, setMode] = useState('avg');
    const [period, setPeriod] = useState('Full');
    const [sortKey, setSortKey] = useState('ppg');
    const [sortDir, setSortDir] = useState('desc');

    const handleSort = useCallback((key) => {
        if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    }, [sortKey]);

    const availPeriods = [...new Set((periodData || []).map(r => r.period))].sort();
    const showPeriods = ['Full'];
    if (availPeriods.some(p => p === 'Q1' || p === 'Q2')) showPeriods.push('H1');
    if (availPeriods.some(p => p === 'Q3' || p === 'Q4')) showPeriods.push('H2');
    availPeriods.forEach(p => { if (!showPeriods.includes(p)) showPeriods.push(p); });

    const aggregatePeriods = (qtrs) => {
        const map = {};
        (periodData || []).filter(r => qtrs.includes(r.period)).forEach(r => {
            if (!map[r.player_id]) {
                map[r.player_id] = { player_id: r.player_id, name: r.name, gp: 0, pts: 0, reb: 0, oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 };
            }
            const s = map[r.player_id];
            s.gp = Math.max(s.gp, r.gp || 0);
            ['pts','reb','oreb','dreb','ast','stl','blk','tov','fgm','fga','tpm','tpa','ftm','fta'].forEach(k => { s[k] += (Number(r[k]) || 0); });
        });
        return Object.values(map);
    };

    let displayData;
    if (period === 'Full')    displayData = roster.map(p => ({ ...p }));
    else if (period === 'H1') displayData = aggregatePeriods(['Q1','Q2']);
    else if (period === 'H2') displayData = aggregatePeriods(['Q3','Q4']);
    else                      displayData = aggregatePeriods([period]);

    const isFullPeriod = period === 'Full';
    const isAvg = mode === 'avg';

    const getStat = (p, rawKey, pgKey) => {
        if (isFullPeriod) return isAvg ? (parseFloat(p[pgKey]) || 0) : (parseFloat(p[rawKey]) || 0);
        const raw = parseFloat(p[rawKey]) || 0;
        return isAvg ? (p.gp > 0 ? raw / p.gp : 0) : raw;
    };

    const getVal = (p, key) => {
        const map = { ppg:['pts','ppg'], rpg:['reb','rpg'], apg:['ast','apg'], spg:['stl','spg'], bpg:['blk','bpg'], topg:['tov','topg'], fgm:['fgm','fgm'], tpm:['tpm','tpm'] };
        if (map[key]) return getStat(p, map[key][0], map[key][1]);
        if (key === 'fg_pct') return calculatePct(p.fgm, p.fga) / 100;
        if (key === 'tp_pct') return calculatePct(p.tpm, p.tpa) / 100;
        if (key === 'gmscr')  return parseFloat(p.gmscr) || 0;
        return parseFloat(p[key]) || 0;
    };

    const sorted = [...displayData].sort((a, b) => {
        const av = getVal(a, sortKey), bv = getVal(b, sortKey);
        return sortDir === 'desc' ? bv - av : av - bv;
    });

    // Team highs — all highlighted columns
    const H = (key) => Math.max(0, ...sorted.map(p => getVal(p, key)));
    const highs = {
        pts: H('ppg'), reb: H('rpg'), ast: H('apg'),
        stl: H('spg'), blk: H('bpg'),
        fgm: H('fgm'), tpm: H('tpm'),
        fg_pct: H('fg_pct'), tp_pct: H('tp_pct'),
        gmscr: H('gmscr'),
    };
    const isHigh = (key, val) => highs[key] > 0 && Math.abs(val - highs[key]) < 0.001;

    const Th = ({ label, skey, cls = '', title = '' }) => {
        const active = sortKey === skey;
        return (
            <th title={title} className={cls} onClick={() => skey && handleSort(skey)}
                style={{ cursor: skey ? 'pointer' : 'default', userSelect: 'none', color: active ? 'var(--tappa-orange)' : '', whiteSpace: 'nowrap' }}>
                {label}{active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </th>
        );
    };

    const pctStr = (m, a) => calculatePct(m, a).toFixed(1) + '%';
    const f1 = v => (v != null && !isNaN(v)) ? Number(v).toFixed(1) : '—';
    const lbl = (a, t) => isAvg ? a : t;

    return (
        <div>
            {/* Controls: distinct mode toggle (prominent) + subtle period tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>

                {/* Mode toggle — orange gradient active, premium segmented control */}
                <div style={{
                    display: 'flex', gap: 0, background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px', padding: '3px',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    {[['avg','Per Game'], ['tot','Totals']].map(([val, label]) => (
                        <button key={val}
                            onClick={() => { setMode(val); setSortKey('ppg'); }}
                            style={{
                                padding: '5px 16px', border: 'none', borderRadius: '7px',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: mode === val ? 700 : 500,
                                fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s ease',
                                background: mode === val
                                    ? 'linear-gradient(135deg, var(--tappa-orange) 0%, #c05e05 100%)'
                                    : 'transparent',
                                color: mode === val ? '#fff' : 'var(--text-muted)',
                                boxShadow: mode === val ? '0 2px 10px rgba(209,107,7,0.45)' : 'none',
                            }}>
                            {label}
                        </button>
                    ))}
                </div>


                {/* Period tabs — orange pill style (supplementary) */}
                {showPeriods.length > 1 && (
                    <>
                        <span style={{ color: 'var(--border-glass)', fontSize: '1rem', userSelect: 'none' }}>|</span>
                        <div style={PERIOD_WRAP}>
                            {showPeriods.map(p => (
                                <button key={p} style={PERIOD_TAB(period === p)} onClick={() => setPeriod(p)}>{p}</button>
                            ))}
                        </div>
                    </>
                )}

                {/* Context note for period views */}
                {!isFullPeriod && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {isAvg ? `${period} avg/game` : `${period} totals`}
                    </span>
                )}
            </div>

            <div className="data-table-container">
                <table className="data-table" style={{ minWidth: '820px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
                            <Th label="Player" cls="left-align" />
                            <Th label="GP" skey="gp" title="Games Played" />
                            <Th label={lbl('PPG','PTS')}  skey="ppg"    title={lbl('Points Per Game','Total Points')} />
                            <Th label={lbl('RPG','REB')}  skey="rpg"    title={lbl('Rebounds Per Game','Total Rebounds')} />
                            <Th label={lbl('APG','AST')}  skey="apg" />
                            <Th label={lbl('SPG','STL')}  skey="spg" />
                            <Th label={lbl('BPG','BLK')}  skey="bpg" />
                            <Th label={lbl('TOV','TO')}   skey="topg" />
                            <Th label="FGM"               skey="fgm" />
                            <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>FGA</th>
                            <Th label="FG%"               skey="fg_pct" />
                            <Th label="3PM"               skey="tpm" />
                            <th style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>3PA</th>
                            <Th label="3P%"               skey="tp_pct" />
                            {isFullPeriod && isAvg && <Th label="GmScr" skey="gmscr" />}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((p, i) => {
                            const ptsVal = getVal(p, 'ppg');
                            const rebVal = getVal(p, 'rpg');
                            const astVal = getVal(p, 'apg');
                            const stlVal = getVal(p, 'spg');
                            const blkVal = getVal(p, 'bpg');
                            const tovVal = getVal(p, 'topg');
                            const fgPct  = getVal(p, 'fg_pct');
                            const tpPct  = getVal(p, 'tp_pct');
                            const gmscr  = getVal(p, 'gmscr');
                            const fgmRaw = Number(p.fgm) || 0;
                            const fgaRaw = Number(p.fga) || 0;
                            const tpmRaw = Number(p.tpm) || 0;
                            const tpaRaw = Number(p.tpa) || 0;
                            // Shooting volume: per-game in ALL avg modes, totals in totals mode
                            const fgmDisp = isAvg ? (p.gp > 0 ? fgmRaw / p.gp : 0) : fgmRaw;
                            const fgaDisp = isAvg ? (p.gp > 0 ? fgaRaw / p.gp : 0) : fgaRaw;
                            const tpmDisp = isAvg ? (p.gp > 0 ? tpmRaw / p.gp : 0) : tpmRaw;
                            const tpaDisp = isAvg ? (p.gp > 0 ? tpaRaw / p.gp : 0) : tpaRaw;

                            // DD/TD (threshold 10 for per-game; period avgs stay per-game too)
                            const cats = [ptsVal, rebVal, astVal, stlVal, blkVal];
                            const dds = cats.filter(v => v >= 10).length;

                            const disp = (avg, tot) => isFullPeriod
                                ? (isAvg ? f1(avg) : (Number(tot) || 0))
                                : f1(isAvg ? avg : tot);

                            return (
                                <tr key={p.player_id} className={i === 0 && sortDir === 'desc' ? 'top-performer' : ''}>
                                    <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.75rem' }}>{i + 1}</td>
                                    <td className="left-align">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Link href={`/players/${p.player_id}`} style={{ fontWeight: 700, color: 'white', textDecoration: 'none' }}>{p.name}</Link>
                                            {isAvg && dds >= 3 && <span title="Triple-Double" style={{ fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', borderRadius: '3px', background: '#f59e0b', color: '#000' }}>TD</span>}
                                            {isAvg && dds === 2 && <span title="Double-Double" style={{ fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', borderRadius: '3px', background: '#3b82f6', color: '#fff' }}>DD</span>}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{p.gp}</td>

                                    <td className={`leader${isHigh('pts', ptsVal) ? ' team-high' : ''}`} style={{ fontWeight: 800 }}>{disp(p.ppg, p.pts)}</td>
                                    <td className={isHigh('reb', rebVal) ? 'team-high' : ''}>{disp(p.rpg, p.reb)}</td>
                                    <td className={isHigh('ast', astVal) ? 'team-high' : ''}>{disp(p.apg, p.ast)}</td>
                                    <td className={isHigh('stl', stlVal) ? 'team-high' : ''}>{disp(p.spg, p.stl)}</td>
                                    <td className={isHigh('blk', blkVal) ? 'team-high' : ''}>{disp(p.bpg, p.blk)}</td>
                                    <td style={{ color: tovVal > (isAvg ? 3 : 15) ? 'var(--danger)' : 'white' }}>{disp(p.topg, p.tov)}</td>

                                    <td className={`split-col${isHigh('fgm', fgmRaw) ? ' team-high' : ''}`}>{isAvg ? f1(fgmDisp) : fgmRaw}</td>
                                    <td className="split-col" style={{ color: 'var(--text-muted)' }}>{isAvg ? f1(fgaDisp) : fgaRaw}</td>
                                    <td className={`pct-col${isHigh('fg_pct', fgPct) ? ' team-high' : ''}`}>{pctStr(fgmRaw, fgaRaw)}</td>

                                    <td className={`split-col${isHigh('tpm', tpmRaw) ? ' team-high' : ''}`}>{isAvg ? f1(tpmDisp) : tpmRaw}</td>
                                    <td className="split-col" style={{ color: 'var(--text-muted)' }}>{isAvg ? f1(tpaDisp) : tpaRaw}</td>
                                    <td className={`pct-col${isHigh('tp_pct', tpPct) ? ' team-high' : ''}`}>{pctStr(tpmRaw, tpaRaw)}</td>

                                    {isFullPeriod && isAvg && (
                                        <td className={`gmscr-col${isHigh('gmscr', gmscr) ? ' team-high' : ''}`}
                                            style={{ color: isHigh('gmscr', gmscr) ? undefined : 'var(--success)', fontWeight: 600 }}>
                                            {f1(p.gmscr)}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {!sorted.length && (
                            <tr><td colSpan="16" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No players for this selection.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
