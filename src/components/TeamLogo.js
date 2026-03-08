import React from 'react';
import Image from 'next/image';

// Pre-defined valid logos to avoid hydration mismatch, fs dependencies, and client-side error handling
const KNOWN_LOGOS = [
    'Chhattisgarh', 'Delhi', 'Gujarat', 'Indian Railways', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
    'Services', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

const TeamLogo = ({ teamName, width = 40, height = 40, className = '' }) => {
    // Basic sanitization
    const sanitizeFilename = (name) => {
        if (!name) return 'default';
        return name.replace(/[^\w\s-]/g, '').trim();
    };

    const filename = sanitizeFilename(teamName);
    const hasLogo = KNOWN_LOGOS.includes(filename);

    if (!hasLogo || !teamName) {
        return (
            <div 
                className={className} 
                style={{ 
                    width, 
                    height, 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border-glass)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: width > 30 ? '0.8rem' : '0.6rem',
                    fontWeight: 'bold',
                    color: 'var(--text-muted)'
                }}
            >
                {teamName ? teamName.charAt(0).toUpperCase() : '?'}
            </div>
        );
    }

    return (
        <Image
            src={`/logos/${filename}.jpg`}
            alt={`${teamName} Logo`}
            width={width}
            height={height}
            className={className}
            style={{ objectFit: 'contain', borderRadius: '4px' }}
        />
    );
};

export default TeamLogo;
