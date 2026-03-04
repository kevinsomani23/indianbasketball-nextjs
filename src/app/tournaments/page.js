import { query } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
    title: 'Tournament Index | Indian Basketball',
};

export default async function TournamentsIndex() {
    const tournaments = await query(`
    SELECT t.id, t.name, COUNT(DISTINCT m.home_team_id) + COUNT(DISTINCT m.away_team_id) as teams_count, COUNT(DISTINCT m.match_id) as matches_count
    FROM Tournaments t
    LEFT JOIN Matches m ON t.id = m.tournament_id
    GROUP BY t.id
    ORDER BY t.name DESC
  `);

    return (
        <div className="tournaments-index">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>Tournament Overview</h1>
                <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Explore the iterations of the Senior National Championships.</p>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Tournament Name</th>
                            <th>Total Matches Played</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tournaments.map((t) => (
                            <tr key={t.id}>
                                <td className="left-align">
                                    <Link href={`/tournaments/${t.id}`}>
                                        <strong style={{ color: 'white', fontSize: '1.1rem' }}>{t.name}</strong>
                                    </Link>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{t.matches_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
