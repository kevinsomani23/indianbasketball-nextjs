"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function RadarChartWidget({ stats }) {
    // Normalize stats to a 0-100 scale based on standard "Star" benchmarks in Indian Basketball
    // e.g., 25 PPG is a 100 rating for Scoring.

    const normalize = (val, max) => {
        const num = Number(val);
        if (isNaN(num)) return 0;
        return Math.min(Math.max(Math.round((num / max) * 100), 0), 100);
    };

    const data = [
        {
            subject: 'Scoring (PTS)',
            A: normalize(stats.pts, 25), // 25 PPG = Elite
            fullMark: 100,
        },
        {
            subject: 'Playmaking (AST)',
            A: normalize(stats.ast, 6), // 6 APG = Elite
            fullMark: 100,
        },
        {
            subject: 'Efficiency (TS%)',
            A: normalize(stats.ts_pct, 65), // 65% TS = Elite
            fullMark: 100,
        },
        {
            subject: 'Defense (STL+BLK)',
            A: normalize((parseFloat(stats.stl || 0) + parseFloat(stats.blk || 0)), 4), // 4 Stocks = Elite
            fullMark: 100,
        },
        {
            subject: 'Rebounding (REB)',
            A: normalize(stats.reb, 12), // 12 RPG = Elite
            fullMark: 100,
        },
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid var(--tappa-orange)', padding: '10px', borderRadius: '5px', color: 'white' }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].payload.subject}</p>
                    <p style={{ margin: 0, color: 'var(--tappa-orange)' }}>Rating: {payload[0].value}/100</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'Space Grotesk' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                    name="Player"
                    dataKey="A"
                    stroke="var(--tappa-orange)"
                    strokeWidth={2}
                    fill="var(--tappa-orange-glow)"
                    fillOpacity={0.6}
                />
                <Tooltip content={<CustomTooltip />} />
            </RadarChart>
        </ResponsiveContainer>
    );
}
