/**
 * Shared statistical calculation utilities for Indian Basketball Hub.
 * Consolidates math to ensure consistency across Stats Hub, Player Profiles, and Team Profiles.
 */

export const calculatePct = (made, attempted) => {
    if (!attempted || attempted === 0) return 0;
    return (made / attempted) * 100;
};

export const calculateTSA = (fga, fta) => {
    return fga + 0.44 * fta;
};

export const calculateTSPct = (pts, tsa) => {
    if (!tsa || tsa === 0) return 0;
    return (pts / (2 * tsa)) * 100;
};

export const calculateEFGPct = (fgm, tpm, fga) => {
    if (!fga || fga === 0) return 0;
    return ((fgm + 0.5 * tpm) / fga) * 100;
};

export const calculateATR = (ast, tov) => {
    if (!tov || tov === 0) return ast;
    return ast / tov;
};

/**
 * Formats a decimal minute value into MM:SS
 * @param {number} totalMins 
 * @param {number} gp 
 * @param {string} mode - 'averages' or 'totals'
 */
export function formatTime(totalMins, gp, mode = 'averages') {
    if (!totalMins || isNaN(totalMins) || !gp) return '-';
    
    if (mode === 'totals') {
        return Math.round(totalMins).toString();
    }
    
    const displayMins = totalMins / gp;
    const m = Math.floor(displayMins);
    const s = Math.round((displayMins % 1) * 60);
    
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Computes a standardized set of advanced and per-game metrics from a raw stats row.
 */
export function computeAdvancedMetrics(r, div = 1) {
    const actualGp = r.gp || 1;
    const fgm = r.fgm || 0;
    const fga = r.fga || 0;
    const tpm = r.tpm || 0;
    const tpa = r.tpa || 0;
    const ftm = r.ftm || 0;
    const fta = r.fta || 0;
    const pts = r.pts || 0;
    const ast = r.ast || 0;
    const tov = r.tov || 0;

    const tsa = calculateTSA(fga, fta);

    return {
        ...r,
        pts_pg: pts / div,
        fgm_pg: fgm / div,
        fga_pg: fga / div,
        fg_pct: calculatePct(fgm, fga),
        tpm_pg: tpm / div,
        tpa_pg: tpa / div,
        tp_pct: calculatePct(tpm, tpa),
        ftm_pg: ftm / div,
        fta_pg: fta / div,
        ft_pct: calculatePct(ftm, fta),
        tsa_pg: tsa / div,
        ts_pct: calculateTSPct(pts, tsa),
        efg_pct: calculateEFGPct(fgm, tpm, fga),
        atr: calculateATR(ast, tov),
        
        // Advanced metrics averages (they are usually already summed as ratings)
        offrtg: (r.sum_offrtg || 0) / actualGp,
        defrtg: (r.sum_defrtg || 0) / actualGp,
        netrtg: (r.sum_netrtg || 0) / actualGp,
        usg: (r.sum_usg || 0) / actualGp,
        ast_pct: (r.sum_ast_pct || 0) / actualGp,
        oreb_pct: (r.sum_oreb_pct || 0) / actualGp,
        dreb_pct: (r.sum_dreb_pct || 0) / actualGp,
        reb_pct: (r.sum_reb_pct || 0) / actualGp,
        pie: (r.sum_pie || 0) / actualGp,
        fic: (r.sum_fic || 0) / div,
        gsc_pg: (r.gsc || 0) / div,
        reb_pg: (r.reb || 0) / div,
        ast_pg: (r.ast || 0) / div,
        stl_pg: (r.stl || 0) / div,
        blk_pg: (r.blk || 0) / div,
        tov_pg: (r.tov || 0) / div,
        min_pg: (r.mins || 0) / div,
        oreb_pg: (r.oreb || 0) / div,
        dreb_pg: (r.dreb || 0) / div,
        pf_pg: (r.pf || 0) / div,
        eff_pg: (r.eff || 0) / div,
    };
}
