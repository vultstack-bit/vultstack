import type { Metadata, Viewport } from 'next';
import AnalyticsScripts from '@/components/AnalyticsScripts';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.vultstack.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Vultstack',
    template: '%s | Vultstack',
  },
  description: 'Vultstack — CRM & campaign management.',
  applicationName: 'Vultstack',
  formatDetection: { telephone: true, address: true, email: true },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vultstack',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AnalyticsScripts />
        {children}
      </body>
    </html>
  );
}
