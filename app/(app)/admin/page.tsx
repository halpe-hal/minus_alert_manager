import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAILS, getPermittedShops } from '@/lib/permissions';
import { getShopConfig } from '@/lib/shop-config';
import AdminClient from '@/components/admin/AdminClient';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/');
  }

  const stores = await getPermittedShops();
  const shopConfigs = (
    await Promise.all(stores.map((s) => getShopConfig(s.id)))
  ).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-sm text-[#006a38] hover:underline">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>
      </div>
      <AdminClient stores={stores} initialConfigs={shopConfigs as NonNullable<typeof shopConfigs[number]>[]} />
    </div>
  );
}
