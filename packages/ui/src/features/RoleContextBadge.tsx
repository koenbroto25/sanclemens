import React from 'react';

interface RoleContextBadgeProps {
    homepageContext: 'paroki' | 'lingkungan' | 'marketplace';
}

const RoleContextBadge: React.FC<RoleContextBadgeProps> = ({ homepageContext }) => {
    let label = '';
    let bgColorVar = '';
    let textColorVar = '';

    switch (homepageContext) {
        case 'paroki':
            label = 'Paroki';
            bgColorVar = 'rgba(200, 169, 110, 0.1)'; // Gold wash
            textColorVar = 'var(--color-pintu1-gold)';
            break;
        case 'lingkungan':
            label = 'Lingkungan';
            bgColorVar = 'rgba(92, 58, 30, 0.1)'; // Pintu 2 warm secondary
            textColorVar = 'var(--color-pintu2-secondary)'; // Use Pintu 2 specific color
            break;
        case 'marketplace':
            label = 'Pasar Kasih';
            bgColorVar = 'rgba(27, 94, 32, 0.1)'; // Pintu 3 deep green
            textColorVar = 'var(--color-pintu3-primary)'; // Use Pintu 3 specific color
            break;
        default:
            label = 'Unknown';
            bgColorVar = 'rgba(150,150,150,0.1)';
            textColorVar = '#9e9e9e';
    }

    return (
        <span style={{ backgroundColor: bgColorVar, color: textColorVar }} className="role-context-badge">
            {label}
            <style jsx>{`
                .role-context-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.3rem 0.7rem;
                    border-radius: 16px;
                    font-family: var(--font-body);
                    font-weight: 500;
                    font-size: 0.65rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                }
            `}</style>
        </span>
    );
};

export default RoleContextBadge;