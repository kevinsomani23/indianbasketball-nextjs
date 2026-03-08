export default function Loading() {
    return (
        <div className="team-profile-page animate-fade-in" style={{ padding: '2rem 5%' }}>
            {/* Header Skeleton */}
            <div className="glass-card flex-between" style={{ padding: '2.5rem 3rem', marginBottom: '2rem', borderRadius: '20px', flexWrap: 'wrap', gap: '2rem' }}>
                <div className="flex-row" style={{ gap: '2.5rem' }}>
                    <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', flexShrink: 0 }}></div>
                    <div>
                        <div className="skeleton" style={{ width: '300px', height: '48px', marginBottom: '1rem' }}></div>
                        <div className="flex-row gap-sm">
                            <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '20px' }}></div>
                            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px' }}></div>
                        </div>
                    </div>
                </div>
                <div className="flex-row gap-md">
                    <div className="skeleton" style={{ width: '100px', height: '60px', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ width: '100px', height: '60px', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ width: '100px', height: '60px', borderRadius: '12px' }}></div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="skeleton" style={{ width: '200px', height: '30px' }}></div>
                    <div className="glass-card skeleton" style={{ height: '400px', borderRadius: '16px' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="skeleton" style={{ width: '150px', height: '30px' }}></div>
                    <div className="glass-card skeleton" style={{ height: '200px', borderRadius: '16px' }}></div>
                    <div className="glass-card skeleton" style={{ height: '200px', borderRadius: '16px' }}></div>
                </div>
            </div>
        </div>
    );
}
