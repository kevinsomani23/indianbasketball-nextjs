export default function Loading() {
    return (
        <div className="stats-hub animate-fade-in" style={{ padding: '2rem' }}>
            {/* Header Skeleton */}
            <div className="page-header flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
                <div>
                    <div className="skeleton" style={{ width: '250px', height: '45px', marginBottom: '0.5rem' }}></div>
                    <div className="skeleton" style={{ width: '380px', height: '20px' }}></div>
                </div>
                <div className="flex-row gap-md">
                    <div className="skeleton" style={{ width: '160px', height: '36px', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ width: '160px', height: '36px', borderRadius: '12px' }}></div>
                </div>
            </div>

            {/* Filter Skeleton */}
            <div className="glass-card skeleton" style={{ height: '80px', marginBottom: '2rem', borderRadius: '12px' }}></div>

            {/* Table Skeleton */}
            <div className="data-table-container shadow-lg" style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
                <div className="flex-row gap-sm" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                    <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
                    <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
                    <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
                    <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
                    <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
                    <div className="skeleton" style={{ width: '60px', height: '24px' }}></div>
                    <div className="skeleton" style={{ flex: 1, height: '24px' }}></div>
                </div>
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex-row gap-sm" style={{ marginBottom: '8px' }}>
                        <div className="skeleton" style={{ width: '150px', height: '32px' }}></div>
                        <div className="skeleton" style={{ width: '60px', height: '32px' }}></div>
                        <div className="skeleton" style={{ width: '60px', height: '32px' }}></div>
                        <div className="skeleton" style={{ width: '60px', height: '32px' }}></div>
                        <div className="skeleton" style={{ width: '60px', height: '32px' }}></div>
                        <div className="skeleton" style={{ width: '60px', height: '32px' }}></div>
                        <div className="skeleton" style={{ flex: 1, height: '32px' }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
