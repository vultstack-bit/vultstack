import type { Metadata, Viewport } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vultstack CRM',
  description: 'Vultstack — CRM',
  manifest: '/crm-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vultstack CRM',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111111',
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
