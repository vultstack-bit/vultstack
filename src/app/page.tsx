import CRMApp from '@/components/crm/CRMApp';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Vultstack CRM' };

export default function Home() {
  return <CRMApp businessUnit="vultstack" />;
}
