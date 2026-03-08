import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';

function fmtDate(d) {
    if (!d) return null;
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
}

const STAGE_COLORS = {
    'Final': 'var(--warning)',
    'Finals': 'var(--warning)',
    'Semifinal': 'var(--badge-td)',
    'Semifinals': 'var(--badge-td)',
    'Semi Final': 'var(--badge-td)',
    'Quarter Final': '#60a5fa',
    'Quarterfinal': '#60a5fa',
    'Quarter Finals': '#60a5fa',
};

export default function MatchCard({ match }) {
    const { match_id, won, opp_name, own_name, tourney_name, team_pts, opp_pts, match_date, stage } = match;
    const margin = team_pts - opp_pts;
    const marginStr = margin > 0 ? `+${margin}` : `${margin}`;
    const stageColor = stage ? (STAGE_COLORS[stage] || 'var(--text-muted)') : null;

    return (
        <Link href={`/matches/${match_id}`} style={{ textDecoration: 'none', display: 'block' }} className={`match-card ${won ? 'match-win' : 'match-loss'}`}>
            <div className="match-card-inner" style={{
                padding: '0.9rem 1.1rem',
                borderBottom: '1px solid var(--border-glass)',
                background: 'transparent',
                transition: 'background 0.18s',
                cursor: 'pointer',
            }}>
                {/* Top row: tournament · stage | date | W/L badge */}
                <div className="flex-between gap-sm" style={{ marginBottom: '0.6rem' }}>
                    <div className="flex-row" style={{ gap: '0.4rem', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tourney_name}
                        </span>
                        {stage && (
                            <span style={{
                                fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                                color: stageColor, whiteSpace: 'nowrap', flexShrink: 0,
                            }}>· {stage}</span>
                        )}
                    </div>
                    <div className="flex-row" style={{ gap: '0.4rem', flexShrink: 0 }}>
                        {match_date && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500 }}>{fmtDate(match_date)}</span>
                        )}
                        <span style={{
                            fontSize: '0.6rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase',
                            padding: '0.14rem 0.45rem', borderRadius: '4px',
                            background: won ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: won ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${won ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>{won ? 'W' : 'L'}</span>
                    </div>
                </div>

                {/* Matchup: own logo+name — score — opp logo+name */}
                <div className="flex-row gap-sm">
                    {/* Own team */}
                    <div className="flex-col gap-xs" style={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                        {own_name && <TeamLogo teamName={own_name} width={28} height={28} />}
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'white', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                            {own_name || 'Home'}
                        </div>
                    </div>

                    {/* Score centre */}
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '90px' }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, lineHeight: 1 }}>
                            <span style={{ fontSize: '1.7rem', color: won ? 'var(--success)' : 'white' }}>{team_pts}</span>
                            <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.15)', margin: '0 0.15rem' }}>–</span>
                            <span style={{ fontSize: '1.7rem', color: won ? 'white' : 'var(--danger)' }}>{opp_pts}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, marginTop: '0.1rem', color: won ? 'var(--success)' : 'var(--danger)' }}>
                            {marginStr} PTS
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex-col gap-xs" style={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                        {opp_name && <TeamLogo teamName={opp_name} width={28} height={28} />}
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                            {opp_name || 'Away'}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
