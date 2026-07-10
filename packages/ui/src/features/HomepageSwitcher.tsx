import React from 'react';

// Assuming basic icon components or SVG imports are available
// For now, using simple text/emoji placeholders
const ChurchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7V2H6v5"/><path d="M12 22v-4"/><path d="M5 22h14"/><path d="M12 18a4 4 0 0 0 0-8c-1.33 0-2.5 0.5-3.26 1.25L4 18h16l-4.74-6.75A4 4 0 0 0 12 18z"/></svg>
);
const CommunityIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M12 22v-4"/><path d="M5 22h14"/></svg>
);
const StoreIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7V4h20v3"/><path d="M6 22V7L2 4h20L18 7v15h-2V7h-4v15h-4V7H8v15H6zM12 10v4"/></svg>
);

interface HomepageSwitcherProps {
    currentHomepage: 'paroki' | 'lingkungan' | 'marketplace';
    userLayer: number;
    lingkunganSlug?: string;
    enableMarketplace: boolean; // From NEXT_PUBLIC_ENABLE_MARKETPLACE
}

const HomepageSwitcher: React.FC<HomepageSwitcherProps> = ({
    currentHomepage,
    userLayer,
    lingkunganSlug,
    enableMarketplace,
}) => {
    const destinations = [
        {
            id: 'paroki',
            label: 'Paroki',
            icon: <ChurchIcon />,
            url: '/', // Assuming root is paroki dashboard or public site
            available: true,
            tooltip: 'Homepage Paroki',
        },
        {
            id: 'lingkungan',
            label: 'Lingkungan',
            icon: <CommunityIcon />,
            url: lingkunganSlug ? `/lingkungan/${lingkunganSlug}` : '#',
            available: userLayer >= 2 && !!lingkunganSlug,
            tooltip: userLayer < 2 ? 'Masuk terlebih dahulu' : (lingkunganSlug ? 'Homepage Lingkungan' : 'Anda belum terdaftar di lingkungan'),
        },
        {
            id: 'marketplace',
            label: 'Pasar Kasih',
            icon: <StoreIcon />,
            url: 'https://ekonomi.paroki-santo-klemens.org', // External URL for Pintu 3
            available: enableMarketplace,
            tooltip: enableMarketplace ? 'Homepage Pasar Kasih' : 'Segera hadir · Fase 4',
        },
    ];

    return (
        <div className="switcher">
            {destinations.map((dest) => (
                <a
                    key={dest.id}
                    href={dest.available ? dest.url : '#'}
                    className={`switcher-item ${currentHomepage === dest.id ? 'active' : ''} ${!dest.available ? 'disabled' : ''}`}
                    aria-label={dest.label}
                    data-tooltip={dest.tooltip}
                    onClick={(e) => {
                        if (!dest.available) {
                            e.preventDefault();
                        }
                        // TODO: Implement actual navigation, potentially with SSO token exchange for marketplace
                    }}
                >
                    {dest.icon}
                    {dest.tooltip && <span className="tooltip">{dest.tooltip}</span>}
                </a>
            ))}
            <style jsx>{`
                .switcher {
                    display: flex;
                    align-items: center;
                    background: rgba(200, 169, 110, 0.08); /* Pintu 1/2 warm gold */
                    border: 1px solid rgba(200, 169, 110, 0.15);
                    border-radius: 24px;
                    padding: 4px 8px;
                    gap: 2px;
                }
                .switcher-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 26px;
                    border-radius: 20px;
                    position: relative;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                }
                .switcher-item svg {
                    width: 14px;
                    height: 14px;
                    color: var(--color-pintu1-text-light); /* Default color */
                }
                .switcher-item.active {
                    background: rgba(200, 169, 110, 0.2);
                }
                .switcher-item.active svg {
                    color: var(--color-pintu1-gold);
                }
                .switcher-item.disabled {
                    opacity: 0.35;
                    cursor: not-allowed;
                }
                .switcher-item.disabled svg {
                    color: var(--color-pintu1-stone); /* Assuming stone color for disabled */
                }
                .switcher-item .tooltip {
                    position: absolute;
                    bottom: calc(100% + 8px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--color-pintu1-primary); /* Darker background for tooltip */
                    color: var(--color-pintu1-text-light);
                    font-size: 0.6rem;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    padding: 4px 10px;
                    border-radius: 6px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                }
                .switcher-item:hover .tooltip {
                    opacity: 1;
                }
                /* Context-specific styles */
                [data-homepage-context="marketplace"] .switcher-item.active svg {
                    color: var(--color-pintu3-accent); /* Green for marketplace */
                }
            `}</style>
        </div>
    );
};

export default HomepageSwitcher;