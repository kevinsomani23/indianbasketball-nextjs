import { query } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
    title: 'Teams Index | Indian Basketball',
};

export default async function TeamsIndex() {
    const teams = await query(`
    SELECT t.id, t.name, COUNT(DISTINCT p.player_id) as total_canonical_players
    FROM Teams t
    LEFT JOIN Players p ON t.id = p.team_id
    GROUP BY t.id
    ORDER BY t.name ASC
  `);

    return (
        <div className="teams-index">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>Team Directory</h1>
                <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Alphabetical listing of all Indian Basketball state and department teams.</p>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align">Team Name</th>
                            <th>Total Canonical Players (All-Time)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((t) => (
                            <tr key={t.id}>
                                <td className="left-align">
                                    <Link href={`/teams/${t.id}`}>
                                        <strong style={{ color: 'white', fontSize: '1.1rem' }}>{t.name}</strong>
                                    </Link>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{t.total_canonical_players}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
