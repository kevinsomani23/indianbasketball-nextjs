'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TournamentBracket({ gender }) {
    const [matchesData, setMatchesData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBracketData = async () => {
            try {
                // Determine gender string used in config
                const genderKey = gender === 'Women' ? "Women's" : "Men's";
                
                const response = await fetch(`/api/brackets?gender=${genderKey}`);
                if (response.ok) {
                    const data = await response.json();
                    setMatchesData(data);
                }
            } catch (error) {
                console.error("Failed to fetch bracket data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBracketData();
    }, [gender]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading Bracket Data...</div>;
    if (!matchesData) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--warning)' }}>Bracket data not available for this tournament yet.</div>;

    const MatchNode = ({ match, isFinal }) => {
        if (!match) return <div className="bracket-node placeholder">TBD</div>;
        
        const homeWon = match.home_score > match.away_score;
        const awayWon = match.away_score > match.home_score;
        
        return (
            <Link href={`/matches/${match.match_id}`} style={{ textDecoration: 'none' }}>
                <div className={`bracket-node ${isFinal ? 'final-node' : ''}`} style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px',
                    minWidth: '200px',
                    marginBottom: '1rem',
                    transition: 'all 0.2s',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px' }}>
                        <span style={{ fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--tappa-orange)' : 'white' }}>{match.home_team}</span>
                        <span style={{ fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--tappa-orange)' : 'white' }}>{match.home_score || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--tappa-orange)' : 'white' }}>{match.away_team}</span>
                        <span style={{ fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--tappa-orange)' : 'white' }}>{match.away_score || '-'}</span>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '3rem', 
            padding: '2rem 1rem',
            overflowX: 'auto',
            minHeight: '400px'
        }}>
            
            {/* Quarter Finals */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', marginTop: 0 }}>Quarter-Finals</h4>
                {matchesData.quarterFinals.map((m, i) => <MatchNode key={i} match={m} />)}
            </div>

            {/* Connecting Lines conceptually here... implementing simple layout first */}
            
            {/* Semi Finals */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <h4 style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', marginTop: 0 }}>Semi-Finals</h4>
                {matchesData.semiFinals.map((m, i) => <MatchNode key={i} match={m} />)}
            </div>

            {/* Finals */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ textAlign: 'center', color: 'var(--tappa-orange)', marginBottom: '2rem', marginTop: 0 }}>Final</h4>
                {matchesData.finals.map((m, i) => <MatchNode key={i} match={m} isFinal={true} />)}
            </div>

        </div>
    );
}
