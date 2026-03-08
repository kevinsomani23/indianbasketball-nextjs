// Reusable SQL snippets for database queries

// Resolves opponent name based on home/away assignment
export const SQL_OPP_NAME = `
    (SELECT name FROM Teams WHERE id = (
        CASE WHEN m.home_team_id = ? THEN m.away_team_id ELSE m.home_team_id END
    ))
`;

// Resolves the team's score and the opponent's score based on home/away assignment
// Usage: `SELECT ..., ${SQL_TEAM_SCORE} as team_score, ${SQL_OPP_SCORE} as opp_score`
export const SQL_TEAM_SCORE = `(CASE WHEN m.home_team_id = ? THEN m.home_score ELSE m.away_score END)`;
export const SQL_OPP_SCORE = `(CASE WHEN m.home_team_id = ? THEN m.away_score ELSE m.home_score END)`;

// Reusable WHERE clause for checking if a tournament filter is active or 'all'
// Requires two identical parameter bindings: ? and ?
export const SQL_TOURNEY_FILTER = `(? = 'all' OR tournament_id = ?)`;
export const SQL_TOURNEY_FILTER_PREFIXED = `(? = 'all' OR b.tournament_id = ?)`;

// Reusable WHERE clause for active players (those who actually played minutes)
export const SQL_ACTIVE_PLAYERS = `mins_dec > 0`;
