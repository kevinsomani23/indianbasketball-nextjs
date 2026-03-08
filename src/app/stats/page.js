import { query } from '@/lib/db';
import { SQL_ACTIVE_PLAYERS } from '@/lib/queries';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';
import StatsFilters from '@/components/StatsFilters';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Stats Hub | Indian Basketball',
};

import { calculatePct, calculateTSA, calculateTSPct, calculateEFGPct, calculateATR, formatTime, computeAdvancedMetrics } from '@/lib/stats-utils';

const SortableHeader = ({ label, field, sort, order, params, labelFull }) => {
    const isActive = sort === field;
    const nextOrder = isActive && order === 'desc' ? 'asc' : 'desc';
    const newParams = new URLSearchParams(params);
    newParams.set('sort', field);
    newParams.set('order', nextOrder);
    newParams.delete('page');

    return (
        <th title={labelFull} className={field === 'name' ? 'left-align sticky-col' : ''} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
            <Link href={`/stats?${newParams.toString()}`} style={{ textDecoration: 'none', color: isActive ? 'var(--tappa-orange)' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: field === 'name' ? 'flex-start' : 'center' }}>
                {label}
                {isActive && <span style={{ fontSize: '0.8em' }}>{order === 'asc' ? '▲' : '▼'}</span>}
            </Link>
        </th>
    );
};

export default async function StatsHub({ searchParams }) {
    const sp = await searchParams;
    const entity = sp.entity || 'players'; // 'players' or 'teams'
    const mode = sp.mode || 'averages'; // 'averages' or 'totals'
    const gender = sp.gender || 'all';
    const tourneyId = sp.tournament || 'all';
    const searchFilter = sp.q || '';
    const sort = sp.sort || (entity === 'players' ? 'pts' : 'pts_total');
    const order = sp.order || 'desc';
    const page = parseInt(sp.page) || 1;

    const isAdv = sp.adv === 'true';

    // Fetch tournaments and group by name
    const rawTournaments = await query('SELECT id, name, gender FROM Tournaments ORDER BY id DESC');
    
    // Transform names: Replace SN with Senior National
    const processedDistTourneys = rawTournaments.map(t => ({
        ...t,
        cleanName: t.name.replace(/\bSN\b/g, 'Senior National')
                         .replace(/\s+(Men|Women)$/i, '')
                         .replace(/\bSN\b/g, 'Senior National') // Double check
                         .trim()
    }));

    // Unique grouping for the dropdown
    const groupedTourneyOptions = [];
    const seenNames = new Set();
    for (const t of processedDistTourneys) {
        if (!seenNames.has(t.cleanName)) {
            groupedTourneyOptions.push(t.cleanName);
            seenNames.add(t.cleanName);
        }
    }
    
    let stats = [];

    const isAvg = mode === 'averages';
    const divBy = (r) => (isAvg && r.gp > 0) ? r.gp : 1;

    if (entity === 'players') {
        let sql = `
            SELECT p.player_id, p.name, t.name as team_name, tour.gender as p_gender, tour.name as tour_name,
                   COUNT(CASE WHEN b.${SQL_ACTIVE_PLAYERS} THEN 1 END) as gp,
                   SUM(b.pts) as pts, SUM(b.reb) as reb, SUM(b.oreb) as oreb, SUM(b.dreb) as dreb,
                   SUM(b.ast) as ast, SUM(b.stl) as stl, SUM(b.blk) as blk, SUM(b.tov) as tov,
                   SUM(b.fgm) as fgm, SUM(b.fga) as fga, SUM(b.tpm) as tpm, SUM(b.tpa) as tpa,
                   SUM(b.pm2) as pm2, SUM(b.pa2) as pa2,
                   SUM(b.ftm) as ftm, SUM(b.fta) as fta, SUM(b.pf) as pf, SUM(b.fd) as fd,
                   SUM(b.efficiency) as eff,
                   SUM(b.pm_plus) as pm_plus, SUM(b.gm_scr) as gsc, SUM(b.mins_dec) as mins,
                   
                   -- Advanced metrics (we average these implicitly by taking sums over games played, 
                   -- though OFFRTG is usually points per 100 poss. The parser computes it per match.
                   -- We will simply sum and divide by GP for the average rating across games)
                   SUM(b.offrtg) as sum_offrtg, SUM(b.defrtg) as sum_defrtg, SUM(b.netrtg) as sum_netrtg,
                   SUM(b.usg) as sum_usg, SUM(b.ast_pct) as sum_ast_pct, SUM(b.oreb_pct) as sum_oreb_pct,
                   SUM(b.dreb_pct) as sum_dreb_pct, SUM(b.reb_pct) as sum_reb_pct, SUM(b.pie) as sum_pie,
                   SUM(b.fic) as sum_fic
            FROM Players p
            JOIN Teams t ON p.team_id = t.id
            JOIN Tournaments tour ON p.tournament_id = tour.id
            JOIN Boxscores b ON p.player_id = b.player_id
            JOIN Matches m ON b.match_id = m.match_id
            WHERE 1=1
        `;
        const params = [];
        if (gender !== 'all') {
            sql += ` AND m.gender = ?`;
            params.push(gender === 'W' ? 'Women' : 'Men');
        }
        if (tourneyId !== 'all') {
            sql += ` AND (tour.name LIKE ? OR tour.name LIKE ? OR tour.name = ?)`;
            params.push(`${tourneyId}%`);
            params.push(`%${tourneyId}%`);
            params.push(tourneyId.replace('Senior National', 'SN'));
        }
        if (searchFilter) {
            sql += ` AND p.name LIKE ?`;
            params.push(`%${searchFilter}%`);
        }
        sql += ` GROUP BY p.player_id`;
        if (mode === 'averages') {
            sql += ` HAVING gp >= 3`;
        } else {
            sql += ` HAVING gp >= 1`;
        }

        const raw = await query(sql, params);
        stats = raw.map(r => computeAdvancedMetrics(r, divBy(r)));
    } else {
        // Teams logic
        let sql = `
            SELECT t.id, t.name, tour.gender as t_gender, tour.name as tour_name,
                   COUNT(DISTINCT b.match_id) as gp,
                   SUM(b.pts) as pts, SUM(b.reb) as reb, SUM(b.oreb) as oreb, SUM(b.dreb) as dreb,
                   SUM(b.ast) as ast, SUM(b.stl) as stl, SUM(b.blk) as blk, SUM(b.tov) as tov,
                   SUM(b.fgm) as fgm, SUM(b.fga) as fga, SUM(b.tpm) as tpm, SUM(b.tpa) as tpa,
                   SUM(b.pm2) as pm2, SUM(b.pa2) as pa2,
                   SUM(b.ftm) as ftm, SUM(b.fta) as fta, SUM(b.pf) as pf, SUM(b.fd) as fd,
                   SUM(b.efficiency) as eff,
                   SUM(b.pm_plus) as pm, SUM(b.gm_scr) as gsc, SUM(b.mins_dec) as mins,
                   
                   -- Basic Advanced rollups for team members. In a real system TeamMatchStats 
                   -- has proper team OFFRTG. Here for StatsHub we're rolling up the boxscore table.
                   -- We use TeamMatchStats table later for team profiles.
                   0 as sum_offrtg, 0 as sum_defrtg, 0 as sum_netrtg, 0 as sum_pie, 0 as sum_fic
            FROM Teams t
            JOIN Tournaments tour ON t.tournament_id = tour.id
            JOIN Boxscores b ON t.id = b.team_id
            JOIN Matches m ON b.match_id = m.match_id
            WHERE 1=1
        `;
        const params = [];
        if (gender !== 'all') {
            sql += ` AND m.gender = ?`;
            params.push(gender === 'W' ? 'Women' : 'Men');
        }
        if (tourneyId !== 'all') {
            sql += ` AND (tour.name LIKE ? OR tour.name LIKE ? OR tour.name = ?)`;
            params.push(`${tourneyId}%`);
            params.push(`%${tourneyId}%`);
            params.push(tourneyId.replace('Senior National', 'SN'));
        }
        if (searchFilter) {
            sql += ` AND t.name LIKE ?`;
            params.push(`%${searchFilter}%`);
        }
        sql += ` GROUP BY t.id`;

        const raw = await query(sql, params);
        stats = raw.map(r => computeAdvancedMetrics(r, divBy(r)));
    }

    // Manual sort
    stats.sort((a, b) => {
        let valA = a[sort] ?? (order === 'asc' ? Infinity : -Infinity);
        let valB = b[sort] ?? (order === 'asc' ? Infinity : -Infinity);
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    const urlParams = { entity, mode, gender, tournament: tourneyId, q: searchFilter, adv: isAdv ? 'true' : 'false', sort, order };

    const pageSize = 50;
    const totalPages = Math.ceil(stats.length / pageSize) || 1;
    const paginatedStats = stats.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="stats-hub animate-fade-in">
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Stats Hub</h1>
                    <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Comprehensive statistical database for Indian Basketball.</p>
                </div>

                {/* Navigator */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="toggle-group shadow-sm">
                        <Link href={`/stats?${new URLSearchParams({...urlParams, entity: 'players'}).toString()}`} className={`toggle-btn ${entity === 'players' ? 'active' : ''}`}>Players</Link>
                        <Link href={`/stats?${new URLSearchParams({...urlParams, entity: 'teams'}).toString()}`} className={`toggle-btn ${entity === 'teams' ? 'active' : ''}`}>Teams</Link>
                    </div>

                    <div className="toggle-group shadow-sm">
                        <Link href={`/stats?${new URLSearchParams({...urlParams, mode: 'averages'}).toString()}`} className={`toggle-btn ${mode === 'averages' ? 'active' : ''}`}>Averages</Link>
                        <Link href={`/stats?${new URLSearchParams({...urlParams, mode: 'totals'}).toString()}`} className={`toggle-btn ${mode === 'totals' ? 'active' : ''}`}>Totals</Link>
                    </div>
                    
                    {entity === 'players' && (
                        <div className="toggle-group shadow-sm" style={{ border: '1px solid var(--tappa-orange)' }}>
                            <Link href={`/stats?${new URLSearchParams({...urlParams, adv: 'false'}).toString()}`} className={`toggle-btn ${!isAdv ? 'active' : ''}`} style={!isAdv ? {backgroundColor: 'var(--tappa-orange)', color: 'white'} : {color: 'var(--tappa-orange)'}}>Standard</Link>
                            <Link href={`/stats?${new URLSearchParams({...urlParams, adv: 'true'}).toString()}`} className={`toggle-btn ${isAdv ? 'active' : ''}`} style={isAdv ? {backgroundColor: 'var(--tappa-orange)', color: 'white'} : {color: 'var(--tappa-orange)'}}>Advanced</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters Row */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
                <StatsFilters 
                    entity={entity} 
                    mode={mode} 
                    sort={sort} 
                    order={order} 
                    searchFilter={searchFilter} 
                    gender={gender} 
                    tourneyId={tourneyId} 
                    groupedTourneyOptions={groupedTourneyOptions} 
                />
            </div>

            <div className="data-table-container shadow-lg" style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <table className="data-table stats-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <SortableHeader label={entity === 'players' ? "Player" : "Team"} field="name" sort={sort} order={order} params={urlParams} isLeftAlign={true} />
                            {entity === 'players' && tourneyId !== 'all' && <SortableHeader label="Team" field="team_name" sort={sort} order={order} params={urlParams} isLeftAlign={true} />}
                            <SortableHeader label="GP" field="gp" sort={sort} order={order} params={urlParams} labelFull="Games Played" />
                            <SortableHeader label={mode === 'averages' ? "MPG" : "MIN"} field="min_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Minutes Per Game" : "Total Minutes"} />
                            <SortableHeader label={mode === 'averages' ? "PPG" : "PTS"} field="pts_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Points Per Game" : "Total Points"} />
                            
                            {!isAdv ? (
                                <>
                                    <SortableHeader label={mode === 'averages' ? "FGMPG" : "FGM"} field="fgm_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Field Goals Made PG" : "Total Field Goals"} />
                                    <SortableHeader label={mode === 'averages' ? "FGAPG" : "FGA"} field="fga_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Field Goals Attempted PG" : "Total Field Goals Attempted"} />
                                    <SortableHeader label="FG%" field="fg_pct" sort={sort} order={order} params={urlParams} labelFull="Field Goal Percentage" />
                                    
                                    <SortableHeader label={mode === 'averages' ? "2PMPG" : "2PM"} field="pm2_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "2-Points Made PG" : "Total 2-Points"} />
                                    <SortableHeader label={mode === 'averages' ? "2PAPG" : "2PA"} field="pa2_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "2-Points Attempted PG" : "Total 2-Points Attempted"} />
                                    <SortableHeader label="2P%" field="p2_pct" sort={sort} order={order} params={urlParams} labelFull="2-Point Percentage" />
                                    
                                    <SortableHeader label={mode === 'averages' ? "3PMPG" : "3PM"} field="tpm_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "3-Points Made PG" : "Total 3-Points"} />
                                    <SortableHeader label={mode === 'averages' ? "3PAPG" : "3PA"} field="tpa_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "3-Points Attempted PG" : "Total 3-Points Attempted"} />
                                    <SortableHeader label="3P%" field="tp_pct" sort={sort} order={order} params={urlParams} labelFull="3-Point Percentage" />
                                    
                                    <SortableHeader label={mode === 'averages' ? "TSAPG" : "TSA"} field="tsa_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "True Shooting Attempts PG" : "Total True Shooting Attempts"} />
                                    <SortableHeader label="TS%" field="ts_pct" sort={sort} order={order} params={urlParams} labelFull="True Shooting Percentage" />
                                    
                                    <SortableHeader label={mode === 'averages' ? "FTAPG" : "FTA"} field="fta_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Free Throws Attempted PG" : "Total Free Throws Attempted"} />
                                    <SortableHeader label={mode === 'averages' ? "FTMPG" : "FTM"} field="ftm_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Free Throws Made PG" : "Total Free Throws"} />
                                    
                                    <SortableHeader label={mode === 'averages' ? "ORPG" : "OREB"} field="oreb_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Offensive Rebounds PG" : "Total Offensive Rebounds"} />
                                    <SortableHeader label={mode === 'averages' ? "DRPG" : "DREB"} field="dreb_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Defensive Rebounds PG" : "Total Defensive Rebounds"} />
                                    <SortableHeader label={mode === 'averages' ? "RPG" : "REB"} field="reb_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Total Rebounds PG" : "Total Rebounds"} />
                                    
                                    <SortableHeader label={mode === 'averages' ? "APG" : "AST"} field="ast_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Assists Per Game" : "Total Assists"} />
                                    <SortableHeader label={mode === 'averages' ? "STPG" : "STL"} field="stl_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Steals Per Game" : "Total Steals"} />
                                    <SortableHeader label={mode === 'averages' ? "TOPG" : "TO"} field="tov_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Turnovers Per Game" : "Total Turnovers"} />
                                    <SortableHeader label="A/TO" field="atr" sort={sort} order={order} params={urlParams} labelFull="Assist to Turnover Ratio" />
                                    
                                    <SortableHeader label={mode === 'averages' ? "BLKPG" : "BLK"} field="blk_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Blocks Per Game" : "Total Blocks"} />
                                    <SortableHeader label={mode === 'averages' ? "PFPG" : "PF"} field="pf_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Personal Fouls PG" : "Total Personal Fouls"} />
                                    <SortableHeader label="+/-" field="pm_plus" sort={sort} order={order} params={urlParams} labelFull="Plus/Minus" />
                                    
                                    <SortableHeader label={mode === 'averages' ? "EFF" : "EFF"} field="eff_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Efficiency Rating PG" : "Total Efficiency"} />
                                    <SortableHeader label="eFG%" field="efg_pct" sort={sort} order={order} params={urlParams} labelFull="Effective FG Percentage" />
                                    <SortableHeader label={mode === 'averages' ? "GmScr" : "GmScr"} field="gsc_pg" sort={sort} order={order} params={urlParams} labelFull={mode === 'averages' ? "Game Score Per Game" : "Total Game Score"} />
                                </>
                            ) : (
                                <>
                                    <SortableHeader label="OFFRTG" field="offrtg" sort={sort} order={order} params={urlParams} labelFull="Offensive Rating (Points produced per 100 pos)" />
                                    <SortableHeader label="DEFRTG" field="defrtg" sort={sort} order={order} params={urlParams} labelFull="Defensive Rating (Points allowed per 100 pos)" />
                                    <SortableHeader label="NETRTG" field="netrtg" sort={sort} order={order} params={urlParams} labelFull="Net Rating" />
                                    <SortableHeader label="USG%" field="usg" sort={sort} order={order} params={urlParams} labelFull="Usage Percentage" />
                                    <SortableHeader label="AST%" field="ast_pct" sort={sort} order={order} params={urlParams} labelFull="Assist Percentage" />
                                    <SortableHeader label="OREB%" field="oreb_pct" sort={sort} order={order} params={urlParams} labelFull="Offensive Rebound Percentage" />
                                    <SortableHeader label="DREB%" field="dreb_pct" sort={sort} order={order} params={urlParams} labelFull="Defensive Rebound Percentage" />
                                    <SortableHeader label="REB%" field="reb_pct" sort={sort} order={order} params={urlParams} labelFull="Total Rebound Percentage" />
                                    <SortableHeader label="eFG%" field="efg_pct" sort={sort} order={order} params={urlParams} labelFull="Effective FG Percentage" />
                                    <SortableHeader label="TS%" field="ts_pct" sort={sort} order={order} params={urlParams} labelFull="True Shooting Percentage" />
                                    <SortableHeader label="PIE" field="pie" sort={sort} order={order} params={urlParams} labelFull="Player Impact Estimate" />
                                    <SortableHeader label="FIC" field="fic" sort={sort} order={order} params={urlParams} labelFull="Floor Impact Counter" />
                                    <SortableHeader label="GmScr" field="gsc_pg" sort={sort} order={order} params={urlParams} labelFull="Game Score" />
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStats.map((s, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? 'alt-row' : ''}>
                                <td className="left-align sticky-col" style={{ fontWeight: 600 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {entity === 'teams' && <TeamLogo teamName={s.name} width={28} height={28} />}
                                        <Link href={entity === 'players' ? `/players/${s.player_id}` : `/teams/${s.id}`} style={{ textDecoration: 'none', color: 'var(--tappa-orange)' }}>
                                            {s.name}
                                        </Link>
                                    </div>
                                </td>
                                {entity === 'players' && tourneyId !== 'all' && <td className="left-align" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.team_name}</td>}
                                <td>{s.gp}</td>
                                
                                <td>{entity === 'players' ? formatTime(s.mins, s.gp, mode) : '-'}</td>
                                <td className="leader" style={{ fontWeight: 'bold' }}>{s.pts_pg.toFixed(1)}</td>
                                
                                {!isAdv ? (
                                    <>
                                        <td>{s.fgm_pg.toFixed(1)}</td>
                                        <td>{s.fga_pg.toFixed(1)}</td>
                                        <td style={{ color: 'var(--tappa-orange)', fontWeight: 600 }}>{s.fga > 0 ? ((s.fgm / s.fga) * 100).toFixed(1) : '0.0'}%</td>
                                        
                                        <td title={`${(s.pm2 || 0)} / ${(s.pa2 || 0)}`}>{((s.pm2 || 0) / (s.gp || 1)).toFixed(1)}</td>
                                        <td>{((s.pa2 || 0) / (s.gp || 1)).toFixed(1)}</td>
                                        <td>{(s.pa2 || 0) > 0 ? (((s.pm2 || 0) / s.pa2) * 100).toFixed(1) : '0.0'}%</td>
                                        
                                        <td>{s.tpm_pg.toFixed(1)}</td>
                                        <td>{s.tpa_pg.toFixed(1)}</td>
                                        <td style={{ fontWeight: 600 }}>{s.tpa > 0 ? ((s.tpm / s.tpa) * 100).toFixed(1) : '0.0'}%</td>
                                        
                                        <td style={{ color: 'var(--text-muted)' }}>{s.tsa_pg.toFixed(1)}</td>
                                        <td style={{ color: '#22c55e', fontWeight: 600 }}>{s.ts_pct.toFixed(1)}%</td>
                                        
                                        <td>{s.fta_pg.toFixed(1)}</td>
                                        <td>{s.ftm_pg.toFixed(1)}</td>
                                        
                                        <td>{s.oreb_pg.toFixed(1)}</td>
                                        <td>{s.dreb_pg.toFixed(1)}</td>
                                        <td style={{ fontWeight: 500 }}>{s.reb_pg.toFixed(1)}</td>
                                        
                                        <td>{s.ast_pg.toFixed(1)}</td>
                                        <td>{s.stl_pg.toFixed(1)}</td>
                                        <td>{s.tov_pg.toFixed(1)}</td>
                                        <td style={{ fontStyle: 'italic' }}>{s.atr.toFixed(1)}</td>
                                        
                                        <td>{s.blk_pg.toFixed(1)}</td>
                                        <td>{s.pf_pg.toFixed(1)}</td>
                                        <td style={{ color: (s.pm_plus || 0) >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                            {((s.pm_plus || 0) / (s.gp || 1)).toFixed(1)}
                                        </td>
                                        
                                        <td style={{ color: 'var(--tappa-orange)', fontWeight: 700 }}>{s.eff_pg.toFixed(1)}</td>
                                        <td>{s.fga > 0 ? (((s.fgm + 0.5 * s.tpm) / s.fga) * 100).toFixed(1) : '0.0'}%</td>
                                        <td>{s.gsc_pg.toFixed(1)}</td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{ color: '#22c55e', fontWeight: 600 }}>{s.offrtg.toFixed(1)}</td>
                                        <td style={{ color: '#ef4444', fontWeight: 600 }}>{s.defrtg.toFixed(1)}</td>
                                        <td style={{ color: s.netrtg >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{s.netrtg > 0 ? '+' : ''}{s.netrtg.toFixed(1)}</td>
                                        <td style={{ color: 'var(--tappa-orange)', fontWeight: 500 }}>{s.usg.toFixed(1)}%</td>
                                        <td>{s.ast_pct.toFixed(1)}%</td>
                                        <td>{s.oreb_pct.toFixed(1)}%</td>
                                        <td>{s.dreb_pct.toFixed(1)}%</td>
                                        <td style={{ fontWeight: 600 }}>{s.reb_pct.toFixed(1)}%</td>
                                        <td>{s.fga > 0 ? (((s.fgm + 0.5 * s.tpm) / s.fga) * 100).toFixed(1) : '0.0'}%</td>
                                        <td>{s.ts_pct.toFixed(1)}%</td>
                                        <td style={{ color: '#8b5cf6', fontWeight: 700 }}>{s.pie.toFixed(1)}%</td>
                                        <td>{s.fic.toFixed(1)}</td>
                                        <td>{s.gsc_pg.toFixed(1)}</td>
                                    </>
                                )}
                            </tr>
                        ))}

                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex-center gap-md" style={{ marginTop: '2rem' }}>
                    {page > 1 ? (
                        <Link href={`/stats?${new URLSearchParams({...urlParams, page: page - 1}).toString()}`} className="toggle-btn shadow-sm" style={{ padding: '0.5rem 1rem' }}>
                            &larr; Previous
                        </Link>
                    ) : (
                        <span className="toggle-btn shadow-sm" style={{ opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1rem' }}>&larr; Previous</span>
                    )}

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
                        Page <strong style={{ color: 'white' }}>{page}</strong> of {totalPages}
                    </span>

                    {page < totalPages ? (
                        <Link href={`/stats?${new URLSearchParams({...urlParams, page: page + 1}).toString()}`} className="toggle-btn shadow-sm" style={{ padding: '0.5rem 1rem' }}>
                            Next &rarr;
                        </Link>
                    ) : (
                        <span className="toggle-btn shadow-sm" style={{ opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1rem' }}>Next &rarr;</span>
                    )}
                </div>
            )}

            {stats.length === 0 && (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', marginTop: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No statistical data matches your current filters.</p>
                </div>
            )}
        </div>
    );
}
