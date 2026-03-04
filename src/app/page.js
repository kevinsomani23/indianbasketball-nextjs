import { queryOne, query } from '@/lib/db';
import Link from 'next/link';

export default async function Home() {
  // Execute lightning-fast server side queries
  const stats = await Promise.all([
    queryOne('SELECT COUNT(*) as count FROM Tournaments'),
    queryOne('SELECT COUNT(*) as count FROM Teams'),
    queryOne('SELECT COUNT(*) as count FROM Players'),
    queryOne('SELECT COUNT(*) as count FROM Matches'),
  ]);

  const totalTourneys = stats[0].count;
  const totalTeams = stats[1].count;
  const totalPlayers = stats[2].count;
  const totalMatches = stats[3].count;

  // Let's also grab some recent "Star Performances" (highest scoring games)
  const topPerformances = await query(`
    SELECT p.name, t.name as team_name, b.pts, b.reb, b.ast, tour.name as tourney
    FROM Boxscores b
    JOIN Players p ON b.player_id = p.player_id
    JOIN Teams t ON b.team_id = t.id
    JOIN Matches m ON b.match_id = m.match_id
    JOIN Tournaments tour ON m.tournament_id = tour.id
    ORDER BY b.pts DESC
    LIMIT 5
  `);

  return (
    <div className="home-dashboard">
      <div className="welcome-banner">
        <h1>Indian Basketball Encyclopedia</h1>
        <p className="subtitle">The definitive statistical reference for the Senior National Championships.</p>
      </div>

      <div className="stat-grid">
        <div className="glass-card stat-card">
          <div className="stat-label">Tournaments</div>
          <div className="stat-value">{totalTourneys}</div>
        </div>
        <div className="glass-card stat-card text-success">
          <div className="stat-label">Total Matches</div>
          <div className="stat-value">{totalMatches}</div>
        </div>
        <div className="glass-card stat-card text-warning">
          <div className="stat-label">Canonical Players</div>
          <div className="stat-value">{totalPlayers}</div>
        </div>
        <div className="glass-card stat-card text-primary">
          <div className="stat-label">Unique Teams</div>
          <div className="stat-value">{totalTeams}</div>
        </div>
      </div>

      <div className="marquee-section">
        <h2 className="section-title">Highest Single-Game Scores</h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="left-align">Player</th>
                <th>Team</th>
                <th>Tournament</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
              </tr>
            </thead>
            <tbody>
              {topPerformances.map((perf, index) => (
                <tr key={index}>
                  <td className="left-align" style={{ color: 'var(--tappa-orange)' }}><strong>{perf.name}</strong></td>
                  <td>{perf.team_name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{perf.tourney}</td>
                  <td className="leader">{perf.pts}</td>
                  <td>{perf.reb}</td>
                  <td>{perf.ast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
