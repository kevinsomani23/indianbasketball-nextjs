'use client';

import dynamic from 'next/dynamic';

const RadarChartWidget = dynamic(() => import('@/components/RadarChartWidget'), { 
    ssr: false,
    loading: () => <div style={{ height: '300px', width: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', border: '1px dashed var(--border-glass)' }} />
});
const StatTrendChart = dynamic(() => import('@/components/StatTrendChart'), { 
    ssr: false,
    loading: () => <div style={{ height: '400px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-glass)' }} />
});

export function PlayerRadar({ stats }) {
    return (
        <div style={{ minWidth: '300px', flex: 1, display: 'flex', justifyContent: 'center' }}>
            <RadarChartWidget stats={stats} />
        </div>
    );
}

export function PlayerTrend({ data }) {
    return <StatTrendChart data={data} />;
}
