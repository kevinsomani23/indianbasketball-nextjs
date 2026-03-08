'use client';

import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, YAxis as RechartsYAxis
} from 'recharts';

/**
 * MomentumChart: Visualizes the lead throughout the game.
 * Positive values = teamA (Home) lead
 * Negative values = teamB (Away) lead
 */
export default function MomentumChart({ periods, teamAPeriods, teamBPeriods, teamAName, teamBName }) {
    // Generate cumulative scoring data
    let scoreA = 0;
    let scoreB = 0;
    
    const data = [
        { name: 'Start', lead: 0, scoreA: 0, scoreB: 0, label: '0-0' }
    ];

    periods.forEach(p => {
        scoreA += (teamAPeriods[p] || 0);
        scoreB += (teamBPeriods[p] || 0);
        data.push({
            name: p,
            lead: scoreA - scoreB,
            scoreA,
            scoreB,
            label: `${scoreA}-${scoreB}`
        });
    });

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const aLead = d.lead > 0;
            const bLead = d.lead < 0;
            const leaderName = aLead ? teamAName : bLead ? teamBName : 'Tied';
            const leadColor = aLead ? 'var(--tappa-orange)' : bLead ? '#3b82f6' : 'var(--text-muted)';
            
            return (
                <div style={{
                    background: 'rgba(9, 9, 11, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    fontSize: '0.8rem'
                }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        {d.name} Results
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: leadColor }} />
                        <span style={{ fontWeight: 700, color: 'white' }}>{leaderName} {d.lead !== 0 && `+${Math.abs(d.lead)}`}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontFamily: 'Outfit', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>
                        {d.scoreA} <span style={{ opacity: 0.3 }}>:</span> {d.scoreB}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Calculate max lead for scaling
    const maxLead = Math.max(...data.map(d => Math.abs(d.lead)), 10) + 5;

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--tappa-orange)' }} />
                        Match Lead Tracker
                    </h3>
                    <p style={{ margin: '4px 0 0 22px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Scoring momentum relative to match baseline
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.7rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--tappa-orange)' }} />
                        {teamAName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6' }} />
                        {teamBName}
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="leadGradientA" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--tappa-orange)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="var(--tappa-orange)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="leadGradientB" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                            dy={10}
                        />
                        
                        <RechartsYAxis 
                            domain={[-maxLead, maxLead]} 
                            hide 
                        />
                        
                        <Tooltip content={<CustomTooltip />} />
                        
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        
                        {/* Shaded Areas */}
                        <Area 
                            type="monotone" 
                            dataKey="lead" 
                            stroke="var(--tappa-orange)" 
                            fill="url(#leadGradientA)" 
                            strokeWidth={3}
                            animationDuration={1500}
                            connectNulls
                            baseValue={0}
                        />

                        {/* Separate Area for B lead if strictly needed, 
                            but a single area with dual gradient stops or multiple plots is better.
                            For simplicity, we use one area and let the gradient handle it, 
                            or we can use 'monotone' and handle the fill correctly.
                        */}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0 10px', 
                fontSize: '0.7rem', 
                color: 'var(--text-muted)', 
                marginTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '0.8rem'
            }}>
                <span style={{ color: '#3b82f6', opacity: 0.8 }}>← {teamBName} LEAD</span>
                <span style={{ color: 'var(--tappa-orange)', opacity: 0.8 }}>{teamAName} LEAD →</span>
            </div>
        </div>
    );
}
