import { query } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
    title: 'Player Index | Indian Basketball',
};

export default async function PlayersIndex() {
    // Fetch all players for the massive BBRef index
    // Including their primary team for context
    const players = await query(`
    SELECT p.player_id, p.name, p.position, p.height, p.age, t.name as team_name
    FROM Players p
    JOIN Teams t ON p.team_id = t.id
    ORDER BY p.name ASC
  `);

    return (
        <div className="players-index">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>Player Index</h1>
                <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Historical directory of all {players.length} canonical Senior National players.</p>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="left-align" style={{ width: '25%' }}>Player Name</th>
                            <th className="left-align">Current/Last Team</th>
                            <th>Pos</th>
                            <th>Height</th>
                            <th>Age</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((p) => (
                            <tr key={p.player_id}>
                                <td className="left-align">
                                    <Link href={`/players/${p.player_id}`}>
                                        <strong>{p.name}</strong>
                                    </Link>
                                </td>
                                <td className="left-align" style={{ color: 'var(--text-secondary)' }}>{p.team_name}</td>
                                <td style={{ color: p.position ? 'white' : 'var(--border-glass)' }}>{p.position || '-'}</td>
                                <td style={{ color: p.height ? 'white' : 'var(--border-glass)' }}>{p.height || '-'}</td>
                                <td style={{ color: p.age ? 'white' : 'var(--border-glass)' }}>{p.age || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
