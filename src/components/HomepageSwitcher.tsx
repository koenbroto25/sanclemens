"use client"

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { ChurchIcon, UsersIcon, ShoppingBagIcon } from 'lucide-react';
import { Button } from '@paroki/ui/base/button'; // Assuming Button component is available from @paroki/ui

interface HomepageSwitcherProps {
  currentHomepage: 'paroki' | 'lingkungan' | 'marketplace' | 'gate-hub';
  userLayer: number;
  lingkunganSlug?: string;
}

export function HomepageSwitcher({ currentHomepage, userLayer, lingkunganSlug }: HomepageSwitcherProps) {
  const router = useRouter();
  const setHomepageContext = useAuthStore((s) => s.setHomepageContext);

  if (userLayer < 2) {
    // Switcher not displayed for Layer 0 (public) or Layer 1 (waiting room)
    return null;
  }

  const destinations = [
    {
      id: 'paroki',
      label: 'Paroki',
      icon: ChurchIcon,
      url: '/dashboard',
      available: true,
    },
    {
      id: 'lingkungan',
      label: 'Lingkungan',
      icon: UsersIcon,
      url: `/lingkungan/${lingkunganSlug || ''}`,
      available: userLayer >= 2 && !!lingkunganSlug,
      disabledMessage: 'Anda belum terdaftar di lingkungan manapun.',
    },
    {
      id: 'marketplace',
      label: 'Pasar Kasih',
      icon: ShoppingBagIcon,
      url: '/pasar-kasih',
      available: process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE === 'true' || process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE_COMING_SOON === 'true',
      badge: process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE_COMING_SOON === 'true' ? 'Segera Hadir' : undefined,
    },
  ];

  const handleSwitch = (portalId: string, url: string, isDisabled: boolean = false) => {
    if (isDisabled) return;
    setHomepageContext(portalId as any); // Type assertion, as 'gate-hub' is not in the store's HomepageContext type
    document.cookie = `homepage-context=${portalId}; path=/; httpOnly=true`; // Ensure httpOnly=true
    router.push(url);
  };

  return (
    <div className="flex space-x-2 p-2 rounded-full bg-gray-100 border border-gray-200">
      {destinations.map((portal) => {
        const isActive = currentHomepage === portal.id;
        const isDisabled = !portal.available;
        const buttonClass = `relative p-2 rounded-full transition-all duration-200 
          ${isActive ? 'bg-amber-600 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-200'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;

        return (
          <div key={portal.id} title={isDisabled ? portal.disabledMessage || portal.badge : portal.label}>
            <Button
              className={buttonClass}
              onClick={() => handleSwitch(portal.id, portal.url, isDisabled)}
              disabled={isDisabled}
              size="icon"
            >
              <portal.icon className="h-5 w-5" />
              {portal.badge && !isActive && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] px-1 py-0.5 rounded-full leading-none">
                  {portal.badge}
                </span>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
