'use client';

import { useRouter } from 'next/navigation';

export default function TournamentSelector({ tourneys, selectedId }) {
    const router = useRouter();

    const handleChange = (e) => {
        const id = e.target.value;
        router.push(`/tournaments?tournament=${id}`);
    };

    return (
        <div className="dashboard-selector">
            <select 
                onChange={handleChange}
                value={selectedId}
                style={{ 
                    padding: '12px 20px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border-glass)', 
                    borderRadius: '12px', 
                    color: 'white', 
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                }}
            >
                {tourneys.map(tour => (
                    <option key={tour.id} value={tour.id} style={{ background: 'var(--dark-bg)', color: 'white' }}>
                        {tour.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
