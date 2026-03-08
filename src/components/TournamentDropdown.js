'use client';
import { useRouter } from 'next/navigation';

export default function TournamentDropdown({ teamId, gender, tournaments, currentTourney }) {
    const router = useRouter();
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                Tournament
            </label>
            <select
                value={currentTourney}
                onChange={(e) => router.push(`/teams/${teamId}?gender=${gender}&tourney=${e.target.value}`)}
                style={{
                    background: 'var(--dark-panel)',
                    color: 'white',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0.4rem 2.25rem 0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.65rem center',
                    minWidth: '220px',
                }}
            >
                <option value="all">All Tournaments</option>
                {tournaments.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
            </select>
        </div>
    );
}
