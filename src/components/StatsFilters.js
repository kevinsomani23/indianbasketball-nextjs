'use client';

import { useRouter } from 'next/navigation';

export default function StatsFilters({ entity, mode, sort, order, searchFilter, gender, tourneyId, groupedTourneyOptions }) {
    const router = useRouter();

    const handleChange = (e) => {
        // Find the form element and submit it programmatically
        const form = e.target.closest('form');
        if (form) {
            // We use standard form submission to update the URL parameters
            // This will trigger a server-side re-render of the page data
            form.submit();
        }
    };

    return (
        <form action="/stats" method="GET" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input type="hidden" name="entity" value={entity} />
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />

            <div style={{ flex: '2', minWidth: '250px' }}>
                <label className="filter-label">Search {entity === 'players' ? 'Player' : 'Team'}</label>
                <input 
                    type="text" 
                    name="q" 
                    defaultValue={searchFilter} 
                    placeholder="Enter name..." 
                    className="filter-input" 
                    // Optional: We could add a debounce here, but for now we'll stick to 'Enter' key
                    // to avoid spamming the server with every keystroke.
                />
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
                <label className="filter-label">Gender</label>
                <select name="gender" defaultValue={gender} className="filter-select" onChange={handleChange}>
                    <option value="all">All Genders</option>
                    <option value="M">Men's</option>
                    <option value="W">Women's</option>
                </select>
            </div>

            <div style={{ flex: '1.5', minWidth: '200px' }}>
                <label className="filter-label">Championship</label>
                <select name="tournament" defaultValue={tourneyId} className="filter-select" onChange={handleChange}>
                    <option value="all">All Championships</option>
                    {groupedTourneyOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>

            {/* We keep the apply button for the search input, but it's optional for dropdowns now */}
            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem', height: '42px' }}>Search</button>
            <a href="/stats" className="btn-secondary" style={{ padding: '0.6rem 1.5rem', height: '42px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>Reset</a>
        </form>
    );
}
