'use client';

export default function ShareButton() {
    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href).then(() => {
                // Flash a little feedback
                const el = document.getElementById('share-btn-text');
                if (el) { el.textContent = 'Copied!'; setTimeout(() => { el.textContent = 'Share'; }, 2000); }
            });
        }
    };

    return (
        <button
            id="share-btn"
            onClick={handleShare}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span id="share-btn-text">Share</span>
        </button>
    );
}
