'use client';

import { useState, useCallback, useMemo } from 'react';
import BoxscoreHeader from './boxscore/BoxscoreHeader';
import BoxscoreTable from './boxscore/BoxscoreTable';
import { calculatePct, calculateTSA, calculateTSPct, calculateEFGPct } from '@/lib/stats-utils';

export default function InteractiveBoxscore({ teamName, teamId, boxscores, periodBoxscores, totalScore, periods, isWinner, externalState }) {
    const [internalPeriod, setInternalPeriod] = useState('Full Match');
    const [internalAdvanced, setInternalAdvanced] = useState(false);

    const selectedPeriod = externalState ? externalState.selectedPeriod : internalPeriod;
    const setSelectedPeriod = externalState ? externalState.setSelectedPeriod : setInternalPeriod;
    const showAdvanced = externalState ? externalState.showAdvanced : internalAdvanced;
    const setShowAdvanced = externalState ? externalState.setShowAdvanced : setInternalAdvanced;

    const [sortKey, setSortKey] = useState('pts');
    const [sortDir, setSortDir] = useState('desc');

    const handleSort = useCallback((key) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    }, [sortKey]);

    // Period display logic
    const displayPeriods = useMemo(() => {
        const dp = ['Full Match'];
        if (periods.includes('Q1') || periods.includes('Q2')) dp.push('H1');
        if (periods.includes('Q3') || periods.includes('Q4')) dp.push('H2');
        periods.forEach(p => { if (!dp.includes(p)) dp.push(p); });
        return dp;
    }, [periods]);

    const constructHalfStats = useCallback((half) => {
        const qtrs = half === 'H1' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
        const halfStats = {};
        periodBoxscores.forEach(row => {
            if (qtrs.includes(row.period)) {
                if (!halfStats[row.player_id]) {
                    halfStats[row.player_id] = { ...row, period: half };
                } else {
                    const s = halfStats[row.player_id];
                    ['pts','reb','ast','stl','blk','tov','pf','fgm','fga','tpm','tpa','ftm','fta','oreb','dreb'].forEach(k => { s[k] = (s[k] || 0) + (row[k] || 0); });
                }
            }
        });
        return Object.values(halfStats);
    }, [periodBoxscores]);

    const finalData = useMemo(() => {
        if (selectedPeriod === 'Full Match') return boxscores;
        if (selectedPeriod === 'H1') return constructHalfStats('H1');
        if (selectedPeriod === 'H2') return constructHalfStats('H2');
        return periodBoxscores.filter(p => p.period === selectedPeriod);
    }, [selectedPeriod, boxscores, periodBoxscores, constructHalfStats]);

    // Separate active vs DNP
    const activePlayers = useMemo(() => finalData.filter(b => selectedPeriod !== 'Full Match' || (b.min && parseFloat(b.min) > 0)), [finalData, selectedPeriod]);
    const dnpPlayers = useMemo(() => selectedPeriod === 'Full Match' ? finalData.filter(b => !b.min || parseFloat(b.min) === 0) : [], [finalData, selectedPeriod]);

    // GmScr + eFG% + TS% (Using shared utils)
    const enriched = useMemo(() => {
        return activePlayers.map(b => {
            const fga = b.fga || 0, fta = b.fta || 0, pts = b.pts || 0;
            const efg = calculateEFGPct(b.fgm, b.tpm, fga).toFixed(1);
            const ts = calculateTSPct(pts, calculateTSA(fga, fta)).toFixed(1);
            
            let gm_scr = b.gm_scr;
            if (gm_scr === undefined || gm_scr === null) {
                gm_scr = pts + (0.4 * (b.fgm || 0)) - (0.7 * fga) - (0.4 * (fta - (b.ftm || 0))) + (0.7 * (b.reb || 0)) + (0.7 * (b.ast || 0)) + (b.stl || 0) + (0.7 * (b.blk || 0)) - (0.4 * (b.tov || 0));
            }
            
            const pm2 = b.pm2 ?? ((b.fgm || 0) - (b.tpm || 0));
            const pa2 = b.pa2 ?? ((fga || 0) - (b.tpa || 0));
            return { ...b, calculated_gmscr: gm_scr, efg_pct: efg, ts_pct: ts, pm2, pa2 };
        });
    }, [activePlayers]);

    // Sort
    const sorted = useMemo(() => {
        const sortKeyMap = { pts:'pts', reb:'reb', ast:'ast', stl:'stl', blk:'blk', tov:'tov', pf:'pf', pm:'pm_plus', fgm:'fgm', tpm:'tpm', ftm:'ftm', oreb:'oreb', dreb:'dreb', gmscr:'calculated_gmscr', min:'min' };
        return [...enriched].sort((a, b) => {
            const key = sortKeyMap[sortKey] || 'pts';
            const av = parseFloat(a[key]) || 0;
            const bv = parseFloat(b[key]) || 0;
            return sortDir === 'desc' ? bv - av : av - bv;
        });
    }, [enriched, sortKey, sortDir]);

    // Top 3 by GmScr
    const topIds = useMemo(() => [...enriched].sort((a, b) => b.calculated_gmscr - a.calculated_gmscr).slice(0, 3).map(p => p.player_id), [enriched]);

    // Team totals
    const tot = useMemo(() => {
        return enriched.reduce((s, b) => {
            ['pts','reb','oreb','dreb','ast','stl','blk','tov','pf','fd','fgm','fga','tpm','tpa','ftm','fta'].forEach(k => { s[k] = (s[k]||0) + (b[k]||0); });
            s.pm2 = (s.pm2||0) + (b.pm2||0);
            s.pa2 = (s.pa2||0) + (b.pa2||0);
            return s;
        }, {});
    }, [enriched]);

    const totScore = selectedPeriod === 'Full Match' ? totalScore : tot.pts;
    const totEfg = calculateEFGPct(tot.fgm, tot.tpm, tot.fga).toFixed(1);
    const totTs = calculateTSPct(totScore, calculateTSA(tot.fga, tot.fta)).toFixed(1);

    // Team highs
    const teamHighs = useMemo(() => {
        const high = k => Math.max(...enriched.map(p => parseFloat(p[k]) || 0));
        return { pts: high('pts'), reb: high('reb'), ast: high('ast'), stl: high('stl'), blk: high('blk'), oreb: high('oreb'), dreb: high('dreb') };
    }, [enriched]);

    return (
        <div style={{ marginBottom: '3rem' }}>
            <BoxscoreHeader 
                teamName={teamName} teamId={teamId} isWinner={isWinner} 
                showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} 
                selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} 
                displayPeriods={displayPeriods} currentScore={totScore} 
            />
            <BoxscoreTable 
                enriched={sorted} showAdvanced={showAdvanced} 
                sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} 
                teamHighs={teamHighs} topIds={topIds} 
                selectedPeriod={selectedPeriod} tot={tot} 
                totScore={totScore} totEfg={totEfg} totTs={totTs} 
                dnpPlayers={dnpPlayers} 
            />
        </div>
    );
}
