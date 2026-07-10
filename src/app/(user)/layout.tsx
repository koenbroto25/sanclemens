'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

interface User {
  id: string;
  full_name: string;
  nama_baptis?: string;
  role: string;
  lingkungan_slug?: string;
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
        setUser(profile);
      }
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const baseNavItems = [
    { name: 'Beranda', href: '/dashboard', icon: '🏠', roles: ['*'] },
    { name: 'Profil', href: '/dashboard/profil', icon: '👤', roles: ['*'] },
    { name: 'Keluarga', href: '/dashboard/keluarga', icon: '👨‍👩‍👧‍👦', roles: ['*'] },
    { name: 'Sakramen', href: '/dashboard/sakramen', icon: '✝️', roles: ['*'] },
    { name: 'Usaha Saya', href: '/dashboard/usaha', icon: '💼', roles: ['*'] },
    { name: 'Keahlian & Charity', href: '/dashboard/keahlian', icon: '🤝', roles: ['*'] },
    { name: 'Bantuan', href: '/dashboard/bantuan', icon: '🆘', roles: ['*'] },
    { name: 'Pengaturan', href: '/dashboard/pengaturan', icon: '⚙️', roles: ['*'] },
  ];

  const adminNavItems: any[] = [];

  if (user?.role === 'super_admin') {
    adminNavItems.push({ name: 'Super Admin', href: '/super-admin', icon: '🛡️', roles: ['super_admin'] });
  }
  if (['pastor', 'wakil_ketua_dpp', 'sekretaris_dpp', 'bendahara_dpp', 'koordinator_bidang'].includes(user?.role || '')) {
    adminNavItems.push({ name: 'Admin Paroki', href: '/admin/paroki', icon: '🏢', roles: ['pastor', 'wakil_ketua_dpp', 'sekretaris_dpp', 'bendahara_dpp', 'koordinator_bidang'] });
  }
  if (['ketua_lingkungan', 'sekretaris_lingkungan', 'bendahara_lingkungan', 'wali_digital_lingkungan'].includes(user?.role || '')) {
    adminNavItems.push({ name: 'Admin Lingkungan', href: `/admin/lingkungan/${user?.lingkungan_slug?.toLowerCase()}`, icon: '🏘️', roles: ['ketua_lingkungan', 'sekretaris_lingkungan', 'bendahara_lingkungan', 'wali_digital_lingkungan'] });
  }

  const allNavItems = [...baseNavItems, ...adminNavItems];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] border-r border-gray-800 flex flex-col">
        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#e2b04a] flex items-center justify-center text-black text-xl font-bold">
              {user?.nama_baptis?.[0] || user?.full_name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {user?.nama_baptis && `${user.nama_baptis} `}
                {user?.full_name}
              </p>
              <p className="text-gray-400 text-xs capitalize">
                {user?.role?.replace(/_/g, ' ')}
                {user?.lingkungan_slug && ` • ${user.lingkungan_slug}`}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {allNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-[#e2b04a] text-black font-semibold'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/auth/logout"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}