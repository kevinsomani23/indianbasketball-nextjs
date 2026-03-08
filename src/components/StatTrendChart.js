'use client';

import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(9, 9, 11, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                fontSize: '0.85rem'
            }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} style={{ color: entry.color, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
                        <span style={{ opacity: 0.9 }}>{entry.name}:</span>
                        <span style={{ fontWeight: 800 }}>{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function StatTrendChart({ data }) {
    // Hidden by default: GmScr (Advanced), show others
    const [visibleStats, setVisibleStats] = useState({
        pts: true,
        reb: true,
        ast: true,
        gm_scr: false
    });

    if (!data || data.length === 0) return null;

    // Use unique IDs or index for keys to prevent Recharts drift
    const chartData = data.map((d, idx) => ({
        ...d,
        display_label: d.opponent || `Game ${idx + 1}`,
        id: d.id || `game-${idx}`
    }));

    const toggleStat = (stat) => {
        setVisibleStats(prev => ({
            ...prev,
            [stat]: !prev[stat]
        }));
    };

    const statConfig = [
        { key: 'pts', label: 'PTS', color: 'var(--tappa-orange)' },
        { key: 'reb', label: 'REB', color: '#3b82f6' }, // Blue
        { key: 'ast', label: 'AST', color: '#10b981' }, // Emerald
        { key: 'gm_scr', label: 'GmScr', color: '#facc15' } // Gold
    ];

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '4px', height: '18px', background: 'var(--tappa-orange)', borderRadius: '2px' }}></span>
                    Recent Performance Trend
                </h3>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {statConfig.map(stat => (
                        <button 
                            key={stat.key}
                            onClick={() => toggleStat(stat.key)} 
                            style={{ 
                                padding: '6px 14px', 
                                borderRadius: '20px', 
                                fontSize: '0.7rem', 
                                cursor: 'pointer',
                                border: '1px solid var(--border-glass)',
                                background: visibleStats[stat.key] 
                                    ? `${stat.color}15` 
                                    : 'rgba(255,255,255,0.02)',
                                color: visibleStats[stat.key] ? stat.color : 'var(--text-muted)',
                                fontWeight: visibleStats[stat.key] ? 700 : 400,
                                transition: 'all 0.2s'
                            }}
                        >
                            {visibleStats[stat.key] ? '✓ ' : '+ '}{stat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                        data={chartData} 
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        onMouseMove={(state) => {
                            // Manual fix for tooltip index sync if needed, 
                            // though unique keys and proper data mapping usually fix it.
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="display_label" 
                            stroke="rgba(255,255,255,0.4)" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.4)" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} 
                        />
                        
                        {statConfig.map(stat => (
                            visibleStats[stat.key] && (
                                <Line 
                                    key={stat.key}
                                    name={stat.label}
                                    type="monotone" 
                                    dataKey={stat.key} 
                                    stroke={stat.color} 
                                    strokeWidth={3}
                                    dot={{ fill: stat.color, r: 4, strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                                    animationDuration={800}
                                    connectNulls
                                />
                            )
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.6, letterSpacing: '0.1em' }}>
                SHOWING LAST {data.length} GAMES • INTERACTIVE TOOLTIP READY
            </div>
        </div>
    );
}
