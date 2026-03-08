export default function Loading() {
    return (
        <div className="match-boxscore-page animate-fade-in" style={{ backgroundColor: 'var(--dark-bg)', minHeight: '100vh', padding: '2rem 5%' }}>
            {/* Topbar Navigation Skeleton */}
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div className="skeleton" style={{ width: '100px', height: '24px' }}></div>
                <div className="flex-row gap-sm">
                    <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '6px' }}></div>
                    <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '6px' }}></div>
                </div>
            </div>

            {/* Header Scoreboard Skeleton */}
            <div style={{ marginBottom: '3rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2.5rem' }}>
                <div className="skeleton" style={{ width: '300px', height: '20px', margin: '0 auto 1rem auto' }}></div>
                <div className="flex-center" style={{ gap: '3rem', margin: '0 0 2rem 0', flexWrap: 'wrap' }}>
                    <div className="flex-row" style={{ gap: '20px' }}>
                        <div className="skeleton" style={{ width: '150px', height: '40px' }}></div>
                        <div className="skeleton" style={{ width: '70px', height: '70px', borderRadius: '50%' }}></div>
                        <div className="skeleton" style={{ width: '80px', height: '70px' }}></div>
                    </div>
                    <div className="skeleton" style={{ width: '40px', height: '30px' }}></div>
                    <div className="flex-row" style={{ gap: '20px' }}>
                        <div className="skeleton" style={{ width: '80px', height: '70px' }}></div>
                        <div className="skeleton" style={{ width: '70px', height: '70px', borderRadius: '50%' }}></div>
                        <div className="skeleton" style={{ width: '150px', height: '40px' }}></div>
                    </div>
                </div>
                {/* Team Stat Strip Skeleton */}
                <div className="flex-center" style={{ gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="flex-col gap-xs" style={{ alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '60px', height: '14px' }}></div>
                            <div className="skeleton" style={{ width: '100px', height: '20px' }}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Boxscore Tables Skeletons */}
            <div>
                <div className="skeleton" style={{ width: '200px', height: '30px', marginBottom: '1rem' }}></div>
                <div className="glass-card skeleton" style={{ height: '400px', marginBottom: '3rem', borderRadius: '12px' }}></div>
                
                <div className="skeleton" style={{ width: '200px', height: '30px', marginBottom: '1rem' }}></div>
                <div className="glass-card skeleton" style={{ height: '400px', borderRadius: '12px' }}></div>
            </div>
        </div>
    );
}
