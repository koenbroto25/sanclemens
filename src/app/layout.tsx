export const dynamic = 'force-dynamic'
import type { Metadata } from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import SuperAdminShortcut from '@/components/SuperAdminShortcut';
import { AuthProvider } from '@/lib/auth';
import { SuperAdminProvider } from '@/lib/super-admin-context';

export const metadata: Metadata = {
  title: 'Paroki Santo Klemens Sepinggan',
  description: 'Gereja Santo Martinus Â· Lanud Balikpapan Â· Keuskupan Agung Samarinda',
  keywords: [
    'Paroki Santo Klemens',
    'Gereja Katolik',
    'Balikpapan',
    'Digital Parish',
    'Ekosistem Digital',
  ],
  authors: [{ name: 'Tim ICT Paroki Santo Klemens' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans")}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain-overlay antialiased" style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        <AuthProvider>
          <SuperAdminProvider>
            {children}
            <SuperAdminShortcut />
          </SuperAdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
