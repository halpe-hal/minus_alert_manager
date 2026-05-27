import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getShopData } from '@/lib/data';
import { getShopConfig } from '@/lib/shop-config';
import { getPermittedShops } from '@/lib/permissions';
import ShopHeader from '@/components/ShopHeader';
import DeadlineSection from '@/components/DeadlineSection';
import MinusForm from '@/components/MinusForm';
import MinusGroups from '@/components/MinusGroups';

export default async function ShopPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId: storeIdStr } = await params;
  const storeId = parseInt(storeIdStr, 10);
  if (isNaN(storeId)) notFound();

  const permittedShops = await getPermittedShops();
  if (!permittedShops.some((s) => s.id === storeId)) redirect('/');

  const [shopConfig, { currentDeadline, records }] = await Promise.all([
    getShopConfig(storeId),
    getShopData(storeId),
  ]);

  if (!shopConfig) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ShopHeader
        stores={permittedShops}
        currentStoreId={storeId}
        storeName={shopConfig.name}
      />

      <DeadlineSection storeId={storeId} currentDeadline={currentDeadline} />
      <hr className="my-6 border-gray-200" />
      <MinusForm storeId={storeId} groups={shopConfig.groups} />
      <hr className="my-6 border-gray-200" />
      <MinusGroups storeId={storeId} groups={shopConfig.groups} records={records} />
    </div>
  );
}
