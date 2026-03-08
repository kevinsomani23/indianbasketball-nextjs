"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ players: [], teams: [], tournaments: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Close dropdown if clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch results when query changes
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults({ players: [], teams: [], tournaments: [] });
            setIsOpen(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <div className="search-bar-container" ref={wrapperRef} style={{ position: 'relative' }}>
            <div className="search-bar">
                <input 
                    type="text" 
                    placeholder="Search players, teams..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2) setIsOpen(true);
                    }}
                />
            </div>

            {isOpen && (results.players.length > 0 || results.teams.length > 0 || results.tournaments.length > 0) && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '320px',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    marginTop: '8px',
                    padding: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    
                    {results.players.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Players</div>
                            {results.players.map(p => (
                                <Link href={`/players/${p.id}`} key={`p-${p.id}`} onClick={() => setIsOpen(false)} style={{
                                    display: 'block', padding: '0.5rem', color: 'white', textDecoration: 'none', borderRadius: '4px', ':hover': { backgroundColor: 'var(--bg-primary)' }
                                }}>
                                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.team_name} | {p.gender === 'Women' ? "Women's" : "Men's"}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.teams.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Teams</div>
                            {results.teams.map(t => (
                                <Link href={`/teams/${t.id}`} key={`t-${t.id}`} onClick={() => setIsOpen(false)} style={{
                                    display: 'block', padding: '0.5rem', color: 'white', textDecoration: 'none', borderRadius: '4px'
                                }}>
                                    <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.gender === 'Women' ? "Women's Team" : "Men's Team"}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.tournaments.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Tournaments</div>
                            {results.tournaments.map(t => (
                                <Link href={`/tournaments/${t.id}`} key={`tour-${t.id}`} onClick={() => setIsOpen(false)} style={{
                                    display: 'block', padding: '0.5rem', color: 'white', textDecoration: 'none', borderRadius: '4px'
                                }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{t.name}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.matches && results.matches.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Matches</div>
                            {results.matches.map(m => (
                                <Link href={`/matches/${m.id}`} key={`m-${m.id}`} onClick={() => setIsOpen(false)} style={{
                                    display: 'block', padding: '0.5rem', color: 'white', textDecoration: 'none', borderRadius: '4px'
                                }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{m.team_a} vs {m.team_b}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.stage} | {m.tourney_name}</div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {isOpen && !isLoading && results.players.length === 0 && results.teams.length === 0 && results.tournaments.length === 0 && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, width: '300px', background: 'var(--surface-color)', border: '1px solid var(--border-glass)', borderRadius: '8px', marginTop: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 1000, color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem'
                }}>
                    No matching results found.
                </div>
            )}
        </div>
    );
}
