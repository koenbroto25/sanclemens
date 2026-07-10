'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils'; // Assuming this utility exists for classNames

export default function SOSButton() {
  const [userLayer, setUserLayer] = useState<number | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserLayer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('access_layer')
          .eq('id', user.id)
          .single();
        setUserLayer(profile?.access_layer || 0);
      } else {
        setUserLayer(0); // Public user
      }
    }
    loadUserLayer();
  }, [pathname, supabase]);

  // Only show the button for Layer 2+ users and not on the SOS page itself
  if (userLayer === null || userLayer < 2 || pathname.startsWith('/pastoral/sos')) {
    return null;
  }

  return (
    <Link href="/pastoral/sos" passHref>
      <button
        className={cn(
          "fixed z-50 rounded-full",
          "bg-error shadow-lg transition-all duration-300 ease-in-out",
          "hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-error/50",
          "flex items-center justify-center text-white",
          "w-16 h-16", // Default size for desktop
          "md:w-20 md:h-20", // Larger size for mobile as per UI/UX notes
          "bottom-6 right-6", // Desktop position
          "md:bottom-20 md:right-4", // Mobile position (inverted for mobile-first approach as per Design System)
          // Pulse animation for critical visibility
          "animate-pulse-slow" // Assuming custom CSS for this animation
        )}
        aria-label="Pastoral SOS"
      >
        <span className="text-3xl md:text-4xl">🆘</span>
      </button>
    </Link>
  );
}
